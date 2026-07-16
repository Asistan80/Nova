import os
from functools import wraps
from datetime import timedelta, datetime, timezone

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


def _compress_image(path, max_width=1600, quality=85):
    """Büyük görselleri küçültüp sıkıştırır (GIF'lere dokunmaz -- animasyonu bozar)."""
    if path.lower().endswith(".gif"):
        return
    try:
        from PIL import Image
        img = Image.open(path)
        fmt = img.format
        changed = False
        if img.width > max_width:
            ratio = max_width / img.width
            img = img.resize((max_width, int(img.height * ratio)), Image.LANCZOS)
            changed = True
        save_kwargs = {}
        if fmt in ("JPEG", "WEBP"):
            save_kwargs["quality"] = quality
            save_kwargs["optimize"] = True
        if changed or fmt in ("JPEG", "WEBP", "PNG"):
            img.save(path, format=fmt, **save_kwargs)
    except Exception:
        pass  # sıkıştırma başarısız olursa orijinal dosya olduğu gibi kalır


def _make_gif_poster(gif_path, poster_path):
    """GIF'in ilk karesini durağan bir PNG olarak kaydeder (hover'da oynat efekti için)."""
    try:
        from PIL import Image
        img = Image.open(gif_path)
        img.seek(0)
        img.convert("RGB").save(poster_path, format="PNG")
    except Exception:
        pass


def _sync_projects_json(message):
    if github_sync.is_enabled():
        github_sync.push_file(store.PROJECTS_FILE, "data/projects.json", message)


# ---------- Ziyaretçi sayacı ----------

@app.before_request
def _count_visit():
    ep = request.endpoint or ""
    if ep in ("index", "category_list", "category_detail", "tag_page", "search_page",
              "devlog_page", "about_page", "roadmap_page"):
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


def _get_visitor_id():
    vid = session.get("site_visitor_id")
    if not vid:
        import uuid as _uuid
        vid = _uuid.uuid4().hex
        session["site_visitor_id"] = vid
        session.permanent = True
    return vid


@app.route("/kategori/<group_slug>/<slug>")
def category_detail(group_slug, slug):
    group = cat.group_by_slug(group_slug)
    if not group:
        abort(404)
    project = store.get_project(slug)
    if not project or cat.group_for_kind(project["kind"]) != group_slug:
        abort(404)
    if not store.is_visible(project) and not session.get("is_admin"):
        abort(404)
    stats = store.get_stats()
    leaderboard = None
    if project["slug"] == "rise-of-the-bosses":
        leaderboard = _rise_of_the_bosses_leaderboard()
    visitor_id = _get_visitor_id()
    return render_template(
        "detail.html", p=project, stats=stats,
        category=cat.CATEGORIES[project["kind"]], leaderboard=leaderboard,
        like_count=store.like_count(slug), liked=store.has_liked(slug, visitor_id),
        comments=store.comments_for(slug),
        similar=store.similar_projects(project),
        categories=cat.CATEGORIES,
    )


def _rise_of_the_bosses_leaderboard(limit=5):
    import json as _json
    path = os.path.join(
        BASE_DIR, "games_blueprints", "rise_of_the_bosses", "data", "leaderboard.json"
    )
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            entries = _json.load(f)
    except (ValueError, OSError):
        return []
    entries = sorted(entries, key=lambda e: e.get("score", 0), reverse=True)
    return entries[:limit]


@app.route("/begen/<slug>", methods=["POST"])
def like_project(slug):
    project = store.get_project(slug)
    if not project:
        abort(404)
    visitor_id = _get_visitor_id()
    count, liked = store.toggle_like(slug, visitor_id)
    return {"count": count, "liked": liked}


@app.route("/yorum/<slug>", methods=["POST"])
def submit_comment(slug):
    project = store.get_project(slug)
    if not project:
        abort(404)
    group = cat.group_for_kind(project["kind"])
    redirect_url = url_for("category_detail", group_slug=group, slug=slug)

    # Honeypot: gerçek kullanıcılar bu alanı görmez/doldurmaz, botlar genelde doldurur.
    if request.form.get("website"):
        return redirect(redirect_url)

    text = request.form.get("text", "").strip()
    if not text:
        flash("Yorum boş olamaz.")
        return redirect(redirect_url)

    # Basit oturum bazlı hız sınırlama (20 saniyede bir yorum)
    last = session.get("last_comment_at")
    now_ts = datetime.now(timezone.utc).timestamp()
    if last and now_ts - last < 20:
        flash("Çok hızlı yorum gönderdin, biraz bekle.")
        return redirect(redirect_url)
    session["last_comment_at"] = now_ts

    name = request.form.get("name", "").strip()
    store.add_comment(slug, name, text)
    flash("Yorumun gönderildi — onaylandıktan sonra görünecek.")
    return redirect(redirect_url)


@app.route("/etiket/<tag>")
def tag_page(tag):
    items = store.projects_with_tag(tag)
    return render_template("tag.html", tag=tag, items=items, categories=cat.CATEGORIES, stats=store.get_stats())


@app.route("/ara")
def search_page():
    q = request.args.get("q", "")
    results = store.search_projects(q) if q else []
    return render_template("search.html", query=q, results=results, categories=cat.CATEGORIES, stats=store.get_stats())


@app.route("/feed.xml")
def feed_xml():
    root = request.url_root.rstrip("/")
    items = store.recent_projects(limit=20)
    body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0"><channel>',
        '<title>Murnova Dünyası</title>',
        f'<link>{root}/</link>',
        '<description>MuBiKu&apos;nun oyun, uygulama ve medya vitrini</description>',
    ]
    for p in items:
        group = cat.group_for_kind(p["kind"])
        link = f"{root}/kategori/{group}/{p['slug']}"
        import html as _html
        body.append("<item>")
        body.append(f"<title>{_html.escape(p['name'])}</title>")
        body.append(f"<link>{link}</link>")
        body.append(f"<guid>{link}</guid>")
        body.append(f"<description>{_html.escape(p.get('tagline') or p.get('desc',''))}</description>")
        body.append(f"<pubDate>{p.get('created_at','')}</pubDate>")
        body.append("</item>")
    body.append("</channel></rss>")
    return "\n".join(body), 200, {"Content-Type": "application/rss+xml; charset=utf-8"}


@app.route("/devlog")
def devlog_page():
    return render_template("devlog.html", entries=store.all_devlog_entries())


@app.route("/hakkimda")
def about_page():
    return render_template("about.html", about=store.get_about())


@app.route("/yol-haritasi")
def roadmap_page():
    return render_template("roadmap.html", items=store.all_roadmap_items())


@app.route("/rastgele")
def random_project():
    project = store.random_project()
    if not project:
        return redirect(url_for("index"))
    group = cat.group_for_kind(project["kind"])
    return redirect(url_for("category_detail", group_slug=group, slug=project["slug"]))


@app.route("/robots.txt")
def robots_txt():
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        f"Sitemap: {request.url_root.rstrip('/')}/sitemap.xml",
    ]
    return "\n".join(lines), 200, {"Content-Type": "text/plain; charset=utf-8"}


@app.route("/sitemap.xml")
def sitemap_xml():
    root = request.url_root.rstrip("/")
    urls = [root + "/"]
    for g in cat.GROUPS.values():
        urls.append(f"{root}/kategori/{g['slug']}")
    for p in store.all_projects():
        if not store.is_visible(p):
            continue
        group = cat.group_for_kind(p["kind"])
        urls.append(f"{root}/kategori/{group}/{p['slug']}")
    body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        body.append(f"  <url><loc>{u}</loc></url>")
    body.append("</urlset>")
    return "\n".join(body), 200, {"Content-Type": "application/xml; charset=utf-8"}


@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404



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


@app.route("/medya/<slug>/poster")
def media_poster(slug):
    """GIF'ler için durağan önizleme karesi (kartlarda hover'a kadar bunu gösteririz)."""
    folder = os.path.join(DOWNLOADS_DIR, slug)
    poster_path = os.path.join(folder, "_poster.png")
    if not os.path.exists(poster_path):
        abort(404)
    return send_from_directory(folder, "_poster.png", as_attachment=False)


# ---------- Admin: proje yönetimi ----------

@app.route("/admin")
@login_required
def admin_dashboard():
    by_kind = {k: store.by_kind(k, published_only=False) for k in cat.CATEGORIES}
    return render_template(
        "admin/dashboard.html",
        by_kind=by_kind,
        categories=cat.CATEGORIES,
        stats=store.get_stats(),
        visit_chart=store.last_n_days(14),
        pending_count=len(store.pending_comments()),
    )


@app.route("/admin/sirala/<kind>", methods=["POST"])
@login_required
def admin_reorder(kind):
    order = request.get_json(force=True) or []
    store.reorder_kind(kind, order)
    _sync_projects_json(f"sıralama güncellendi: {kind}")
    return {"ok": True}


@app.route("/admin/yorumlar")
@login_required
def admin_comments():
    projects_by_slug = {p["slug"]: p for p in store.all_projects()}
    pending = store.pending_comments()
    approved = [c for c in store.all_comments() if c.get("approved")]
    approved.sort(key=lambda c: c["created_at"], reverse=True)
    return render_template(
        "admin/comments.html",
        pending=pending, approved=approved, projects_by_slug=projects_by_slug,
    )


@app.route("/admin/yorum-onayla/<comment_id>", methods=["POST"])
@login_required
def admin_approve_comment(comment_id):
    store.approve_comment(comment_id)
    return redirect(url_for("admin_comments"))


@app.route("/admin/yorum-sil/<comment_id>", methods=["POST"])
@login_required
def admin_delete_comment(comment_id):
    store.delete_comment(comment_id)
    return redirect(url_for("admin_comments"))


@app.route("/admin/toplu/<action>", methods=["POST"])
@login_required
def admin_bulk(action):
    data = request.get_json(force=True) or {}
    slugs = data.get("slugs", [])
    if action == "yayina-al":
        store.bulk_set_published(slugs, True)
    elif action == "gizle":
        store.bulk_set_published(slugs, False)
    elif action == "sil":
        for slug in slugs:
            project = store.get_project(slug)
            if project:
                _cleanup_project_files(project)
        store.bulk_delete(slugs)
    else:
        return {"ok": False, "error": "bilinmeyen işlem"}, 400
    _sync_projects_json(f"toplu işlem: {action} ({len(slugs)} öğe)")
    return {"ok": True}


@app.route("/admin/devlog", methods=["GET", "POST"])
@login_required
def admin_devlog():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        body = request.form.get("body", "").strip()
        if title and body:
            store.add_devlog_entry(title, body)
            flash("Devlog kaydı eklendi.")
        return redirect(url_for("admin_devlog"))
    return render_template("admin/devlog.html", entries=store.all_devlog_entries())


@app.route("/admin/devlog/sil/<entry_id>", methods=["POST"])
@login_required
def admin_devlog_delete(entry_id):
    store.delete_devlog_entry(entry_id)
    return redirect(url_for("admin_devlog"))


@app.route("/admin/hakkimda", methods=["GET", "POST"])
@login_required
def admin_about():
    if request.method == "POST":
        about = store.get_about()
        about["bio"] = request.form.get("bio", "").strip()
        about["tools"] = [t.strip() for t in request.form.get("tools", "").split(",") if t.strip()]
        photo = request.files.get("photo")
        if photo and photo.filename and ext_ok(photo.filename, ALLOWED_IMAGE_EXT):
            ext = photo.filename.rsplit(".", 1)[1].lower()
            fname = f"about.{ext}"
            local_path = os.path.join(COVERS_DIR, fname)
            photo.save(local_path)
            _compress_image(local_path)
            about["photo"] = fname
        store.save_about(about)
        flash("Hakkımda sayfası güncellendi.")
        return redirect(url_for("admin_about"))
    return render_template("admin/about.html", about=store.get_about())


@app.route("/admin/yol-haritasi", methods=["GET", "POST"])
@login_required
def admin_roadmap():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        desc = request.form.get("desc", "").strip()
        eta = request.form.get("eta", "").strip()
        if title:
            store.add_roadmap_item(title, desc, eta)
            flash("Yol haritasına eklendi.")
        return redirect(url_for("admin_roadmap"))
    return render_template("admin/roadmap.html", items=store.all_roadmap_items())


@app.route("/admin/yol-haritasi/sil/<item_id>", methods=["POST"])
@login_required
def admin_roadmap_delete(item_id):
    store.delete_roadmap_item(item_id)
    return redirect(url_for("admin_roadmap"))


def _extract_youtube_id(url):
    if not url:
        return ""
    import re as _re
    m = _re.search(r"(?:v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})", url)
    if m:
        return m.group(1)
    if len(url) == 11:
        return url
    return ""


def _parse_publish_at(value):
    """HTML datetime-local girdisini ISO formatına çevirir, boşsa None döner."""
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return None


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
        "published": form.get("published") == "on",
        "youtube_url": _extract_youtube_id(form.get("youtube_url", "").strip()),
        "publish_at": _parse_publish_at(form.get("publish_at", "").strip()),
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
        _compress_image(local_path)
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
                _compress_image(local_path)
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
        if project.get("kind") == "resim":
            _compress_image(local_path)
        if project.get("kind") == "gif":
            _make_gif_poster(local_path, os.path.join(pdir, "_poster.png"))
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
