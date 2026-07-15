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


def by_kind(kind, published_only=True):
    items = [p for p in all_projects() if p["kind"] == kind]
    if published_only:
        items = [p for p in items if p.get("published", True)]
    return items


def by_group(kind_list, published_only=True):
    items = [p for p in all_projects() if p["kind"] in kind_list]
    if published_only:
        items = [p for p in items if p.get("published", True)]
    return items


def recent_projects(limit=6, published_only=True):
    items = [p for p in all_projects() if not published_only or p.get("published", True)]
    items.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    return items[:limit]


def random_project(published_only=True):
    items = [p for p in all_projects() if not published_only or p.get("published", True)]
    return random.choice(items) if items else None


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
