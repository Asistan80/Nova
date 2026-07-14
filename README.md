# Murnova Dünyası — Oyun & Uygulama Rafı

## Çalıştırma
```
pip install -r requirements.txt
python app.py
```
Sonra tarayıcıda: http://localhost:5000

## Yapı
```
app.py                     -> route'lar (anasayfa, detay, oyna, indir, admin)
store.py                   -> data/projects.json ve data/stats.json okuma/yazma katmanı
data/projects.json          -> tüm proje verileri (admin panelden düzenlenir)
data/stats.json              -> ziyaret / oynama / indirme sayaçları
templates/
  base.html                    -> nav + footer + tema butonu, diğerleri bunu extend eder
  index.html                    -> anasayfa: filtre/arama, kapak görselleri, sayaçlar
  detail.html                    -> oyun/uygulama detay sayfası + galeri/lightbox
  play.html                       -> oyunun tarayıcıda oynandığı sayfa (şu an placeholder)
  download_pending.html            -> indirme dosyası henüz yoksa gösterilen sayfa
  admin/login.html                  -> yönetim paneli giriş
  admin/dashboard.html               -> proje listesi, düzenle/sil butonları
  admin/form.html                     -> proje ekleme/düzenleme formu, dosya yüklemeleri
static/css/style.css        -> tüm site stili (koyu/açık tema dahil)
static/js/main.js            -> tema geçişi, filtre/arama, scroll reveal, lightbox
static/uploads/covers/        -> admin panelden yüklenen kapak görselleri
static/uploads/gallery/<slug>/ -> admin panelden yüklenen ekran görüntüleri
downloads/<slug>/               -> admin panelden yüklenen indirilebilir .zip paketleri
games/<slug>/                    -> admin panelden yüklenen oyun kaynak dosyaları (.zip açılmış hali)
```

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

## Yeni bir oyun/uygulama eklemek (elle, admin panel olmadan)
`data/projects.json` dosyasını doğrudan düzenleyip yeni bir obje ekleyebilirsin,
format admin panelin ürettiğiyle aynıdır.

## Rise of the Bosses'ı gerçekten bağlamak
`app.py` içindeki `play()` fonksiyonunun yanına not düştüm. İki seçenek var:

1. **Blueprint (önerilen):** Oyunun kendi `app.py`'sini bir Flask Blueprint'e
   çevirip burada `app.register_blueprint(...)` ile bağlarsın.
2. **iframe:** Oyunu ayrı bir process/port'ta çalıştırıp `play.html` içine
   `<iframe src="http://localhost:PORT">` koyarsın.

Oyunun dosyalarını admin panelden yüklediğinde (`games/<slug>/` altına
kaydediliyor) bu entegrasyonu birlikte yaparız.
