# store.py
# projects.json ve stats.json dosyalarını okuyup yazan yardımcı katman.
# Admin panel de dahil, tüm proje ekleme/düzenleme/silme işlemleri buradan geçer.

import json
import os
import re
import threading

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


# ---------- Projeler ----------

def all_projects():
    return _read_json(PROJECTS_FILE, [])


def save_projects(projects):
    _write_json(PROJECTS_FILE, projects)


def get_project(slug):
    return next((p for p in all_projects() if p["slug"] == slug), None)


def by_kind(kind):
    return [p for p in all_projects() if p["kind"] == kind]


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
    projects.append(project)
    save_projects(projects)


def update_project(slug, updated):
    projects = all_projects()
    for i, p in enumerate(projects):
        if p["slug"] == slug:
            projects[i] = updated
            break
    save_projects(projects)


def delete_project(slug):
    projects = [p for p in all_projects() if p["slug"] != slug]
    save_projects(projects)


# ---------- İstatistikler ----------

def _default_stats():
    return {"visits": 0, "plays": {}, "downloads": {}}


def get_stats():
    return _read_json(STATS_FILE, _default_stats())


def bump_visit():
    stats = get_stats()
    stats["visits"] = stats.get("visits", 0) + 1
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
