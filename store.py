# store.py
# projects.json ve stats.json dosyalarını okuyup yazan yardımcı katman.
# Admin panel de dahil, tüm proje ekleme/düzenleme/silme işlemleri buradan geçer.

import json
import os
import re
import threading
import random
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")
STATS_FILE = os.path.join(DATA_DIR, "stats.json")

_lock = threading.Lock()


def _read_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path, data):
    with _lock:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------- Projeler ----------

def all_projects():
    return _read_json(PROJECTS_FILE, [])


def save_projects(projects):
    _write_json(PROJECTS_FILE, projects)


def get_project(slug):
    return next((p for p in all_projects() if p["slug"] == slug), None)


def is_visible(p):
    """Bir projenin herkese açık sayfalarda görünüp görünmeyeceğini belirler."""
    if not p.get("published", True):
        return False
    publish_at = p.get("publish_at")
    if publish_at and publish_at > _now_iso():
        return False
    return True


def by_kind(kind, published_only=True):
    items = [p for p in all_projects() if p["kind"] == kind]
    if published_only:
        items = [p for p in items if is_visible(p)]
    return items


def by_group(kind_list, published_only=True):
    items = [p for p in all_projects() if p["kind"] in kind_list]
    if published_only:
        items = [p for p in items if is_visible(p)]
    return items


def recent_projects(limit=6, published_only=True):
    items = [p for p in all_projects() if not published_only or is_visible(p)]
    items.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    return items[:limit]


def random_project(published_only=True):
    items = [p for p in all_projects() if not published_only or is_visible(p)]
    return random.choice(items) if items else None


def all_tags(published_only=True):
    items = [p for p in all_projects() if not published_only or is_visible(p)]
    tags = set()
    for p in items:
        for t in p.get("tags", []):
            tags.add(t)
    return sorted(tags, key=str.lower)


def projects_with_tag(tag, published_only=True):
    items = [p for p in all_projects() if not published_only or is_visible(p)]
    return [p for p in items if tag.lower() in [t.lower() for t in p.get("tags", [])]]


def similar_projects(project, limit=4):
    my_tags = {t.lower() for t in project.get("tags", [])}
    if not my_tags:
        return []
    scored = []
    for p in all_projects():
        if p["slug"] == project["slug"] or not is_visible(p):
            continue
        overlap = len({t.lower() for t in p.get("tags", [])} & my_tags)
        if overlap:
            scored.append((overlap, p))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:limit]]


def search_projects(query, published_only=True):
    q = query.strip().lower()
    if not q:
        return []
    items = [p for p in all_projects() if not published_only or is_visible(p)]
    results = []
    for p in items:
        haystack = " ".join([
            p.get("name", ""), p.get("desc", ""), p.get("tagline", ""),
            " ".join(p.get("tags", [])),
        ]).lower()
        if q in haystack:
            results.append(p)
    return results


def slugify(name):
    s = name.strip().lower()
    tr_map = str.maketrans("çğıöşü", "cgiosu")
    s = s.translate(tr_map)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "proje"


def unique_slug(name, exclude_slug=None):
    base = slugify(name)
    existing = {p["slug"] for p in all_projects() if p["slug"] != exclude_slug}
    if base not in existing:
        return base
    i = 2
    while f"{base}-{i}" in existing:
        i += 1
    return f"{base}-{i}"


def add_project(project):
    projects = all_projects()
    project.setdefault("created_at", _now_iso())
    project.setdefault("published", True)
    projects.append(project)
    save_projects(projects)


def update_project(slug, updated):
    projects = all_projects()
    for i, p in enumerate(projects):
        if p["slug"] == slug:
            updated.setdefault("created_at", p.get("created_at", _now_iso()))
            updated.setdefault("published", p.get("published", True))
            projects[i] = updated
            break
    save_projects(projects)


def delete_project(slug):
    projects = [p for p in all_projects() if p["slug"] != slug]
    save_projects(projects)


def reorder_kind(kind, slug_order):
    """Tek bir kategori içindeki projeleri verilen slug sırasına göre yeniden dizer."""
    projects = all_projects()
    kind_items = {p["slug"]: p for p in projects if p["kind"] == kind}
    others = [p for p in projects if p["kind"] != kind]
    reordered = [kind_items[s] for s in slug_order if s in kind_items]
    # Sıra listesinde eksik kalan (senkron dışı) varsa sona ekle
    for slug, p in kind_items.items():
        if slug not in slug_order:
            reordered.append(p)
    save_projects(others + reordered)


# ---------- İstatistikler ----------

def _default_stats():
    return {"visits": 0, "visits_by_day": {}, "plays": {}, "downloads": {}}


def get_stats():
    stats = _read_json(STATS_FILE, _default_stats())
    stats.setdefault("visits_by_day", {})
    return stats


def bump_visit():
    stats = get_stats()
    stats["visits"] = stats.get("visits", 0) + 1
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    stats.setdefault("visits_by_day", {})
    stats["visits_by_day"][today] = stats["visits_by_day"].get(today, 0) + 1
    _write_json(STATS_FILE, stats)
    return stats["visits"]


def bump_play(slug):
    stats = get_stats()
    stats.setdefault("plays", {})
    stats["plays"][slug] = stats["plays"].get(slug, 0) + 1
    _write_json(STATS_FILE, stats)
    return stats["plays"][slug]


def bump_download(slug):
    stats = get_stats()
    stats.setdefault("downloads", {})
    stats["downloads"][slug] = stats["downloads"].get(slug, 0) + 1
    _write_json(STATS_FILE, stats)
    return stats["downloads"][slug]


def last_n_days(n=14):
    """Son n günün (tarih, ziyaret) listesini döner -- grafik için."""
    from datetime import timedelta
    stats = get_stats()
    by_day = stats.get("visits_by_day", {})
    today = datetime.now(timezone.utc).date()
    days = [today - timedelta(days=i) for i in range(n - 1, -1, -1)]
    return [(d.strftime("%d.%m"), by_day.get(d.strftime("%Y-%m-%d"), 0)) for d in days]


# ---------- Beğeniler ----------

def toggle_like(slug, visitor_id):
    """Bir ziyaretçinin beğenisini açar/kapatır. (yeni_sayı, begendi_mi) döner."""
    stats = get_stats()
    stats.setdefault("likes", {})
    stats.setdefault("liked_by", {})
    liked_by = stats["liked_by"].setdefault(slug, [])
    if visitor_id in liked_by:
        liked_by.remove(visitor_id)
        liked = False
    else:
        liked_by.append(visitor_id)
        liked = True
    stats["likes"][slug] = len(liked_by)
    _write_json(STATS_FILE, stats)
    return stats["likes"][slug], liked


def has_liked(slug, visitor_id):
    stats = get_stats()
    return visitor_id in stats.get("liked_by", {}).get(slug, [])


def like_count(slug):
    stats = get_stats()
    return stats.get("likes", {}).get(slug, 0)


# ---------- Yorumlar ----------

COMMENTS_FILE = os.path.join(DATA_DIR, "comments.json")


def all_comments():
    return _read_json(COMMENTS_FILE, [])


def _save_comments(comments):
    _write_json(COMMENTS_FILE, comments)


def comments_for(slug, approved_only=True):
    items = [c for c in all_comments() if c["slug"] == slug]
    if approved_only:
        items = [c for c in items if c.get("approved")]
    return sorted(items, key=lambda c: c["created_at"], reverse=True)


def pending_comments():
    return sorted(
        [c for c in all_comments() if not c.get("approved")],
        key=lambda c: c["created_at"], reverse=True,
    )


def add_comment(slug, name, text):
    import uuid as _uuid
    comments = all_comments()
    comment = {
        "id": _uuid.uuid4().hex[:10],
        "slug": slug,
        "name": (name or "Misafir").strip()[:40] or "Misafir",
        "text": text.strip()[:600],
        "approved": False,
        "created_at": _now_iso(),
    }
    comments.append(comment)
    _save_comments(comments)
    return comment


def approve_comment(comment_id):
    comments = all_comments()
    for c in comments:
        if c["id"] == comment_id:
            c["approved"] = True
    _save_comments(comments)


def delete_comment(comment_id):
    comments = [c for c in all_comments() if c["id"] != comment_id]
    _save_comments(comments)


# ---------- Toplu admin işlemleri ----------

def bulk_set_published(slugs, published):
    projects = all_projects()
    for p in projects:
        if p["slug"] in slugs:
            p["published"] = published
    save_projects(projects)


def bulk_delete(slugs):
    projects = [p for p in all_projects() if p["slug"] not in slugs]
    save_projects(projects)


# ---------- Devlog ----------

DEVLOG_FILE = os.path.join(DATA_DIR, "devlog.json")


def all_devlog_entries():
    items = _read_json(DEVLOG_FILE, [])
    return sorted(items, key=lambda e: e.get("created_at", ""), reverse=True)


def add_devlog_entry(title, body):
    import uuid as _uuid
    entries = _read_json(DEVLOG_FILE, [])
    entry = {
        "id": _uuid.uuid4().hex[:10],
        "title": title.strip()[:120],
        "body": body.strip()[:4000],
        "created_at": _now_iso(),
    }
    entries.append(entry)
    _write_json(DEVLOG_FILE, entries)
    return entry


def delete_devlog_entry(entry_id):
    entries = [e for e in _read_json(DEVLOG_FILE, []) if e["id"] != entry_id]
    _write_json(DEVLOG_FILE, entries)


# ---------- Hakkımda ----------

ABOUT_FILE = os.path.join(DATA_DIR, "about.json")


def get_about():
    return _read_json(ABOUT_FILE, {"bio": "", "tools": [], "photo": None})


def save_about(data):
    _write_json(ABOUT_FILE, data)


# ---------- Yol haritası ----------

ROADMAP_FILE = os.path.join(DATA_DIR, "roadmap.json")


def all_roadmap_items():
    return _read_json(ROADMAP_FILE, [])


def add_roadmap_item(title, desc, eta):
    import uuid as _uuid
    items = _read_json(ROADMAP_FILE, [])
    item = {"id": _uuid.uuid4().hex[:10], "title": title.strip()[:120], "desc": desc.strip()[:400], "eta": eta.strip()[:60]}
    items.append(item)
    _write_json(ROADMAP_FILE, items)
    return item


def delete_roadmap_item(item_id):
    items = [i for i in _read_json(ROADMAP_FILE, []) if i["id"] != item_id]
    _write_json(ROADMAP_FILE, items)

