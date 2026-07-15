import os
from functools import wraps
from datetime import timedelta

from flask import (
    Flask, render_template, send_from_directory, abort, request,
    redirect, url_for, session, flash
)
from werkzeug.utils import secure_filename

import store
import github_sync
import categories as cat
from games_blueprints.rise_of_the_bosses import bp as rise_of_the_bosses_bp

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-degistir-bunu")
# Oyun ilerlemesinin (ziyaretçi bazlı kayıt) uzun süre hatırlanması için
app.permanent_session_lifetime = timedelta(days=365)

app.register_blueprint(rise_of_the_bosses_bp)

# Render'da Environment sekmesinden ADMIN_PASSWORD değişkenini ayarla.
# Ayarlamazsan bu varsayılan şifre kullanılır -- güvenlik için mutlaka değiştir.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "murnova2026")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COVERS_DIR = os.path.join(BASE_DIR, "static", "uploads", "covers")
GALLERY_DIR = os.path.join(BASE_DIR, "static", "uploads", "gallery")
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
GAMES_DIR = os.path.join(BASE_DIR, "games")

ALLOWED_IMAGE_EXT = {"png", "jpg", "jpeg", "gif", "webp"}
ALLOWED_PACKAGE_EXT = {"zip"}

for d in (COVERS_DIR, GALLERY_DIR, DOWNLOADS_DIR, GAMES_DIR):
    os.makedirs(d, exist_ok=True)


def ext_ok(filename, allowed):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed


def _allowed_exts_for_kind(kind):
    category = cat.CATEGORIES.get(kind)
    return category["file_exts"] if category else ALLOWED_PACKAGE_EXT


def _sync_projects_json(message):
    if github_sync.is_enabled():
        github_sync.push_file(store.PROJECTS_FILE, "data/projects.json", message)


# ---------- Ziyaretçi sayacı ----------

@app.before_request
def _count_visit():
    ep = request.endpoint or ""
    if ep in ("index", "category_list", "category_detail"):
        store.bump_visit()


# ---------- Admin girişi ----------

def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("is_admin"):
            return redirect(url_for("admin_login", next=request.path))
        return f(*args, **kwargs)
    return wrapper


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        if request.form.get("password") == ADMIN_PASSWORD:
            session["is_admin"] = True
            return redirect(request.args.get("next") or url_for("admin_dashboard"))
        flash("Şifre yanlış.")
    return render_template("admin/login.html")


@app.route("/admin/logout")
def admin_logout():
    session.pop("is_admin", None)
    return redirect(url_for("index"))


# ---------- Halka açık sayfalar ----------

@app.route("/")
def index():
    stats = store.get_stats()
    group_counts = {
        g: len(store.by_group(cat.kinds_in_group(g))) for g in cat.GROUPS
    }
    return render_template(
        "index.html",
        stats=stats,
        groups=cat.GROUPS,
        group_counts=group_counts,
        recent=store.recent_projects(6),
        categories=cat.CATEGORIES,
    )


@app.route("/kategori/<group_slug>")
def category_list(group_slug):
    group = cat.group_by_slug(group_slug)
    if not group:
        abort(404)
    kinds = cat.kinds_in_group(group_slug)
    items = store.by_group(kinds)
    stats = store.get_stats()
    return render_template(
        "category.html",
        group=group,
        kinds=kinds,
        items=items,
        categories=cat.CATEGORIES,
        stats=stats,
    )


@app.route("/kategori/<group_slug>/<slug>")
def category_detail(group_slug, slug):
    group = cat.group_by_slug(group_slug)
    if not group:
        abort(404)
    project = store.get_project(slug)
    if not project or cat.group_for_kind(project["kind"]) != group_slug:
        abort(404)
    stats = store.get_stats()
    return render_template("detail.html", p=project, stats=stats, category=cat.CATEGORIES[project["kind"]])


@app.route("/oyna/<slug>")
def play(slug):
    """
    Oyunun kendisini burada göstereceğiz.

    Entegrasyon için iki yöntemden biri kullanılabilir:
    1) Blueprint: Oyunun kendi Flask uygulamasını bir Blueprint'e çevirip
       burada import + register_blueprint ile bağlamak (tek sunucu, tek port).
    2) iframe: Oyunu ayrı bir process/port'ta çalıştırıp play.html içinde
       <iframe src="..."> ile göstermek.

    Oyunun dosyaları admin panelden yüklendiğinde games/<slug>/ altına
    kaydediliyor; gerçek bağlantıyı birlikte yaparız.
    """
    project = store.get_project(slug)
    if not project:
        abort(404)
    store.bump_play(slug)
    return render_template("play.html", p=project)


@app.route("/indir/<slug>")
def download(slug):
    project = store.get_project(slug)
    if not project:
        abort(404)
    folder = os.path.join(DOWNLOADS_DIR, slug)
    filename = project.get("download_file")
    if not filename or not os.path.exists(os.path.join(folder, filename)):
        return render_template("download_pending.html", p=project)
    store.bump_download(slug)
    return send_from_directory(folder, filename, as_attachment=True)


@app.route("/medya/<slug>")
def media_inline(slug):
    """Resim/GIF/ses dosyalarını indirme zorlamadan tarayıcıda gösterir (önizleme, oynatma)."""
    project = store.get_project(slug)
    if not project:
        abort(404)
    folder = os.path.join(DOWNLOADS_DIR, slug)
    filename = project.get("download_file")
    if not filename or not os.path.exists(os.path.join(folder, filename)):
        abort(404)
    return send_from_directory(folder, filename, as_attachment=False)


# ---------- Admin: proje yönetimi ----------

@app.route("/admin")
@login_required
def admin_dashboard():
    by_kind = {k: store.by_kind(k) for k in cat.CATEGORIES}
    return render_template(
        "admin/dashboard.html",
        by_kind=by_kind,
        categories=cat.CATEGORIES,
        stats=store.get_stats(),
    )


def _project_from_form(form, existing=None):
    tags = [t.strip() for t in form.get("tags", "").split(",") if t.strip()]
    features = [f.strip() for f in form.get("features", "").splitlines() if f.strip()]
    changelog = [c.strip() for c in form.get("changelog", "").splitlines() if c.strip()]
    data = {
        "name": form.get("name", "").strip(),
        "kind": form.get("kind"),
        "status": form.get("status"),
        "tagline": form.get("tagline", "").strip(),
        "desc": form.get("desc", "").strip(),
        "tags": tags,
        "features": features,
        "changelog": changelog,
        "version": form.get("version", "").strip() or "1.0",
    }
    if existing:
        merged = dict(existing)
        merged.update(data)
        return merged
    data.update({
        "cover": None,
        "gallery": [],
        "play_url": None,
        "download_url": None,
        "download_file": None,
        "updated_at": "",
    })
    return data


@app.route("/admin/yeni", methods=["GET", "POST"])
@login_required
def admin_new():
    if request.method == "POST":
        project = _project_from_form(request.form)
        project["slug"] = store.unique_slug(project["name"])
        if project["kind"] == "oyun":
            project["play_url"] = f"/oyna/{project['slug']}"
        _handle_uploads(project, request.files)
        store.add_project(project)
        _sync_projects_json(f"proje eklendi: {project['name']}")
        flash(f"\"{project['name']}\" rafa eklendi.")
        return redirect(url_for("admin_dashboard"))
    return render_template("admin/form.html", p=None, categories=cat.CATEGORIES)


@app.route("/admin/duzenle/<slug>", methods=["GET", "POST"])
@login_required
def admin_edit(slug):
    project = store.get_project(slug)
    if not project:
        abort(404)
    if request.method == "POST":
        updated = _project_from_form(request.form, existing=project)
        _handle_uploads(updated, request.files)
        store.update_project(slug, updated)
        _sync_projects_json(f"proje güncellendi: {updated['name']}")
        flash(f"\"{updated['name']}\" güncellendi.")
        return redirect(url_for("admin_dashboard"))
    return render_template("admin/form.html", p=project, categories=cat.CATEGORIES)


@app.route("/admin/sil/<slug>", methods=["POST"])
@login_required
def admin_delete(slug):
    project = store.get_project(slug)
    if project:
        store.delete_project(slug)
        _sync_projects_json(f"proje silindi: {project['name']}")
        _cleanup_project_files(project)
        flash(f"\"{project['name']}\" rafdan kaldırıldı.")
    return redirect(url_for("admin_dashboard"))


def _cleanup_project_files(project):
    """Silinen projenin yerel dosyalarını ve GitHub'daki yedeklerini temizler."""
    import shutil
    slug = project["slug"]

    if project.get("cover"):
        local = os.path.join(COVERS_DIR, project["cover"])
        if os.path.exists(local):
            os.remove(local)
        if github_sync.is_enabled():
            github_sync.delete_file(f"static/uploads/covers/{project['cover']}", f"kapak silindi: {slug}")

    gdir = os.path.join(GALLERY_DIR, slug)
    if os.path.exists(gdir):
        for fname in project.get("gallery", []):
            if github_sync.is_enabled():
                github_sync.delete_file(f"static/uploads/gallery/{slug}/{fname}", f"galeri silindi: {slug}")
        shutil.rmtree(gdir, ignore_errors=True)

    ddir = os.path.join(DOWNLOADS_DIR, slug)
    if os.path.exists(ddir):
        if project.get("download_file") and github_sync.is_enabled():
            github_sync.delete_file(f"downloads/{slug}/{project['download_file']}", f"paket silindi: {slug}")
        shutil.rmtree(ddir, ignore_errors=True)

    gamedir = os.path.join(GAMES_DIR, slug)
    if os.path.exists(gamedir):
        if github_sync.is_enabled():
            github_sync.delete_file(f"games/{slug}/source.zip", f"oyun kaynağı silindi: {slug}")
        shutil.rmtree(gamedir, ignore_errors=True)


def _handle_uploads(project, files):
    slug = project["slug"]

    cover = files.get("cover")
    if cover and cover.filename and ext_ok(cover.filename, ALLOWED_IMAGE_EXT):
        ext = cover.filename.rsplit(".", 1)[1].lower()
        fname = f"{slug}.{ext}"
        local_path = os.path.join(COVERS_DIR, fname)
        cover.save(local_path)
        project["cover"] = fname
        if github_sync.is_enabled():
            github_sync.push_file(local_path, f"static/uploads/covers/{fname}", f"kapak yüklendi: {slug}")

    gallery_files = files.getlist("gallery")
    if gallery_files:
        gdir = os.path.join(GALLERY_DIR, slug)
        os.makedirs(gdir, exist_ok=True)
        for gf in gallery_files:
            if gf and gf.filename and ext_ok(gf.filename, ALLOWED_IMAGE_EXT):
                safe = secure_filename(gf.filename)
                local_path = os.path.join(gdir, safe)
                gf.save(local_path)
                project.setdefault("gallery", [])
                if safe not in project["gallery"]:
                    project["gallery"].append(safe)
                if github_sync.is_enabled():
                    github_sync.push_file(local_path, f"static/uploads/gallery/{slug}/{safe}", f"galeri görseli: {slug}")

    # İndirilebilir / medya dosyası (kategoriye göre izinli uzantılar değişir:
    # oyun/uygulama için .zip, resim için png/jpg/webp, gif için .gif, ses için mp3/wav/ogg)
    package = files.get("package")
    allowed_exts = _allowed_exts_for_kind(project.get("kind"))
    if package and package.filename and ext_ok(package.filename, allowed_exts):
        pdir = os.path.join(DOWNLOADS_DIR, slug)
        os.makedirs(pdir, exist_ok=True)
        safe = secure_filename(package.filename)
        local_path = os.path.join(pdir, safe)
        package.save(local_path)
        project["download_file"] = safe
        if github_sync.is_enabled():
            github_sync.push_file(local_path, f"downloads/{slug}/{safe}", f"dosya yüklendi: {slug}")

    # Oyun kaynak dosyaları (zip) -- açılıp games/<slug>/ altına konur, orijinal
    # zip de source.zip olarak saklanıp GitHub'a yedeklenir (ileride Blueprint
    # entegrasyonu ve yedekten geri yükleme için).
    game_zip = files.get("game_zip")
    if game_zip and game_zip.filename and ext_ok(game_zip.filename, ALLOWED_PACKAGE_EXT):
        import zipfile
        gdir = os.path.join(GAMES_DIR, slug)
        os.makedirs(gdir, exist_ok=True)
        source_path = os.path.join(gdir, "source.zip")
        game_zip.save(source_path)
        try:
            with zipfile.ZipFile(source_path) as z:
                z.extractall(gdir)
        except zipfile.BadZipFile:
            pass
        project["has_game_files"] = True
        if github_sync.is_enabled():
            github_sync.push_file(source_path, f"games/{slug}/source.zip", f"oyun kaynağı: {slug}")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
