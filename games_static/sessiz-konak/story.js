// Sessiz Konak — hikâye grafiği. Her sahne: art, amb, text, w (düşük akılda görünen fısıltı), scare, choices.
// choices: {t, to, if(s), do(s), san} ; s: {san, items:Set, flags:Set}
const has = (s, i) => s.items.has(i), fl = (s, f) => s.flags.has(f);
const STORY = {
start: "s_yol",
scenes: {
s_yol: { art: "gate", amb: "rain", title: "Kuzyaka Köyü, 02:40",
  text: "Yağmur, taksinin arka lambaları dönemeçte kaybolana kadar yağdı. Elinde Nine'nin üç gün önceki telgrafı var: «GEL. SESİME CEVAP VERME.»\n\nBahçe kapısı yarı açık. Evin tek penceresinde titrek bir ışık yanıyor. Hâlbuki Nine, akşam sekizden sonra lamba yakmazdı.",
  choices: [
    { t: "Kapıdan girip doğruca eve yürü", to: "s_hol_giris" },
    { t: "Önce avluyu dolaş", to: "s_avlu" },
    { t: "Geri dön, yola çık", to: "s_kac_dene" } ] },

s_kac_dene: { art: "gate", amb: "rain", text: "Arkanı dönüyorsun. Yol çamur. Taksi çoktan gitti; en yakın ev iki kilometre ötede. Tam adım atarken evin içinden Nine'nin sesi duyuluyor:\n\n«Torunum... geldin mi?»\n\nSes çok yakın. Hem de arkandan değil, önünden.",
  w: "GİTME GİTME GİTME",
  choices: [
    { t: "Yürümeye devam et, dönme", to: "e_kac", san: -10 },
    { t: "Sese doğru dön", to: "s_hol_giris" } ] },

s_avlu: { art: "courtyard", amb: "rain", text: "Avlu dar ve taşlı. Ortada, taş kapağı yana kaymış eski bir kuyu. Yağmur sesinin altında başka bir ses var: kuyunun içinden gelen, alçak, ninni gibi bir mırıltı.\n\nBahçe kulübesinin kapısı rüzgârda vuruyor.",
  choices: [
    { t: "Kuyuya eğil, içine bak", to: "s_kuyu_bak" },
    { t: "Kulübeye gir", to: "s_kulube" },
    { t: "Eve gir", to: "s_hol_giris" } ] },

s_kuyu_bak: { art: "well", amb: "drone", text: "Taşa tutunup eğiliyorsun. Karanlık. Sonra suyun yüzünde bir yüz beliriyor: Nine'nin yüzü. Gülümsüyor. Dudakları kımıldamıyor ama ses yükseliyor:\n\n«Gel inelim torunum. Burası serin.»",
  scare: { kind: "face", once: true, san: -15 }, onEnter: s => s.flags.add("kuyu_gordu"),
  choices: [
    { t: "Geri çekil, avluya dön", to: "s_avlu" },
    { t: "«Nine?» diye seslen", to: "s_cevap_kuyu", san: -10 } ] },

s_cevap_kuyu: { art: "well", amb: "drone", text: "«Nine?»\n\nKuyu bir an sustu. Sonra cevap, bu kez kulağının hemen dibinden geldi, nefesini boynunda hissettin:\n\n«Adını söyledin. Şimdi seni tanıyorum.»",
  scare: { kind: "shadow", once: true }, onEnter: s => s.flags.add("adini_verdi"),
  choices: [ { t: "Koşarak eve gir", to: "s_hol_giris", san: -5 } ] },

s_kulube: { art: "shed", amb: "rain", text: "Kulübe küf ve pas kokuyor. Duvarda asılı aletlerin arasında, tek başına, kalın bir demir mil duruyor; üzerine kazınmış eski semboller var. Nine'nin işi olmalı. Yağmurdan nemli ve buz gibi.",
  choices: [
    { t: "Demir mili al", to: "s_kulube", if: s => !has(s, "demir_mil"), do: s => s.items.add("demir_mil"), msg: "Demir mili aldın. Elin sıcaklıkla karıncalandı." },
    { t: "Avluya dön", to: "s_avlu" } ] },

s_hol_giris: { art: "hall", amb: "drone", text: "İçerisi ılık ama ölü bir ılıklık. Duvardaki saat 03:10'da durmuş. Merdiven yukarı kıvrılıyor; sağda mutfak, solda oturma odası, ileride kilitli bir mahzen kapısı.\n\nParke tahtalarında ıslak ayak izleri var. Mutfağa gidiyor... ve geri dönmüyor.",
  w: "ARKANDAKİ KAPI KAPANDI",
  choices: [
    { t: "Mutfağa gir", to: "s_mutfak" },
    { t: "Oturma odasına gir", to: "s_oturma" },
    { t: "Merdivenden yukarı çık", to: "s_ust" },
    { t: "Mahzen kapısına git", to: "s_mahzen_kapi" },
    { t: "Avluya çık", to: "s_avlu" } ] },

s_mutfak: { art: "kitchen", amb: "drone", text: "Ocakta kısık bir ateş. Masada iki tabak, ikisi de dolu ve soğumamış. Bir kâğıt: «Torunum, tuzu tutma, çemberi bozma. Ayna açılırsa konuşma.» El yazısı Nine'nin... ama mürekkep taze.\n\nOcağın üstündeki raf boşluğunda büyük bir tuz torbası var.",
  scare: { kind: "shadow", once: true, san: -8 },
  choices: [
    { t: "Tuz torbasını al", to: "s_mutfak", if: s => !has(s, "tuz"), do: s => s.items.add("tuz"), msg: "Tuzu aldın. Ağır ve kaba taneli." },
    { t: "Çekmeceyi karıştır", to: "s_mutfak", if: s => !has(s, "nazar"), do: s => s.items.add("nazar"), msg: "Çekmecede mavi bir nazar boncuğu buldun, cebine koydun. Zihnin biraz sakinleşti.", heal: 10 },
    { t: "Hole dön", to: "s_hol_giris" } ] },

s_oturma: { art: "living", amb: "drone", text: "Oturma odası toz içinde. Köşede tavana kadar uzanan, beyaz çarşafla örtülü bir ayna. Çarşafın altından, yavaşça, içeri çekilir gibi bir nefes sesi geliyor.\n\nKoltuğun yastığının altından bir anahtarın ucu görünüyor.",
  w: "ÖRTÜYÜ KALDIR",
  choices: [
    { t: "Anahtarı al", to: "s_oturma", if: s => !has(s, "anahtar"), do: s => s.items.add("anahtar"), msg: "Pas kokulu, ağır bir anahtar. Mahzenin olmalı." },
    { t: "Çarşafı çek", to: "s_ayna" },
    { t: "Hole dön", to: "s_hol_giris" } ] },

s_ayna: { art: "mirror", amb: "drone", text: "Çarşaf yere süzülüyor. Aynada sen varsın... ama bir saniye geç kıpırdıyorsun. Sonra aynadaki sen, sen kımıldamadan gülümsüyor.\n\n«Açtın,» diyor dudak okunarak. «Teşekkür ederim.»\n\nCam, içeriden nefesle buğulanıyor.",
  scare: { kind: "face", once: true, san: -20 }, onEnter: s => s.flags.add("ayna_acik"),
  choices: [
    { t: "Demir milin ucuyla aynayı kır", to: "s_ayna_kir", if: s => has(s, "demir_mil") },
    { t: "Aynadakiyle konuş", to: "e_boyun", san: -10 },
    { t: "Çarşafı geri ört ve uzaklaş", to: "s_oturma", san: -5 } ] },

s_ayna_kir: { art: "mirror_broken", amb: "drone", text: "Demiri bütün gücünle savuruyorsun. Cam, bir kadının çığlığına benzeyen bir sesle çatlıyor ve duvardan döküldü. Parçaların her birinde, bir an için, başka bir yüz.\n\nOda birden soğudu. Kuyudan gelen mırıltı kesildi. Sanki bir şey öfkeyle yerinden doğruldu.",
  scare: { kind: "flash", once: true }, onEnter: s => { s.flags.add("ayna_kirik"); },
  choices: [ { t: "Odadan çık", to: "s_hol_giris" } ] },

s_ust: { art: "corridor", amb: "drone", text: "Üst kat koridoru dar. Tavanda ağır, yavaş ayak sesleri: biri çatı katında bir yerden bir yere yürüyor. Sonunda Nine'nin odası. Çatı katının merdiveni sarkık, aşağı inmiş.",
  scare: { kind: "knock", once: true, san: -5 },
  choices: [
    { t: "Nine'nin odasına gir", to: "s_nine_oda" },
    { t: "Çatı katına çık", to: "s_cati" },
    { t: "Aşağı in", to: "s_hol_giris" } ] },

s_nine_oda: { art: "bedroom", amb: "drone", text: "Yatak düzenli, yastıkta çukur bile yok. Komodinin üstünde bir defter ve kıpkırmızı bir ip bağlı küçük bir muska.\n\nPencerenin önünde Nine'nin terlikleri, burunları dışarıya, kuyuya doğru çevrilmiş.",
  choices: [
    { t: "Defteri oku", to: "s_defter" },
    { t: "Muskayı al", to: "s_nine_oda", if: s => !has(s, "muska"), do: s => s.items.add("muska"), msg: "Muska elinde ısındı, sanki canlıymış gibi." },
    { t: "Koridora dön", to: "s_ust" } ] },

s_defter: { art: "diary", amb: "drone", text: "«Kırk yıl önce kuyuya bir şey indi. Adı yok. Ben ona 'Konuk' dedim. Ses taklit eder: seninkini, benimkini, sevdiğininkini. Bağladım onu: kuyunun ağzına tuz çemberi, demir mil, bu muska. Ayna onun kapısı; açılırsa dışarı çıkar.\n\nBu gece mührü yenilemem gerekiyordu. Ama o, dün gece mutfaktan seslendi. BEN OLMAYAN BEN. Mahzene saklanıyorum. Torunum gelirse: SESİME CEVAP VERME. Ben mahzendeyim. Anahtar yastığın altında.»",
  onEnter: s => s.flags.add("gercegi_bildi"),
  choices: [ { t: "Defteri kapat", to: "s_nine_oda" } ] },

s_cati: { art: "attic", amb: "drone", text: "Tavan arası sandık, oyuncak ve örtüyle dolu. Köşede, düzgün bir yastığın üzerinde eski bir bebek... yüzü sana dönük. Gözleri az önce açıktı mı?\n\nTam o an, aşağıdan Nine'nin sesi: «Torunum? Yukarıdasın değil mi? İn artık.»",
  scare: { kind: "face", once: true, san: -12 }, w: "BEBEK YAKLAŞTI",
  choices: [
    { t: "Ses sorusunu duymazdan gel, in", to: "s_ust" },
    { t: "«Geliyorum Nine!» diye cevap ver", to: "s_cevap_ses", san: -10 } ] },

s_cevap_ses: { art: "corridor", amb: "drone", text: "«Geliyorum!»\n\nSes bir an sustu. Merdivenin dibinden, sevinçle karışık, bambaşka bir tonda:\n\n«Çok sağ ol. Şimdi davetlisin.»\n\nAşağıdaki ışık söndü.",
  scare: { kind: "lights", once: true, san: -10 }, onEnter: s => s.flags.add("cevap_verdi"),
  choices: [ { t: "Karanlıkta merdivenden in", to: "s_hol_giris" } ] },

s_mahzen_kapi: { art: "cellar_door", amb: "drone", text: "Mahzen kapısı kalın meşe. Kilitli. Kapının arkasından, kısık ve yorgun, gerçek bir insan sesi:\n\n«Orada mısın? Cevap verme... sadece kapıyı aç. Kuyudakine inanma.»\n\nAynı anda dışarıdan, kuyudan: «Torunum, bana gel, ben burdayım!»",
  w: "İKİSİ DE BENİM",
  choices: [
    { t: "Anahtarla mahzeni aç", to: "s_mahzen", if: s => has(s, "anahtar") },
    { t: "Kapıyı zorla (anahtarın yok)", to: "s_mahzen_kapi", if: s => !has(s, "anahtar"), msg: "Kapı kımıldamıyor. Bir anahtar bulmalısın." },
    { t: "Kuyudan gelen sese doğru koş", to: "s_kuyu_final_erken", san: -10 },
    { t: "Geri çekil", to: "s_hol_giris" } ] },

s_mahzen: { art: "cellar", amb: "drone", text: "Merdivenden iniyorsun. Rutubet, küf, mum. Sandık yığınlarının arasında bir kadın sırtı duvara dayalı oturuyor: Nine. Zayıf, elleri titrek ama gözleri açık.\n\n«Gerçek sensin,» diyor, «ayak sesin kadar sıcak bir şey duymadım. Dinle: kuyuya in. Tuz çemberini yenile, demir mili kuyunun ağzına çak, muskayı bağla. Ama önce aynayı kırmış olmalısın; yoksa kapı açık kalır. Ben burada beklerim.»",
  scare: { kind: "shadow", once: true, san: -8 }, onEnter: s => { s.flags.add("nineyi_buldu"); s.san = Math.min(100, s.san + 12); },
  choices: [
    { t: "Nine'yi dışarı çıkar", to: "s_nineyi_cikar" },
    { t: "Emanetini al, kuyuya git", to: "s_kuyu_final" } ] },

s_nineyi_cikar: { art: "hall", amb: "drone", text: "Nine'ye omuz veriyorsun. Merdivenin başında ellerini hafifçe sıkıyor:\n\n«İyi evlat. Şimdi beni oturma odasına bırak, dua edeceğim. Sen son işini yap.»\n\nEvin içi bir an uğuldadı. Gölgeler sanki kıpırdadı.",
  onEnter: s => { s.flags.add("nine_guvende"); s.san = Math.min(100, s.san + 8); },
  choices: [ { t: "Kuyuya git", to: "s_kuyu_final" } ] },

s_kuyu_final_erken: { art: "well", amb: "drone", text: "Yağmura çıkıyorsun, kuyunun başında NİNE duruyor: ıslak, gülümseyen, kolları açık. Kuyunun içindeki ses artık onun ağzından çıkıyor.\n\n«Gel torunum. Gel kucağıma.»\n\nGözlerinin akları yok.",
  scare: { kind: "face", once: true, san: -20 },
  choices: [
    { t: "Kolları arasına git", to: "e_boyun" },
    { t: "Demir mili savur (varsa)", to: "s_kuyu_final", if: s => has(s, "demir_mil"), san: -5 },
    { t: "Eve geri kaç", to: "s_hol_giris", san: -5 } ] },

s_kuyu_final: { art: "ritual", amb: "drone", text: "Yağmur dindi. Kuyunun etrafındaki taşlar çatlak, tuz çemberi aşınmış. Kuyu, sanki nefes alıyormuş gibi şişip iniyor. Yeraltından, binlerce ses üst üste:\n\n«Ben seninim. Ben Nine'nim. Ben annenim. Ben sensin.»\n\nBir şey yapmak zorundasın.",
  scare: { kind: "flash", once: true, san: -10 },
  choices: [
    { t: "Tuz çemberini çiz, demir mili çak, muskayı bağla", to: "r_kontrol", if: s => has(s, "tuz") && has(s, "demir_mil") && has(s, "muska") },
    { t: "Elindekilerle mühürlemeye çalış (eksik malzeme)", to: "e_cin", if: s => !(has(s, "tuz") && has(s, "demir_mil") && has(s, "muska")) },
    { t: "Kuyunun sesine «Evet» de", to: "e_boyun", san: -15 },
    { t: "Eve koş", to: "s_hol_giris" } ] },

r_kontrol: { art: "ritual", amb: "drone", text: "Tuzu halka halka döküyorsun. Demir mili kuyu ağzındaki taşa çakıyorsun; her darbede yer sarsılıyor. Muskayı kırmızı iple mile bağlıyorsun.\n\nAma kuyunun içinden yükselen ses artık yalvarmıyor, tehdit etmiyor; sevdiğin birinin sesiyle son kez sorusunu soruyor:\n\n«Beni kurtarmayacak mısın?»",
  w: "CEVAP VER",
  choices: [
    { t: "Hiç cevap verme, mührü tamamla", to: "r_bitir" },
    { t: "«Seni bırakmayacağım» de", to: "e_cin", san: -20 } ] },

r_bitir: { art: "ritual", amb: "drone", text: "Dişlerini sıkıp son düğümü atıyorsun. Kuyu bir çığlıkla sarsılıyor, tuz parlıyor, demir kızarıyor. Taş kapak kendi kendine yerine kayıyor.\n\nSessizlik. Yağmur durmuş, uzaktan bir horoz ötüyor.",
  choices: [
    { t: "Eve dön; Nine seni bekliyor", to: "e_kurtulus", if: s => fl(s, "ayna_kirik") && fl(s, "nine_guvende") },
    { t: "Eve dön; mahzene bak", to: "e_yarim", if: s => fl(s, "ayna_kirik") && !fl(s, "nine_guvende") },
    { t: "Eve gir", to: "e_cin_kapi", if: s => !fl(s, "ayna_kirik") } ] },

// ---------------------------------------------------------------- sonlar
e_kurtulus: { ending: true, art: "dawn", amb: "birds", title: "SON: Sabah", text: "Evin içinde, kırık aynanın yanında Nine oturuyor ve çay demliyor. Pencereden gün ışığı giriyor.\n\n«Mührü yaptın,» diyor. «Kırk yılda ilk kez uyuyabileceğim.»\n\nKuyunun taş kapağı artık sessiz. Yağmur dinmiş.\n\nBu sefer, sesi kimin söylediğini gerçekten anladın. Bu, yeterli oldu.", end: "good" },
e_yarim: { ending: true, art: "dawn", amb: "birds", title: "SON: Yarım Sabah", text: "Mühür tamam, kuyu susuyor. Aynayı kırdın, kapıyı kapattın. Ama Nine... mahzende bıraktığın yerde. Sana ulaşmadan önce yorgunluktan, ya da korkudan.\n\nSabah geliyor. Kırk yıllık koruyucunun bıraktığı mühür sende kaldı. Her yağmurlu gecede kuyudan bir nefes sesi duyacaksın.\n\nAma artık o ses sana cevap veremeyecek.", end: "ok" },
e_kac: { ending: true, art: "road", amb: "rain", scare: { kind: "face", once: false, san: -30 }, title: "SON: Sabah Olmayan Gece", text: "Yürüdün. Yağmur yürüdükçe uzadı, yol dönemeçlerini kendine kattı. Arkandan bir ses seni adınla çağırdı, sonra diğer tarafından, sonra senin sesinle.\n\nSabaha kadar yürüdün, ama sabah gelmedi.\n\nHâlâ aynı bahçe kapısının önündesin.", end: "bad" },
e_boyun: { ending: true, art: "black", amb: "drone", scare: { kind: "face", once: false, san: -40 }, title: "SON: Davetli", text: "«Evet,» dedin.\n\nKuyu, aynı anda seni de, Nine'yi de içine aldı. Köydekiler iki gün sonra evi boş, kapıyı açık buldu.\n\nAkşam yağmur yağdığında, kuyunun başında iki ses duyulur: biri Nine'nin, biri senin.\n\nİkisi de seni çağırır.", end: "bad" },
e_cin: { ending: true, art: "black", amb: "drone", scare: { kind: "face", once: false, san: -40 }, title: "SON: Eksik Mühür", text: "Mühür tutmadı. Halka kırıldı, demir kızardı, kuyudan bir şey soluk soluğa yükseldi.\n\nSon gördüğün şey kendi gölgenin sana uzanan eli oldu.\n\nSabah köylüler geldiğinde evde kimse yoktu... yalnızca iki tabak yemek, hâlâ sıcak.", end: "bad" },
e_cin_kapi: { ending: true, art: "mirror", amb: "drone", scare: { kind: "face", once: false, san: -40 }, title: "SON: Açık Kapı", text: "Mührü tamamladın ama aynayı hiç kırmadın. Kuyu kapandı, ve o çıkış yolunu değiştirdi.\n\nEve girdiğinde ayna hâlâ açık. Aynadaki sen, sen daha kapıdan girmeden gülümsüyor.\n\n«Teşekkür ederim,» diyor. «Yeterince kolay oldu.»", end: "bad" },
e_deli: { ending: true, art: "black", amb: "drone", scare: { kind: "face", once: false, san: -30 }, title: "SON: Akıl Kaybı", text: "Duvarlar fısıldıyor. Fısıltılar senin adını söylüyor. Önce gülüyorsun, sonra susuyorsun.\n\nGeri döndüğünde karşında Nine duruyor; elinde çay, yüzünde nazik bir gülümseme.\n\n«Hoş geldin,» diyor. «Burada hiç gitmeyeceksin.»\n\nBu kez ona cevap veriyorsun.", end: "bad" }
}};
if (typeof module !== "undefined") module.exports = { STORY };
