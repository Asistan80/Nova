# categories.py
# Sitedeki tüm içerik kategorilerinin tek merkezi tanımı.
# Yeni bir kategori eklemek istersen (ör. "video") sadece buraya bir
# giriş eklemen yeterli -- rotalar ve şablonlar buradan otomatik besleniyor.

CATEGORIES = {
    "oyun": {
        "label": "Oyunlar",
        "singular": "Oyun",
        "slug": "oyunlar",
        "group": "oyunlar",          # hangi üst sayfada listelenir
        "icon": "controller",
        "file_exts": {"zip"},
        "file_label": "İndirilebilir Paket / Oyun Kaynağı (.zip)",
        "media_kind": False,          # True ise dosyanın kendisi görsel/ses önizlemesi olur
    },
    "uygulama": {
        "label": "Uygulamalar",
        "singular": "Uygulama",
        "slug": "uygulamalar",
        "group": "uygulamalar",
        "icon": "app",
        "file_exts": {"zip"},
        "file_label": "İndirilebilir Paket (.zip)",
        "media_kind": False,
    },
    "resim": {
        "label": "Görseller",
        "singular": "Görsel",
        "slug": "gorseller",
        "group": "medya",
        "icon": "image",
        "file_exts": {"png", "jpg", "jpeg", "webp"},
        "file_label": "Görsel Dosyası",
        "media_kind": True,
        "preview": "image",
    },
    "gif": {
        "label": "GIF'ler",
        "singular": "GIF",
        "slug": "gifler",
        "group": "medya",
        "icon": "gif",
        "file_exts": {"gif"},
        "file_label": "GIF Dosyası",
        "media_kind": True,
        "preview": "image",
    },
    "ses": {
        "label": "Sesler",
        "singular": "Ses",
        "slug": "sesler",
        "group": "medya",
        "icon": "audio",
        "file_exts": {"mp3", "wav", "ogg"},
        "file_label": "Ses Dosyası",
        "media_kind": True,
        "preview": "audio",
    },
}

# Üst gruplar (nav ve anasayfa kategori kutuları için)
GROUPS = {
    "oyunlar": {"label": "Oyunlar", "slug": "oyunlar", "desc": "Tarayıcıda oynanabilen, kendi motorlarıyla geliştirilmiş oyunlar."},
    "uygulamalar": {"label": "Uygulamalar", "slug": "uygulamalar", "desc": "İndirip kurarak kullanılan araçlar ve program projeleri."},
    "medya": {"label": "Medya", "slug": "medya", "desc": "Görseller, GIF'ler ve sesler — indirilebilir içerikler."},
}


def kinds_in_group(group_slug):
    return [k for k, v in CATEGORIES.items() if v["group"] == group_slug]


def group_for_kind(kind):
    cat = CATEGORIES.get(kind)
    return cat["group"] if cat else None


def group_by_slug(slug):
    for g in GROUPS.values():
        if g["slug"] == slug:
            return g
    return None
