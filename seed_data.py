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
        "Yıl yıl 170'ten fazla olay, dönüm noktalarında kararlar",
        "Sağlık, Mutluluk, Zihin, Bağlar ve Refah göstergeleri",
        "Hayatlar Defteri, rozetler ve paylaşılabilir hayat kartı",
        "Meydan okuma linki, aynı kader modu ve günün doğumu",
        "İki hayatı yan yana gösteren karşılaştırma kartı",
        "Türkçe ve İngilizce, kurulum gerektirmez",
    ],
    "changelog": [{"version": "1.2", "date": "2026-11-01", "text": "Olay sayısı 179'a çıktı: ülke, dönem, yetenek ve meslek olayları."}, {"version": "1.0", "date": "2026-10-31", "text": "İlk sürüm."}],
    "version": "1.1",
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

GECE = {
    "slug": "gece-bekcisi",
    "name": "Gece Bekçisi",
    "kind": "oyun",
    "status": "playable",
    "tagline": "Terk edilmiş kervansarayda 5 gece: fener, kepenk, kamera ve nefes",
    "desc": "Müzenin gece bekçisisin. 22:00'den sabah 06:00'ya kadar sol pencereye gelen Gölge'yi fenerle kov, sağ kapıya gelen Cadı'ya kepenk indir, kameralarda yerinden oynayan Heykel'e gözünü ayırma ve fısıltıları duyunca nefesini tut. Gaz yağın sınırlı. Kulaklık ve karanlık oda önerilir; ani korkutmalar içerir.",
    "tags": ["Tarayıcı", "Korku", "Hayatta kalma", "Kamera"],
    "features": [
        "5 gece + açılan Özel Gece (seviyeleri kendin ayarla)",
        "4 farklı tehdit, her birinin kendine özgü çaresi",
        "Gaz yağı yönetimi: fener, kepenk ve kamera yağ harcar",
        "Kodla üretilmiş ses: ayak sesi, fısıltı, vuruş, ani korkutmalar",
        "Korkutma şiddeti, ses ve ışık titremesi ayarları",
        "Klavye ve dokunmatik destek, otomatik kayıt",
    ],
    "changelog": [{"version": "1.0", "date": "2026-11-02", "text": "İlk sürüm."}],
    "version": "1.0",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "cover": "gece-bekcisi-oyun.png",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
    "play_url": "/oyna/gece-bekcisi",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
}

FENER = {
    "slug": "fener-isigi",
    "name": "Fener Işığı",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/fener-isigi",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "fener-isigi-oyun.png",
    "gallery": [
        "ekran-1.jpg",
        "ekran-2.jpg",
        "ekran-3.jpg",
        "ekran-4.jpg",
        "ekran-5.jpg"
    ],
    "changelog": [
        {
            "version": "1.0",
            "date": "2026-11-02",
            "text": "İlk sürüm."
        }
    ],
    "version": "1.0",
    "tagline": "Karanlık ormanda altı kandil: ışığa tutunca donan gölgelerden kaç",
    "desc": "Sisli bir ormanda yalnızsın. Fenerinin ışığı ve yanan kandillerin çevresi dışında her yer karanlık. Altı kandili bul, yanında basılı tutarak yak ve kuzeydeki kapıya ulaş. Gölge Adamlar karanlıkta hızlıdır ama ışığa tutunca donar; yanan kandil güvenli alan açar ve pilini doldurur. Her orman bir koddan üretilir: aynı kodla arkadaşların aynı ormanı oynar ve süreni geçmeye çalışır.",
    "tags": [
        "Tarayıcı",
        "Korku",
        "2B",
        "Kodlu harita"
    ],
    "features": [
        "Kodla üretilen orman: aynı kod, aynı harita, paylaşılabilir meydan okuma",
        "Fener, pil ve dayanıklılık yönetimi",
        "Işıkta donan, karanlıkta hızlanan Gölge Adamlar",
        "Yanan kandil güvenli alan açar",
        "3 zorluk, kod başına rekor kaydı",
        "Kodla üretilmiş ses, klavye/fare ve dokunmatik destek"
    ]
}

TELSIZ = {
    "slug": "telsiz",
    "name": "Telsiz",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/telsiz",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "telsiz-oyun.png",
    "gallery": [
        "ekran-1.jpg",
        "ekran-2.jpg",
        "ekran-3.jpg",
        "ekran-4.jpg",
        "ekran-5.jpg"
    ],
    "changelog": [
        {
            "version": "1.0",
            "date": "2026-11-02",
            "text": "İlk sürüm."
        }
    ],
    "version": "1.0",
    "tagline": "Gece vardiyası, tek telsiz: hattaki ses gerçek kafile mi, yoksa taklitçi mi?",
    "desc": "Dağ başındaki telsiz istasyonunda gece nöbetindesin. Karda kaybolan bir kafile seni arıyor, ama hatta başkaları da var. Frekansı ayarla, sesi dinle, parola ve yanındakileri sor; gerçekse güvenli yola yönlendir, taklitçiyse hattı kes. Pencerede çizik sesi duyarsan kepengi kapat, kapıya adım sesleri gelirse lambayı söndür ve nefesini tut. Şafağa kadar dayan. Her vardiya bir koddan üretilir: aynı kodla arkadaşların aynı gece nöbetini tutar.",
    "tags": [
        "Tarayıcı",
        "Korku",
        "Ses odaklı",
        "Kodlu vardiya"
    ],
    "features": [
        "Ses odaklı oynanış: sesin yönü ve tınısıyla tehdidi ayırt et",
        "Radyo kadranı ile frekans ayarı, gerçek ve taklit çağrılar",
        "Parola, kimler, elinde ne var sorgusu; taklitçiler yavaş yavaş hata yapar",
        "Pencere, kapı ve nefes yönetimi",
        "Kodla üretilen vardiya, paylaşılabilir meydan okuma, kod başına rekor",
        "Türkçe sesli konuşma desteği (tarayıcı sesleri), yoksa kodla üretilmiş mırıltı"
    ]
}

KAYIP = {
    "slug": "kayip-kaset",
    "name": "Kayıp Kaset",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/kayip-kaset",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "kayip-kaset-oyun.png",
    "gallery": [
        "ekran-1.jpg",
        "ekran-2.jpg",
        "ekran-3.jpg",
        "ekran-4.jpg",
        "ekran-5.jpg"
    ],
    "changelog": [
        {
            "version": "1.0",
            "date": "2026-11-02",
            "text": "İlk sürüm."
        }
    ],
    "version": "1.0",
    "tagline": "Terk edilmiş sanatoryumda kasetleri topla: kamera bakarken hareket etmeyen şey seni arıyor",
    "desc": "Eski kamera görüntüsüyle birinci şahıs bir korku oyunu. Sarıdere Sanatoryumu'nun labirent koridorlarında 6 kayıp kaseti bul, ekibin başına ne geldiğini çöz ve çıkış kapısına ulaş. Hasta 14 yalnızca kamera ona bakmadığında hareket eder; flaşı, gece görüşünü ve pilini akıllıca kullan. Her gece bir koddan üretilir: aynı kodla arkadaşların aynı sanatoryumda aynı kasetleri arar.",
    "tags": [
        "Tarayıcı",
        "Korku",
        "3B",
        "Bulunmuş görüntü",
        "Kodlu harita"
    ],
    "features": [
        "Raycasting ile 3B koridorlar, eski kamera (VHS) görünümü: REC, zaman damgası, parazit",
        "Bakınca duran, bakmayınca yaklaşan yaratık",
        "Flaş, gece görüşü, pil ve dayanıklılık yönetimi",
        "6 kasetle çözülen hikaye ve sürpriz son",
        "Kodla üretilen harita, paylaşılabilir meydan okuma, rekor",
        "Kodla üretilmiş ses, fare + klavye"
    ]
}

SAATCI = {
    "slug": "saatcinin-kosku",
    "name": "Saatçinin Köşkü",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/saatcinin-kosku",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "saatcinin-kosku-oyun.png",
    "gallery": [
        "ekran-1.jpg",
        "ekran-2.jpg",
        "ekran-3.jpg",
        "ekran-4.jpg",
        "ekran-5.jpg"
    ],
    "changelog": [
        {
            "version": "1.0",
            "date": "2026-11-02",
            "text": "İlk sürüm."
        }
    ],
    "version": "1.0",
    "tagline": "Saatçi ustanın köşkünde 5 oda, 18 bulmaca: Zamanın Kalbi'ni bul, gece yarısı kapıyı aç",
    "desc": "Büyük bir kaçış bulmacası. Fırtınada kilitlenen saatçi köşkünde ipuçlarını topla, eşyaları birleştir, şifreleri çöz. Hol, Çalışma Odası, Kütüphane, Atölye ve Gözlemevi boyunca ilerle; Zamanın Kalbi'ni bulup büyük mekanizmayı yeniden çalıştır. Her oyun bir koddan üretilir: aynı kodla arkadaşın aynı şifreleri bulur, süre ve ipucu sayınızı karşılaştırırsınız. Köşkte gizlenmiş 5 Zaman Pulu'nu bulursan gizli bir son seni bekler.",
    "tags": [
        "Tarayıcı",
        "Bulmaca",
        "Kaçış oyunu",
        "Kodlu şifreler"
    ],
    "features": [
        "5 oda, 18 bulmaca: tuş takımı, şifre çarkı, saat kurma, kayan taşlar, ışık/ayna, borular, kablolar, teleskop ve daha fazlası",
        "Eşya toplama ve birleştirme, günlük ve ipucu sistemi (3 kademe)",
        "Kodla üretilen şifreler: aynı kodla aynı oyun, paylaşılabilir meydan okuma",
        "5 gizli Zaman Pulu ve gizli son",
        "Otomatik kayıt, kodla üretilmiş ses"
    ]
}

SEED_PK = {
    "slug": "pera-kosku-cinayeti",
    "name": "Pera Köşkü Cinayeti",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/pera-kosku-cinayeti",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "pera-kosku-cinayeti-oyun.png",
    "gallery": [
        "ekran-1.jpg",
        "ekran-2.jpg",
        "ekran-3.jpg",
        "ekran-4.jpg",
        "ekran-5.jpg"
    ],
    "changelog": [
        {
            "version": "1.0",
            "date": "2026-11-02",
            "text": "İlk sürüm."
        }
    ],
    "version": "1.0",
    "tagline": "Kar fırtınasında kapalı kalan köşkte bir cinayet: beş şüpheli, tek katil, sabaha kadar vaktin var",
    "desc": "1927 Pera. Hacı Nazım Efendi çalışma odasında zehirlenmiş, kapı içeriden kilitli; köşkten kimse çıkamıyor. Odaları ara, ifadeleri al, alibileri kanıtlarla sına, şüphelileri sıkıştır. Katil her oyunda rastgele değişir ve kanıtlar ona göre yazılır. Hazır çevrimdışı yanıtlarla tam oynanır; istersen kendi Groq, Gemini veya Claude anahtarını girip şüphelilerle canlı yapay zekâ ile konuşabilirsin. Vaka kodu ile aynı cinayeti arkadaşına gönderebilirsin.",
    "tags": [
        "Tarayıcı",
        "Dedektif",
        "Yapay zekâ",
        "Gizem"
    ],
    "features": [
        "Her oyunda rastgele katil, yöntem ve neden; 5 şüpheli, 11 oda, 25 kanıt",
        "Serbest cümleyle sorgu, kanıt gösterme, baskı ve itiraf sistemi",
        "İsteğe bağlı canlı yapay zekâ (Groq / Gemini / Claude); anahtar yalnızca senin tarayıcında kalır",
        "Kolay, normal, zor mod; ipucu, dedektif defteri, puan",
        "Vaka kodu (#s=KOD) ile aynı vakayı paylaş",
        "Otomatik kayıt"
    ]
}

SEED_KA = {
    "slug": "kozmik-akin",
    "name": "Kozmik Akın",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/kozmik-akin",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "kozmik-akin-oyun.png",
    "gallery": [
        "ekran-1.jpg",
        "ekran-2.jpg",
        "ekran-3.jpg",
        "ekran-4.jpg",
        "ekran-5.jpg"
    ],
    "changelog": [
        {"version": "1.1", "date": "2026-11-04", "text": "50 bölüm, 6 patron tasarımı, 2 yeni gemi, yeni düşmanlar, ses ayarları, klavye kontrol düzeltmesi."},
        {
            "version": "1.0",
            "date": "2026-11-02",
            "text": "İlk sürüm."
        }
    ],
    "version": "1.1",
    "tagline": "Yukarıdan inen düşman dalgalarını vur, gemini geliştir, 4 dev patronu yen",
    "desc": "Galaxy Attack tarzı, tamamen özgün bir uzay nişancı oyunu. 50 bölümlük seferde on sektörü geç, her beşinci bölümde dev bir patronla yüzleş. Düşürdüğün ganimetle silahını yükselt, kalkan ve bomba topla; kazandığın kredilerle hangarda 7 farklı gemi satın al ve 8 kalıcı geliştirmeyle gemini güçlendir. Bitmeyen dalgalar için Sonsuz Akın modu da var. Fare, dokunmatik veya klavye ile oynanır.",
    "tags": [
        "Tarayıcı",
        "Uzay",
        "Nişancı",
        "Geliştirmeli"
    ],
    "features": [
        "50 bölüm, 10 sektör ve 10 patron (6 tasarım, her birinin 3 aşaması var)",
        "7 gemi: dengeli, hızlı, dayanıklı, zırh delici, güdümlü, hayalet ve süpernova",
        "8 kalıcı geliştirme: güç, ateş hızı, zırh, mıknatıs, bomba, drone, başlangıç silahı, kredi",
        "Oyun içinde silah seviyesi 8'e kadar, kalkan, bomba, hızlı ateş ve can ganimetleri",
        "Kombo çarpanı, yıldız derecelendirmesi, Sonsuz Akın modu",
        "Ses, müzik ve efekt ayarları; fare, dokunmatik ve klavye desteği; otomatik kayıt"
    ]
}

SEED_AG = {
    "slug": "alt-gecit",
    "name": "Alt Geçit",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/alt-gecit",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "alt-gecit-oyun.png",
    "gallery": [
        "ekran-1.jpg",
        "ekran-2.jpg",
        "ekran-3.jpg",
        "ekran-4.jpg",
        "ekran-5.jpg"
    ],
    "changelog": [
        {
            "version": "1.0",
            "date": "2026-11-02",
            "text": "İlk sürüm."
        }
    ],
    "version": "1.0",
    "tagline": "Terk edilmiş bir alt geçitte her şey normalse ilerle, bir şey yanlışsa geri dön. 8 katı doğru geç.",
    "desc": "Sonsuz görünen bir metro alt geçidinde tek bir kural var: koridorda bir tuhaflık fark ettiysen geri dön, fark etmediysen yürümeye devam et. Doğru kararla kat sayacı artar, yanlış kararla sıfırlanır. 29 farklı anomali var: bazısı gözle görülür, bazısı yalnızca kulakla anlaşılır. Oyun seni adınla tanır, bazı anlarda sana oyun oynar, yürümeyi bırakırsan arkandan biri gelir. Üç gizli eşyayı bulursan gerçek çıkışa ulaşırsın; bulamazsan döngü başlar.",
    "tags": [
        "Tarayıcı",
        "Korku",
        "Anomali",
        "Atmosferik"
    ],
    "features": [
        "29 anomali: görsel ve ses; her anomali keşfedilince Anomali Defteri'ne işlenir",
        "Yürümeyi bırakırsan ya da yanlış karar verirsen seni bulan takipçi ve ani sürprizler",
        "Oyun seni adınla çağırır; dördüncü duvarı yıkan olaylar",
        "3 gizli eşya, 3 farklı son (Döngü, Çıkış, Kusursuz Çıkış)",
        "Kulaklıkla oynanması önerilir; ana ses, ortam ve efekt ayarları",
        "Klavye, fare ve dokunmatik desteği"
    ]
}

SEED_SV = {
    "slug": "son-vardiya",
    "name": "SON VARDİYA",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/son-vardiya",
    "download_url": None,
    "updated_at": "",
    "cover": "son-vardiya-oyun.png",
    "tagline": "Terk edilmiş hastanede gece nöbeti: kameralar, kilitli odalar ve kaybolan hastalar",
    "desc": "Kuzey Kanat'ın gece bekçisi Kerem'sin. Güvenlik kameralarını izle, anahtarları ve şifreleri bul, kilitli odaları aç; koridorlarda seni bekleyen Beyaz Hemşire'den saklan. Sandığın güvenli anlar da güvenli değil. Dört farklı final var.",
    "tags": [
        "Godot",
        "3B",
        "Korku",
        "Hastane"
    ],
    "features": [
        "Terk edilmiş hastane: zemin kat ve bodrum",
        "Güvenlik kamerası monitörü",
        "Kovalayan düşman, dolaplarda saklanma, fener ile geri püskürtme",
        "Beklenmedik ve çeşitli korkutmalar",
        "22 not, bulmacalar, 4 farklı final (biri gizli)"
    ],
    "changelog": [
        {
            "version": "1.1",
            "date": "2026-11-05",
            "text": "Güvenlik kamerası düzeltildi (E tuşu çakışması, 8. kamera), yazılar doğru yere ve ölçüye alındı, dolap ve sandalyelerin içinden geçme giderildi, sesler yumuşatıldı; kayıt/Devam Et ve kat haritası (M) eklendi."
        },
        {
            "version": "1.0",
            "date": "2026-11-05",
            "text": "İlk sürüm."
        }
    ],
    "version": "1.1",
    "download_file": "SonVardiya_Windows.zip",
    "gallery": [
        "ekran-1.jpg",
        "ekran-2.jpg",
        "ekran-3.jpg",
        "ekran-4.jpg",
        "ekran-5.jpg"
    ]
}

SEED_RW = {
    "slug": "runway",
    "name": "Runway",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/runway",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "runway-oyun.png",
    "tagline": "Bekçiden kaç: sokaklardan vagon çatılarına, çatılardan limana",
    "desc": "Bir bekçi peşinde. Altınları ve ödülleri topla, engelleri aş, yakalanma. Yedi farklı bölgede koş: gece sokağı, depo, hareket halindeki trenlerin çatısı, çukurlu çatılar, park, buharlı istasyon ve vinçli liman. Vagonlara zıpla, aralarını atla, çukurların üstünden geç, asılı tabelaların altından kay.",
    "tags": ["Tarayıcı", "Koşu", "Canvas", "Dokunmatik"],
    "features": [
        "7 bölge: sokak, depo, tren üstü, çatılar, park, istasyon ve liman",
        "Vagon çatılarında koşu, vagon aralarını atlama ve VAGON TURU bonusu",
        "Çukurlar, buhar bacaları, sallanan vinç kancaları, forkliftler",
        "Kıl payı bonusu, kombo, hediye kutuları ve 4 güçlendirici",
        "Dükkan: 7 kalıcı yükseltme, 4 karakter, görevler ve 10 başarım",
        "Günlük hediye, alıştırma için bölge seçimi, elmasla devam etme",
        "Kodla üretilmiş ses ve müzik, klavye ve dokunmatik destek, otomatik kayıt",
    ],
    "changelog": [
        {"version": "2.0", "date": "2026-11-15", "text": "Tren üstü, çatılar, istasyon ve liman bölgeleri; vagon çatısı ve çukur fiziği; kıl payı, vagon turu, başarımlar, günlük hediye ve bölge seçimi eklendi."},
        {"version": "1.0", "date": "2026-11-14", "text": "İlk sürüm."},
    ],
    "version": "2.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
}

SEED_AM = {
    "slug": "altin-madenci",
    "name": "Altın Madenci",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/altin-madenci",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "altin-madenci-oyun.png",
    "tagline": "Kancayı salla, altını yakala, süre dolmadan hedefi tuttur",
    "desc": "Klasik altın yakalama oyunu, beş farklı madende: altın madeni, kristal mağarası, lav madeni, buz mağarası ve asteroit kuşağı. Sallanan kancayı doğru anda fırlat, altın ve elmasları çek, taşlardan ve TNT'den kaçın. Her seviyeden sonra dükkandan eşya al, yıldızlarla kalıcı yükseltmeler aç.",
    "tags": ["Tarayıcı", "Arcade", "Canvas", "Dokunmatik"],
    "features": [
        "5 ortam: altın madeni, kristal mağarası, lav madeni, buz mağarası, asteroit kuşağı",
        "Altın, taş, elmas, kristal, keseler, geodlar, buz küpleri, domuz ve köstebekler",
        "TNT zincir patlaması, dinamitle ağır yükü patlatma, fışkıran lav",
        "Her seviye sonrası dükkan: güç içeceği, yonca, taş kitabı, elmas cilası, kum saati, dev kanca",
        "Atölye: 6 kalıcı yükseltme, 4 madenci, 8 başarım, günlük hediye",
        "Kodla üretilmiş ses ve müzik, klavye ve dokunmatik destek, otomatik kayıt",
    ],
    "changelog": [
        {"version": "1.0", "date": "2026-11-15", "text": "İlk sürüm."},
    ],
    "version": "1.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
}

SEED_DK = {
    "slug": "derin-kazi",
    "name": "Derin Kazı",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/derin-kazi",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "derin-kazi-oyun.png",
    "tagline": "Matkaplı kapsülünle yeraltına in, cevher kaz, yüzeyde sat ve geliştir",
    "desc": "Yeraltına doğru kat kat kazdığın bir maden oyunu. Kapsülünle toprağı, kili, kayayı, magmayı ve kristal katmanlarını kaz; bakırdan elmasa ve çekirdek kristaline kadar cevher topla. Yakıtın bitmeden yüzeye dön, İstasyon'da sat, kapsülünü geliştir ve daha derine in. Derine indikçe hava kararır, lav, gaz ve sert kaya yolunu keser.",
    "tags": ["Tarayıcı", "Kazı", "Canvas", "Dokunmatik"],
    "features": [
        "1450 m derinlik, 6 katman: toprak, kil, kaya, magma, kristal ve çekirdek",
        "8 cevher türü: bakır, demir, gümüş, altın, zümrüt, yakut, elmas, çekirdek kristali",
        "Mağaralar, lav gölleri, patlayan gaz keseleri ve kırılmaz sert kaya",
        "İstasyon: cevher satışı (günlük talep bonusu), yakıt, tamir, 6 yükseltme, dinamit, ışınlayıcı, tamir kiti",
        "Derinlikle artan karanlık, far yükseltmesi, düşme ve lav hasarı, kurtarma ekibi",
        "11 başarım, rekor sefer listesi, otomatik kayıt, kodla üretilmiş ses ve müzik, klavye ve dokunmatik destek",
    ],
    "changelog": [
        {"version": "1.0", "date": "2026-11-15", "text": "İlk sürüm."},
    ],
    "version": "1.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
}

SEED_KAL = {
    "slug": "kara-altin",
    "name": "Kara Altın",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/kara-altin",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "kara-altin-oyun.png",
    "tagline": "1901'de petrol kralı ol: toprak al, sondaj kur, rakipleri geride bırak",
    "desc": "Vahşi batıda geçen petrol ekonomisi oyunu. Parselleri etüt ettirip petrol ara, arazi satın al, sondaj kur ve pompa ile depoyu geliştir. Fiyat dalgalanır, savaş, kriz, grev ve yangınlar yaşanır. Üç rakip şirketle yarışıp süre bittiğinde en yüksek servete ulaşmaya çalış.",
    "tags": ["Tarayıcı", "Strateji", "Ekonomi", "Canvas"],
    "features": [
        "3 harita (Teksas, Oklahoma, Kaliforniya), 3 zorluk, 1-3 yıllık oyun süresi",
        "Gizli petrol yatakları: etüt, komşu parsel ipuçları ve komşu sondajların petrolü emmesi",
        "Dalgalanan petrol fiyatı, savaş, kriz, grev, yangın, yeni keşif ve petrol hücumu olayları",
        "Sondaj, 3 pompa seviyesi, depolar, otomatik satış ya da bekletip fiyat yükselince satma",
        "Banka ve borç, şirket ofisinde nakliye, jeolog ve sigorta geliştirmeleri",
        "3 yapay zekâ rakip şirket, servet sıralaması, 9 başarım, rekor listesi ve otomatik kayıt",
    ],
    "changelog": [
        {"version": "1.0", "date": "2026-11-15", "text": "İlk sürüm."},
    ],
    "version": "1.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
}

SEED_MP = {
    "slug": "maden-patronu",
    "name": "Maden Patronu",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/maden-patronu",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "maden-patronu-oyun.png",
    "tagline": "Maden imparatorluğunu kur: katlar aç, yönetici tut, yeni madene geç",
    "desc": "Idle Miner Tycoon tarzı bir maden imparatorluğu oyunu. Madenciler cevher çıkarır, asansör yukarı taşır, depo satar. Yeni katlar aç, yönetici işe al, seviye bonuslarıyla üretimi katla. Yeterince zengin olunca yeni bir maden dünyası açıp yatırımcılarla daha da büyü.",
    "tags": ["Tarayıcı", "Idle", "Tycoon", "Canvas"],
    "features": [
        "Madenci katı, asansör ve depo zinciri, darboğaz uyarıları",
        "30 kata kadar maden, yönetici, ×1/×10/×100/MAX yükseltme, seviye 10, 25, 50, 100 çarpan bonusları",
        "Yeni maden (prestij): yatırımcılar ve 4 farklı dünya (kömür, altın, kristal, Mars)",
        "Çevrimdışı kazanç (8 saate kadar), altın vagon, günlük hediye, süper nakit",
        "Gelir ×2, hız ×2 ve nakit paketi güç artışları, 11 başarım, istatistikler",
        "Kodla üretilmiş ses ve müzik, otomatik kayıt, mobil uyumlu",
    ],
    "changelog": [
        {"version": "1.0", "date": "2026-11-15", "text": "İlk sürüm."},
    ],
    "version": "1.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
}

SEED_KC = {
    "slug": "klasik-calar",
    "name": "Klasik Çalar",
    "kind": "uygulama",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/klasik-calar",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "klasik-calar-oyun.png",
    "tagline": "Eski usul müzik çalar: 10 bantlı ekolayzır, çalma listesi, görselleştirme",
    "desc": "Nostaljik masaüstü müzik çalarların tarayıcıya uyarlanmış hali. Kendi müzik dosyalarını veya klasörünü ekle, çalma listesi kur, 10 bantlı ekolayzırla sesi ayarla, 4 görselleştirme moduyla izle. Dosyalar yalnızca tarayıcında saklanır, internete yüklenmez.",
    "tags": ["Tarayıcı", "Müzik", "Nostalji", "Web Audio"],
    "features": [
        "Sürüklenebilir pencereler: çalar, ekolayzır, çalma listesi, görselleştirme",
        "10 bantlı ekolayzır + ön yükseltici, hazır ayarlar ve kendi ayarını kaydetme",
        "MP3, WAV, OGG, M4A, FLAC dosyası veya klasör ekleme, ID3 etiket okuma, sürükle-bırak",
        "Çalma listesi: karıştır, tekrar, sırala, listeyi kaydet; dosyalar tarayıcıda kalıcı",
        "Çubuklar, osiloskop, halka ve plazma görselleştirmesi, tam ekran",
        "4 kaplama (klasik, buz, ateş, neon), hız ayarı, uyku zamanlayıcısı, klavye kısayolları",
        "Bilgisayarında dosya yoksa 4 kodla üretilmiş demo parça",
    ],
    "changelog": [
        {"version": "1.0", "date": "2026-11-15", "text": "İlk sürüm."},
    ],
    "version": "1.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
}

SEED_FA = {
    "slug": "foto-album",
    "name": "Foto Albüm",
    "kind": "uygulama",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/foto-album",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "foto-album-oyun.png",
    "tagline": "Fotoğraflarını sakla, albümle, düzenle: eski usul foto organizatörü",
    "desc": "Eskiden popüler olan fotoğraf düzenleme ve saklama programlarının tarayıcıya uyarlanmış hali. Fotoğraflarını ekle, tarihe göre otomatik gruplansın, albüm ve etiketlerle düzenle. Kırp, düzelt, tek tuşla otomatik iyileştir, 18 efektle oyna, kolaj yap, slayt gösterisi izle. Her şey yalnızca tarayıcında saklanır, hiçbir dosya internete yüklenmez.",
    "tags": ["Tarayıcı", "Fotoğraf", "Nostalji", "Canvas"],
    "features": [
        "Sürükle-bırak ile fotoğraf veya klasör ekleme, aylara göre otomatik gruplama",
        "Albümler, etiketler, yıldız, arama ve sıralama, çoklu seçim",
        "Şanslıyım (otomatik düzelt), otomatik kontrast ve renk, döndür, eğim düzelt, oranlı kırpma",
        "Dolgu ışığı, vurgu/gölge, sıcaklık, doygunluk, keskinlik ayarları ve histogram",
        "18 efekt: sepya, film, eski foto, dramatik, ışıltı, vinyet ve daha fazlası, şiddet ayarlı",
        "Geri al/yinele, karşılaştır, kopya veya üzerine kaydet (orijinal saklanır)",
        "8 yerleşimli kolaj yapıcı, slayt gösterisi, PNG/JPG indirme",
    ],
    "changelog": [
        {"version": "1.0", "date": "2026-11-15", "text": "İlk sürüm."},
    ],
    "version": "1.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
}

SEED_YY = {
    "slug": "yeni-yasam",
    "name": "Yeni Yaşam",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/yeni-yasam",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "yeni-yasam-oyun.png",
    "tagline": "Avatarını yarat, adayı gez, yerleşiklerle arkadaş ol, evini kur",
    "desc": "Eskiden çok popüler olan sanal dünya oyunlarından esinlenen 3 boyutlu bir ada yaşamı. Kendi avatarını tasarla, yürü, koş, uç, otur, dans et. Adadaki yerleşiklerle sohbet et, arkadaş ol, hediye ver. Altın topla, parsel satın al, mağazadan mobilya alıp evini döşe. Gece gündüz döngüsü ve kulüpte müzik var. Not: yerleşikler bilgisayar tarafından yönetilen karakterlerdir, gerçek oyunculu çok oyunculu mod yoktur.",
    "tags": ["Tarayıcı", "3D", "Sanal Dünya", "Sosyal", "Three.js"],
    "features": [
        "Detaylı avatar oluşturucu: ten, saç, kıyafet, aksesuar, boy",
        "3 boyutlu ada: meydan, kafe, kulüp, mağaza, plaj, konut alanı",
        "Yürü, koş, zıpla, uç (F), otur, el salla, dans et, alkışla",
        "8 yerleşikle sohbet, özel mesaj, hediye, arkadaşlık seviyeleri",
        "Altın topla, kulüpte dans ederek kazan, parsel satın al",
        "10 çeşit mobilya, yapı modu ile evini döşe, otomatik kayıt",
        "Gece gündüz döngüsü, kulüpte müzik, harita, mobil dokunmatik kontrol",
    ],
    "changelog": [
        {"version": "1.0", "date": "2026-11-16", "text": "İlk sürüm."},
    ],
    "version": "1.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg"],
}

SEED_MJ = {
    "slug": "mesajci",
    "name": "Mesajcı",
    "kind": "uygulama",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/mesajci",
    "download_url": None,
    "download_file": None,
    "updated_at": "",
    "cover": "mesajci-oyun.png",
    "tagline": "Eski usul anlık mesajlaşma: kişi listesi, titreme, ifadeler",
    "desc": "Eskiden herkesin kullandığı anlık mesajlaşma programlarının tarayıcıya uyarlanmış hali. Kişi listende arkadaşlar, aile ve iş grupları var; durumları (çevrimiçi, meşgul, uzakta) değişiyor, kişiler sana kendiliğinden yazıyor. Sohbet pencereleri taşınabilir, ifadeler ve titreme gönderebilirsin. Kişiler bilgisayar tarafından yönetilen karakterlerdir; sohbetler yalnızca tarayıcında saklanır.",
    "tags": ["Tarayıcı", "Nostalji", "Sohbet", "Web Audio"],
    "features": [
        "Takma ad, avatar, durum ve kişisel mesaj düzenleme",
        "Gruplu kişi listesi, durum değişimleri ve çevrimiçi bildirimi",
        "Çoklu sohbet penceresi, yazıyor göstergesi, okunmamış sayacı",
        "İfade seçici, otomatik ifadeye çevirme (:) <3), titreme gönderme",
        "Sohbet geçmişi tarayıcıda saklanır, sesli bildirimler",
    ],
    "changelog": [
        {"version": "1.0", "date": "2026-11-16", "text": "İlk sürüm."},
    ],
    "version": "1.0",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg"],
}

SEED_PALMIYE = {
    "slug": "palmiye-korfezi",
    "name": "Palmiye Körfezi",
    "kind": "oyun",
    "status": "playable",
    "published": True,
    "youtube_url": "",
    "publish_at": None,
    "play_url": "/oyna/palmiye-korfezi",
    "download_url": None,
    "download_file": "PalmiyeKorfezi_Windows.zip",
    "updated_at": "",
    "cover": "palmiye-korfezi-oyun.png",
    "tagline": "Hicivli, güneşli, kaos dolu açık dünya: araç sür, görev yap, timsahlara dikkat et",
    "desc": "GTA tarzından esinlenen, yukarıdan bakışlı hicivli bir açık dünya oyunu. Palmiye Körfezi'nde 8 bölgeli bir adayı keşfet: araç ve jet ski sür, polisten kaç, 14 hikâye görevini bitir, balık tut, kumar oyna, hazine ara, garip olayları videoya çekip viral ol. Tüm görseller ve sesler kodla üretilmiştir; şiddet çizgi film seviyesindedir.",
    "tags": ["Godot", "Açık dünya", "Hiciv", "Aksiyon"],
    "features": [
        "8 bölgeli ada: şehir merkezi, plaj, liman, bataklık ve daha fazlası",
        "15 araç türü: araba, motosiklet, jet ski, tekne, dondurma kamyonu ve daha fazlası",
        "14 hikâye görevi, yarışlar ve büyük karnaval finali",
        "Polis kovalamacası, aranma yıldızları, nitro",
        "Balık tutma, mini golf, dans yarışması, slot, hazine avı, taksi ve kargo işleri",
        "Rastgele olaylar ve viral video çekimi (C tuşu), başarımlar",
        "4 radyo istasyonu, gece-gündüz ve hava durumu, otomatik kayıt",
    ],
    "changelog": [
        {"version": "1.1", "date": "2026-11-26", "text": "Açılış hızlandı, ana menü siyah ekran hatası giderildi."},
    ],
    "version": "1.1",
    "gallery": ["ekran-1.jpg", "ekran-2.jpg", "ekran-3.jpg", "ekran-4.jpg", "ekran-5.jpg", "ekran-6.jpg"],
}

SEEDS = [TAKIMADA, OMUR, GECE, FENER, TELSIZ, KAYIP, SAATCI, SEED_PK, SEED_KA, SEED_AG, SEED_SV, SEED_RW, SEED_AM, SEED_DK, SEED_KAL, SEED_MP, SEED_KC, SEED_FA, SEED_YY, SEED_MJ, SEED_PALMIYE]


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
