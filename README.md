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

### ⚠️ Render ücretsiz katmanında önemli bir sınırlama — ve gerçek çözümü

Render'ın kendi dokümantasyonuna göre: ücretsiz web servislerinin diski
**"redeploy, restart VEYA spin-down"da** sıfırlanır. Yani sadece kod
güncellemesi (redeploy) değil, **15 dakika hareketsizlik sonrası otomatik
"uyuma" ve bir sonraki ziyarette "uyanma" işleminin kendisi bile** admin
panelden yüklediğin her şeyi (kapak görseli, yorumlar, Hakkımda yazısı)
siler — Auto-Deploy açık ya da kapalı olması fark etmez.

**`github_sync.py`** modülü admin panelden yapılan her değişikliği GitHub
reponuza commit'ler, yani veri kalıcı olarak *kaybolmaz* (GitHub'da güvende
durur). Ama bu commit'ler **otomatik olarak siteye geri yansımaz** — çünkü
"uyanma" bir redeploy değildir, sadece son deploy edilmiş hâli tekrar
başlatır.

**Bu yüzden ücretsiz planda kalmaya karar verildiyse şu iş akışını
izlemek gerekiyordu:**
1. Admin panelden istediğin değişikliği yap (kapak yükle, yorum onayla, vb.)
2. **Render Dashboard → Nova servisi → Manual Deploy → Deploy latest
   commit** ile elle bir deploy tetikle.
3. Bu deploy bitene kadar bekle (birkaç dakika) — bundan sonra o
   değişiklik kalıcı hale gelir, sonraki uyuma/uyanma döngülerinde kaybolmaz.

### 🤖 Artık otomatik: Deploy Hook
Bu adımı elle yapmak unutulmaya çok müsait olduğu için, artık **otomatik**
hale getirildi. Render'da her servisin kendine özel, gizli bir "Deploy Hook"
URL'i vardır (Settings → Deploy → Deploy Hook). Bunu bir ortam değişkeni
olarak eklersen, admin panelden yapılan **her** değişiklik (kapak yükleme,
yorum onaylama, Hakkımda güncelleme, proje ekleme/silme, vb.) otomatik
olarak bu URL'i tetikler ve Render birkaç dakika içinde kendini yeniden
deploy edip değişikliği kalıcı hale getirir. **Elle Manual Deploy yapmana
artık gerek yok.**

Kurulum:
```
RENDER_DEPLOY_HOOK_URL = (Render → Settings → Deploy → Deploy Hook'tan kopyala)
```
Admin panelin üstünde bu özelliğin açık/kapalı olduğu her zaman görünür.

**Not:** Bu, arka arkaya çok sayıda değişiklik yaparsan (ör. 10 kapak
görseli art arda yüklemek) birden fazla deploy'un sıraya girmesine sebep
olabilir — zararı yok, Render bunları sırayla işler, sadece son hâl
oturana kadar birkaç dakika geçebilir.

**Kalıcı ve sorunsuz bir çözüm isteniyorsa:** Render'da ücretli bir plana
geçip (~7$/ay) **Persistent Disk** eklemek, bu sorunu tamamen ortadan
kaldırır — deploy hook'a bile gerek kalmaz.

### Kurulumu (Render → Environment sekmesi)
```
GITHUB_TOKEN  = (repo izinli bir Personal Access Token)
GITHUB_REPO   = Asistan80/Nova
GITHUB_BRANCH = main
RENDER_DEPLOY_HOOK_URL = (yukarıda açıklanan Deploy Hook URL'i)
```
Bu değişkenler tanımlı değilse, ilgili özellik sessizce devre dışı kalır —
site normal çalışmaya devam eder. Admin panelindeki **"Bağlantıyı Test
Et"** butonuyla GitHub bağlantısını istediğin an doğrulayabilirsin.

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


## Yorum Bildirimleri (E-posta / Discord / Telefon)

Yeni bir yorum geldiğinde admin'e (sana) haber vermesi için 3 bağımsız
kanal var — istediğini/istediklerini aç, kalanını boş bırak.

### E-posta (Gmail)
1. Gmail hesabında 2 Adımlı Doğrulama'yı aç (Google Hesabı → Güvenlik).
2. "Uygulama Şifreleri" oluştur (App Passwords) → 16 haneli bir şifre alırsın.
3. Render → Environment:
```
GMAIL_ADDRESS = murnovadunyasi@gmail.com
GMAIL_APP_PASSWORD = (16 haneli uygulama şifresi)
NOTIFY_EMAIL_TO = murnovadunyasi@gmail.com   (opsiyonel, boşsa GMAIL_ADDRESS'e gider)
```

### Discord
1. Discord'da bir kanala sağ tık → Kanalı Düzenle → Entegrasyonlar → Webhooks → Yeni Webhook.
2. Webhook URL'ini kopyala.
3. Render → Environment:
```
DISCORD_WEBHOOK_URL = (kopyaladığın webhook URL'i)
```

### Telefon (anlık push, uygulama gerektirmez)
1. Telefonuna [ntfy](https://ntfy.sh) uygulamasını kur (App Store / Play Store, ücretsiz).
2. Uygulamada kendine özel, tahmin edilmesi zor bir "topic" adı belirle
   (ör. `murnova-bildirim-8x4k2`) ve o konuya abone ol.
3. Render → Environment:
```
NTFY_TOPIC = murnova-bildirim-8x4k2
```

Hepsi ayarlandıktan sonra admin panelin üstünde hangilerinin aktif
olduğunu gösteren küçük noktalar göreceksin.

### Telegram (muhtemelen en kolayı)
1. Telegram'da **@BotFather**'a yaz, `/newbot` komutuyla yeni bir bot oluştur
   (bir isim ve kullanıcı adı soracak) — sana bir **bot token** verecek.
2. Oluşturduğun bota Telegram'dan `/start` yaz (ya da herhangi bir mesaj at).
3. Şu adrese tarayıcından git (TOKEN yerine kendi token'ını yaz):
   `https://api.telegram.org/botTOKEN/getUpdates`
   Dönen JSON içinde `"chat":{"id": ...}` kısmındaki sayı senin chat id'in.
4. Render → Environment:
```
TELEGRAM_BOT_TOKEN = (BotFather'dan aldığın token)
TELEGRAM_CHAT_ID = (getUpdates'ten bulduğun sayı)
```
