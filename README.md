# Murnova Dünyası — Oyun & Uygulama Rafı

## Çalıştırma
```
pip install -r requirements.txt
python app.py
```
Sonra tarayıcıda: http://localhost:5000

## Yapı
```
app.py                     -> route'lar (anasayfa, kategori, detay, oyna, indir, medya, admin)
categories.py               -> tüm kategori tanımları (oyun/uygulama/resim/gif/ses) — yeni
                                kategori eklemek için tek değişiklik yeri burası
store.py                   -> data/projects.json ve data/stats.json okuma/yazma katmanı
data/projects.json          -> tüm proje verileri (admin panelden düzenlenir)
data/stats.json              -> ziyaret / oynama / indirme sayaçları
templates/
  base.html                    -> nav + footer + tema butonu, diğerleri bunu extend eder
  index.html                    -> anasayfa: hero + kategori kutuları + son eklenenler
  category.html                  -> kategori listeleme sayfası (Oyunlar/Uygulamalar/Medya) — yeni
  _card.html                      -> tüm kategorilerde kullanılan ortak proje kartı (macro) — yeni
  detail.html                      -> proje detay sayfası (oyun/uygulama + resim/gif/ses önizlemesi)
  play.html                       -> oyunun tarayıcıda oynandığı sayfa (henüz bağlanmamış oyunlar için placeholder)
  download_pending.html            -> indirme dosyası henüz yoksa gösterilen sayfa
  admin/login.html                  -> yönetim paneli giriş
  admin/dashboard.html               -> tüm kategorileri dinamik listeler
  admin/form.html                     -> proje ekleme/düzenleme formu, türe göre alanlar değişir
static/css/style.css        -> tüm site stili (koyu/açık tema, boot animasyonu dahil)
static/js/main.js            -> boot sekansı, tema geçişi, filtre/arama, scroll reveal, lightbox
static/uploads/covers/        -> admin panelden yüklenen kapak görselleri (oyun/uygulama)
static/uploads/gallery/<slug>/ -> admin panelden yüklenen ekran görüntüleri (oyun/uygulama)
downloads/<slug>/               -> admin panelden yüklenen tüm dosyalar (zip, resim, gif, ses)
games/<slug>/                    -> admin panelden yüklenen oyun kaynak dosyaları (.zip açılmış hali)
games_blueprints/                -> gerçekten siteye bağlanmış oyunların Flask Blueprint kodu
  rise_of_the_bosses/               -> Snake Evolution: Rise of the Bosses entegrasyonu
```

## Kategoriler ve sayfa yapısı
Site artık 3 üst gruba ayrılmış durumda, her biri kendi sayfasında:
- **/kategori/oyunlar** — sadece oyunlar
- **/kategori/uygulamalar** — sadece uygulamalar
- **/kategori/medya** — Görseller, GIF'ler ve Sesler (tek sayfada, üstteki
  sekmelerle filtrelenir — nav'ı kalabalıklaştırmamak için böyle gruplandım;
  istersen bunları ayrı ayrı sayfalara da bölebiliriz)

Anasayfa artık tüm projeleri listelemiyor — sadece 3 kategori kutusu ve
"Son eklenenler" (en son eklenen 6 içerik) gösteriyor. Böylece proje sayısı
arttıkça anasayfa kalabalıklaşmıyor.

**Yeni bir kategori eklemek** istersen (örn. "video"): `categories.py`
içindeki `CATEGORIES` sözlüğüne bir giriş eklemen yeterli — rotalar,
admin formu ve şablonlar otomatik olarak yeni kategoriyi tanır.

## Resim / GIF / Ses nasıl çalışıyor
Admin panelden "Yeni Proje" derken Tür olarak Görsel/GIF/Ses seçtiğinde:
- Tek bir dosya yüklüyorsun (o kategoriye uygun uzantıda — form otomatik
  doğru uzantıları kabul eder).
- Bu dosya hem kart üzerinde önizleme (görsel için küçük resim, ses için
  nota ikonu), hem detay sayfasında büyük önizleme (görsel/GIF büyük
  gösterilir, ses için oynatıcı çıkar), hem de "İndir" butonunda kullanılır
  — tek dosya, üç iş.

## Yönetim Paneli (proje ekleme/düzenleme/silme)

`/admin` adresine git, şifreyi gir. **Varsayılan şifre `murnova2026` — mutlaka değiştir**
(aşağıya bak). Panelden:

- **+ Yeni Proje** ile oyun/uygulama ekleyebilirsin: ad, açıklama, etiketler,
  özellik listesi, durum (oynanabilir / indirilebilir / yakında).
- Kapak görseli ve ekran görüntüsü galerisi yükleyebilirsin.
- Uygulamalar için indirilebilir `.zip` paketi yükleyebilirsin — yüklenince
  "İndir" butonu otomatik gerçek dosyayı indirtmeye başlar.
- Oyunlar için kaynak `.zip` yükleyebilirsin (ileride siteye gerçek
  entegrasyon için saklanır).
- **Düzenle** ile her alanı güncelleyebilir, **Sil** ile projeyi tamamen
  rafdan kaldırabilirsin (onay soracak).

Hiçbir HTML dosyasına dokunmana gerek yok, her şey panelden yönetiliyor.

### ⚠️ Render ücretsiz katmanında önemli bir sınırlama — ve çözümü

Render'ın ücretsiz web servisleri **kalıcı disk içermez** — yani admin
panelden yüklediğin dosyalar (kapak görseli, galeri, indirilebilir zip'ler)
sunucu yeniden deploy edildiğinde kaybolabilir.

**Çözüm: Otomatik GitHub yedeklemesi.** Bu sürümde `github_sync.py` modülü
var — admin panelden her ekleme/düzenleme/silme/dosya yüklemesinde,
değişiklik otomatik olarak GitHub reponuza da commit'lenir. Böylece disk
silinse bile, bir sonraki deploy GitHub'daki güncel veriyi çeker.

### Kurulumu (Render → Environment sekmesi)
```
GITHUB_TOKEN  = (repo izinli bir Personal Access Token)
GITHUB_REPO   = Asistan80/Nova
GITHUB_BRANCH = main
```
Bu üç değişken tanımlı değilse, senkronizasyon sessizce devre dışı kalır —
site normal çalışmaya devam eder, sadece yedekleme yapılmaz.

### Önemli: Render'da "Auto-Deploy"u kapat
Admin panelin attığı yedekleme commit'leri her push'ta Render'ın otomatik
yeniden deploy tetiklemesine (ve kısa süreli kesintiye) sebep olmasın diye:
**Render Dashboard → servis → Settings → Build & Deploy → Auto-Deploy → Off/No**

Bundan sonra kod güncellemesi yapmak istediğimizde **Manual Deploy → Deploy
latest commit** ile elle tetikleriz.

## Şifreyi değiştirmek
Render'da: Dashboard → servisin → **Environment** sekmesi → şu değişkenleri ekle:
```
ADMIN_PASSWORD = (kendi seçtiğin güçlü bir şifre)
SECRET_KEY = (rastgele uzun bir metin, örn: bir şifre üreticiden)
```
Yerelde denemek için, çalıştırmadan önce:
```
set ADMIN_PASSWORD=kendisifren
set SECRET_KEY=rastgeleuzunmetin
python app.py
```

## Rise of the Bosses artık gerçekten bağlı! 🐍
"Tarayıcıda Oyna" butonu artık gerçek oyunu açıyor. Nasıl çalışıyor:

- Oyunun tüm kodu `games_blueprints/rise_of_the_bosses/` altında bir Flask
  **Blueprint** olarak entegre edildi (`app.py` içinde `register_blueprint` ile
  bağlanıyor).
- **Her ziyaretçinin kendi kaydı var** — çerez tabanlı bir kimlikle, herkesin
  ilerlemesi (`games_blueprints/rise_of_the_bosses/data/players/<id>.json`)
  ayrı ayrı saklanıyor. Yani biri oynarken bir başkasının kaydını
  etkilemiyor. Liderlik tablosu (`leaderboard.json`) ise ortak ve herkese açık,
  bu tasarım gereği.
- Oturum çerezi 365 gün kalıcı — bir ziyaretçi bir hafta sonra tekrar gelse
  bile aynı kaydını görür (tarayıcısını/çerezlerini silmediği sürece).

**Bilinmesi gereken:** Oyuncu kayıtları da diğer admin panel dosyaları gibi
Render'ın ücretsiz katmanında kalıcı değil — bir redeploy'da tüm oyuncu
kayıtları sıfırlanabilir. Bu şimdilik GitHub'a otomatik yedeklenmiyor (her
oyun hamlesinde commit atmak çok fazla olurdu); ciddi bir oyuncu kitlesi
oluşursa, bunun için ayrı bir çözüm (örn. gerçek bir veritabanı) konuşabiliriz.

**Yeni bir oyun/uygulama gelince aynı şekilde bağlamak** için: kodunu
paylaş, yapısına göre (Blueprint veya iframe) aynı yöntemle entegre ederiz.

## Yeni bir oyun/uygulama eklemek (elle, admin panel olmadan)
`data/projects.json` dosyasını doğrudan düzenleyip yeni bir obje ekleyebilirsin,
format admin panelin ürettiğiyle aynıdır.

