"""Godot oyunları için otomatik tamamlamalar.
Sadece BOŞ alanları doldurur (kullanıcının yazdığı hiçbir şeyin üzerine yazmaz) ve Takımada Turu kaydını yoksa ekler."""

PATCHES = {
    "strike-arena": {
        "cover": "strike-arena-oyun.png",
        "tagline": "3 boyutlu bowling: 3 mekân, yapay zekâ rakipler",
        "tags": ["Godot", "3B", "Bowling", "Çevrimiçi"],
        "features": ["3 farklı mekân ve top mağazası", "Yapay zekâ rakiplerle maç", "Arkadaşlarla çevrimiçi oynama", "Başarımlar ve skor tablosu"],
    },
    "pazarci": {
        "cover": "pazarci-oyun.png",
        "tagline": "Eskici dükkânı: pazarlık yap, ucuza al, pahalıya sat",
        "desc": "Dükkânını kur, farklı karakterdeki müşterilerle pazarlık et, açık artırmalara katıl, koleksiyonunu tamamla ve dükkânını büyüt.",
        "tags": ["Godot", "3B", "Ticaret", "Pazarlık"],
        "features": ["30 eşya ve 8 farklı müşteri tipi", "Pazarlık ve açık artırma", "Koleksiyon ve 14 başarım", "Büyüyen dükkân"],
    },
    "karabasan": {
        "cover": "karabasan-oyun.png",
        "tagline": "Konağın gölgesinde 3 boyutlu korku",
        "tags": ["Godot", "3B", "Korku"],
        "features": ["Bölümlere ayrılmış konak", "Zorluk seçimi", "Kulaklıkla oynamanız önerilir"],
    },
    "barbaros": {
        "cover": "barbaros-oyun.png",
        "tagline": "Akdeniz'in Efendisi: deniz savaşı ve sefer stratejisi",
        "tags": ["Godot", "Strateji", "Deniz savaşı", "Tarih"],
        "features": ["1504-1546 arası sefer modu", "Sonsuz mod", "Başarımlar ve şeref mağazası"],
    },
}

TAKIMADA = {
    "slug": "takimada-turu",
    "name": "Takımada Turu",
    "kind": "oyun",
    "status": "playable",
    "tagline": "3 boyutlu adalar ticaret oyunu: al, geliştir, takas et, kazan",
    "desc": "Business Tour tarzı, kendi haritalı 3 boyutlu tahta oyunu. Adaları satın al, kulübeden anıta kadar geliştir, açık artırma ve takasla rakiplerini köşeye sıkıştır. Bilgisayara karşı, arkadaşlarla aynı ağda ya da çevrimiçi oyna.",
    "tags": ["Godot", "3B", "Tahta oyunu", "Çok oyunculu"],
    "features": [
        "4 harita: Takımada, Karadeniz, Ege, Fantezi",
        "8 çizgi film karakteri, karakter seçimi",
        "Açık artırma, takas ve karşı teklif, ipotek",
        "Çevrimiçi çok oyunculu, sohbet, bot devri",
        "Eğitim modu, oyun özeti ve tekrar izleme",
        "Dört zorlukta bilgisayar rakipler, takım (2'ye 2) modu",
    ],
    "changelog": [{"version": "0.3", "date": "2026-10-29", "text": "Yeni haritalar, müzik, eğitim modu, özet ve tekrar, çevrimiçi mod ve sohbet."}],
    "version": "0.3",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "cover": "takimada-turu-oyun.png",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg", "ekran-6.jpg"],
    "play_url": "/oyna/takimada-turu",
    "download_url": None,
    "download_file": "TakimadaTuru_Windows.zip",
    "updated_at": "",
}

OMUR = {
    "slug": "omur-defteri",
    "name": "Ömür Defteri",
    "kind": "oyun",
    "status": "playable",
    "tagline": "Rastgele bir ülkede doğ, yıl yıl yaşa, bir ömür yaz",
    "desc": "Doğum çekilişiyle dünyanın bir yerinde, rastgele bir ailede doğarsın. Her yıl bir şey olur: okul, aşk, iş, sağlık, kriz, fırsat. Dört gösterge (Sağlık, Mutluluk, Zihin, Bağlar) ve Refah arasında denge kur, kararlarını ver, anılarını yıldızla. Sonunda hayatın tek kartta: paylaş, arkadaşına aynı doğumla meydan oku.",
    "tags": ["Tarayıcı", "Hayat simülasyonu", "Seçimli", "Türkçe/English"],
    "features": [
        "50 ülkeden doğum çekilişi ve doğum belgesi (1/N şansı)",
        "Yıl yıl 90'dan fazla olay, dönüm noktalarında kararlar",
        "Sağlık, Mutluluk, Zihin, Bağlar ve Refah göstergeleri",
        "Hayatlar Defteri, rozetler ve paylaşılabilir hayat kartı",
        "Aynı doğum koduyla arkadaşına meydan oku",
        "Türkçe ve İngilizce, kurulum gerektirmez",
    ],
    "changelog": [{"version": "1.0", "date": "2026-10-31", "text": "İlk sürüm."}],
    "version": "1.0",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "cover": "omur-defteri-oyun.png",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg", "ekran-6.jpg"],
    "play_url": "/oyna/omur-defteri",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
}

SEEDS = [TAKIMADA, OMUR]


def _empty(v):
    return v in (None, "", [], {}) or v == "Oyun"


def apply_patches(projects):
    for p in projects:
        patch = PATCHES.get(p.get("slug"))
        if not patch:
            continue
        for k, v in patch.items():
            if k == "cover":
                if _empty(p.get("cover")) or str(p.get("cover")).endswith("-auto.png"):
                    p["cover"] = v
            elif _empty(p.get(k)):
                p[k] = v
    return projects
