// Sisli Pınar Köyü: karakter, görev ve diyalog verisi (ilerleme metinleri sabit, serbest sohbet yapay zekâ + yedek).
export const N = (s, name) => s.replaceAll("{ad}", name || "evladım");

export const NPCS = {
  muhtar: { id: "muhtar", name: "Muhtar Rıza Amca", emoji: "👴", color: 0x7a5230, hat: "cap", scarf: 0x444444, home: [14, -6], work: [6, -4], hours: [6, 21],
    secret: "Bu köyün kurucusu benim büyük dedemdi. Pınarın taşını eliyle yerleştirmiş, 'Işık hiç sönmez' demiş. Yanılmış demek ki...",
    fallback: ["Köyün derdi benim derdim evladım.", "Sis çöktüğünden beri muhtarlık da sessiz kaldı.", "Pınarı uyandırırsak köy yeniden canlanır.", "Çay demledim, soğumadan gel biraz otur.", "Dört damlayı topla, gerisi kolay."] },
  zehra: { id: "zehra", name: "Fırıncı Zehra Abla", emoji: "👩‍🍳", color: 0xc2527a, hat: "scarf", scarf: 0xff9bb8, home: [-16, -3], work: [-12, -4], hours: [6, 20],
    secret: "Simit hamurunun sırrı pınar suyudur. Su gittiğinden beri hamur eskisi gibi kabarmıyor...",
    fallback: ["Taze simit lazım olan var mı?", "Fırın yanıyor ama ruhum soğuk. Sis her şeye siniyor.", "Hamur ile insan aynıdır: dinlenmeden kabarmaz.", "Şuradaki tezgâha bak, sıcak poğaça var.", "Buğday olmadan fırın olmaz canım."] },
  hacer: { id: "hacer", name: "Hacer Nine", emoji: "👵", color: 0x7d4f9c, hat: "scarf", scarf: 0xf2f2f2, home: [-14, 12], work: [-11, 11], hours: [7, 22],
    secret: "Pınarın ışığı aslında bir kuşun gözyaşıymış. Masalın gerçek sonunu kimseye anlatmadım, sana anlatırım: ışık, birini sevince geri döner.",
    fallback: ["Anlatayım mı sana pınarın masalını?", "Yaşlandıkça dinlemek konuşmaktan tatlı geliyor.", "Eskiden bu köyde herkes birbirinin kapısını çalardı.", "Bir bardak çay iç, masal bitince gidersin.", "Sis geçer, masal kalır evladım."] },
  kemal: { id: "kemal", name: "Çoban Kemal", emoji: "🧑‍🌾", color: 0x8b6b3d, hat: "kalpak", scarf: 0x5a3b1a, home: [-34, -24], work: [-30, -22], hours: [5, 21],
    secret: "Sisin içinde bazen bir ses duyuyorum, pınardan geliyor. Ağlıyor gibi. Kimseye söylemedim, korktum.",
    fallback: ["Koyunlar huzursuz, sis onları ürkütüyor.", "Yamaçlarda otlar bile bu yıl daha sessiz.", "Köpeğim bile havlamıyor, garip.", "Sen çok yürümüşsün, ayakkabıların toz içinde.", "Dağın sesini dinleyen yanılmaz."] },
  cemal: { id: "cemal", name: "Değirmenci Cemal Usta", emoji: "🧔", color: 0x3b6ea8, hat: "goggles", scarf: 0x222222, home: [26, -12], work: [24, -15], hours: [6, 21],
    secret: "Bu dişlilerin içinde pınar suyuyla dönen bir mekanizma var. Eskiler 'Nur çarkı' derdi. Onu çalıştıran şey sudan çok o ışıkmış.",
    fallback: ["Şu çark bir türlü oturmuyor, vidasını bulamıyorum.", "Değirmen konuşur bilirsen, ben dinlerim.", "Her şeyin bir mekanizması vardır, pınarın da.", "Yağ, vida, sabır. Üçü de tükendi bende.", "Şu sisi bir kovayla çekebilsem..."] },
  sukru: { id: "sukru", name: "Bakkal Şükrü", emoji: "🧓", color: 0x5f8a4a, hat: "cap", scarf: 0xd8b050, home: [28, -12], work: [24, -10], hours: [8, 20],
    secret: "Bu dükkânın altında eski bir kiler var. Büyük dedem kıtlık yıllarında herkese bedava ekmek dağıtırmış. Ben de bazen 'pazarlık' diyerek aslında hediye ederim, sakın söyleme.",
    fallback: ["Hesap kitap, o kadar ucuz ki zarardayım valla.", "Taze çiçek, sıcak simit, her şey var.", "Balık getirirsen iyi para veririm, mantara da bakarım.", "Pazarlık yok, ama sana indirim var. Şaka şaka!", "Dükkân kapanmadan gel, fener lazım olur."] },
  mirmir: { id: "mirmir", name: "Mırmır (Kedi)", emoji: "🐱", color: 0x1b1b24, hat: "none", scarf: 0xffd34d, home: [-2, 4], work: [4, 6], hours: [19, 5], cat: true,
    secret: "Ağaç Dede'nin altı yüz yaşında olduğunu biliyor muydun? Ben yalnız yedi yaşındayım ama dokuz canım var.",
    fallback: ["Miyav. Gecenin dili benim dilimdir.", "Simit kokusu var, yoksa hayal mi görüyorum?", "Gölgeler bu gece daha uzun.", "Bir bilmece: Sular kurur, ışık söner, ama dibinde ne kalır?", "Çınarın dibinde uyumayı severim, sıcaktır."] },
  dede: { id: "dede", name: "Ağaç Dede", emoji: "🌳", color: 0x5a3b1a, hat: "none", scarf: 0x2d6a3a, home: [0, 0], work: [0, 0], hours: [19, 5], tree: true,
    secret: "Ben bu köyle birlikte büyüdüm. Her insanın adını yapraklarıma yazdım. Seninkini de yazdım, ilk gün.",
    fallback: ["Yaprağımdan yaprağıma rüzgâr geçiyor... dinliyorum.", "Uyku... bir uyku... ama uyanık kalmalıyım.", "Pınarı uyandır evlat... ben yardım ederim.", "Zaman benim için ağır akar.", "Güzel bir gece... hatırlıyorum eski geceleri."] },
};
export const NPC_IDS = Object.keys(NPCS);

// Görev tanımları: metinler sabit (ilerleme garanti), eşya adı ve adedi
export const QUESTS = {
  zehra: { item: "wheat", need: 3, label: "Zehra Abla'ya 3 buğday demeti",
    offer: ["Fırın sönmeye yakın, un bitti. Tarlalarda hasat bekleyen üç demet buğday var ama sis yüzünden kimse çıkamıyor.", "Üç demet getirirsen sana hem sıcak simit hem de bir pınar damlası veririm. Dedem bana bırakmıştı."],
    remind: ["Buğday demetleri tarlalarda, sarı başaklardan tanırsın. Kaç tane buldun?"],
    done: ["Aman Allahım, tam üç demet! Eline sağlık evladım.", "Al sana iki sıcak simit, bir de şu pınar damlası. 'Günü gelince lazım olur' demişti dedem."] },
  hacer: { item: "page", need: 3, label: "Hacer Nine'nin 3 masal sayfası",
    offer: ["Pınarın masalını yazmıştım ama rüzgâr sayfaları uçurdu. Üç sayfa kayıp.", "Biri eski kuyunun yanında, biri değirmenin merdiveninde, biri yamaçtaki taşların arasında. Bulursan masalı sana okurum, bir de damla verir."],
    remind: ["Sayfalar beyaz kâğıt gibi parlar, rüzgârda kıpırdar. Üç tanesini bulmalısın."],
    done: ["Sayfalar tamam! Hadi otur, dinle: Eskiden pınarın dibinde bir ışık yaşarmış, her yıl köyün çocuklarına gülümsermiş.", "Bir gün kıtlık olmuş, köy ışığı unutmuş, ışık da küsüp uyumuş. Dört yürek onu geri çağırırsa uyanırmış.", "Al bu damlayı, sen ışığı çağıran yüreklerden birisin."] },
  cemal: { item: "gear", need: 3, label: "Cemal Usta'ya 3 dişli çark",
    offer: ["Değirmenin dişlileri dökülmüş. Üç çark lazım: biri terk edilmiş arabada, biri dere kenarında, biri koyun ağılının yanında.", "Getirirsen değirmen yeniden döner, sana da bir damla veririm. Pınarın çarkından kalmadır."],
    remind: ["Çarklar parlak metal, yerde tıkırdar. Üçünü de bulmalısın."],
    done: ["Çarklar tam! Hele bir takayım... işte! Değirmen dönüyor!", "Al bakalım damlayı, hak ettin. Bu mekanizma pınarın nefesi gibi çalışıyor."] },
  kemal: { item: "sheep", need: 1, label: "Kemal'in kuzusu Pamuk'u ağıla getir",
    offer: ["Pamuk kayboldu! Küçük kuzum, doğu yamacında olmalı, sisin içinde yolunu bulamamıştır.", "Bulup ağıla getirirsen sana bir damla veririm. Pamuk'un yünü pınar suyuyla yıkanmıştır, onda bir şey var."],
    remind: ["Pamuk doğu yamacında. Ona yaklaşıp seslen, seni takip eder."],
    done: ["Pamuk! Yaramaz seni! Eyvah, sağ salim gelmiş.", "Al bu damlayı evladım. Bu sis çökeli kimse kuzumu getirmezdi, sağ ol."] },
};

export const MIRMIR = {
  need: "simit", ask: ["Miyav... Simit kokusu duydum. Bana bir simit getir, sana pınarın sırrını fısıldarım.", "Zehra Abla'nın fırınında olur, ama önce onun dertlerine derman olman gerek."],
  done: ["Mmm... simit! İşte söz verdiğim sır:", "Dört damlayı pınara gece bırakırsın. Sırayla değil, yürekle. Bırakınca Ağaç Dede de uyanır.", "Pınar yalnız karanlıkta uyanır, gece gel. Ben orada olurum."] };

export const GIFT = {
  flower: { name: "çiçek", hearts: 1, lines: { muhtar: "Ooo çiçek mi? Muhtarlığa renk getirdin evladım.", zehra: "Aman ne güzel çiçek! Tezgâha koyayım, simitler kıskanır.", hacer: "Çiçek mi? Eski günleri hatırlattın canım.", kemal: "Çiçek mi? Koyunlar da sever bunu, sağ ol.", cemal: "Hım... çiçek. Garip ama güzel. Teşekkürler.", mirmir: "Çiçek mi? Yenmez ki... ama güzel kokuyor, miyav.", dede: "Bir çiçek... köklerime düşsün, sağ ol evlat." } },
  simit: { name: "simit", hearts: 2, lines: { muhtar: "Taze simit! Çaya tam yakışır, sağ ol.", zehra: "Benim simidimi bana mı getiriyorsun? Haha, yüreğin güzelmiş.", hacer: "Sıcak simit... Dişim yok ama yüreğim sevindi.", kemal: "Simit mi! Sabahtan beri bir şey yemedim, Allah razı olsun.", cemal: "Simit! Vidayla sabır arasında en iyi yakıt.", mirmir: "SİMİT! Miyav! Sen benim en sevdiğim insansın.", dede: "Bir simit... toprağa düşse bile güzeldi, sağ ol." } },
};

export const MUHTAR = {
  intro: ["Hoş geldin {ad}. Böyle sisli bir günde yolu bulmuşsun, şanslısın.", "Köyün pınarı yüzlerce yıl bir ışıkla parlardı. Bir gece o ışık söndü, sis indi ve bir daha kalkmadı."],
  story: ["Hacer Nine der ki pınarı dört damla uyandırır. Köyün dört emektar insanı birer damla verebilir: fırıncı Zehra, masalcı Hacer Nine, değirmenci Cemal ve çoban Kemal.", "Onların dertlerine derman ol, damlaları getir. Dördü tamam olunca geceyi bekle, pınara git. Ağaç Dede de seni bekliyor olacak."],
  remind: "Kaç damla topladın? {shards}/4. Dördü tamamlanınca geceyi bekle, pınara git.",
  allDone: "Dört damla da tamam! Şimdi geceyi bekle, pınar yalnız karanlıkta uyanır. Kahvehanedeki bankta dinlenerek geceyi bekleyebilirsin.",
  finale: ["Pınar uyandı... sis çekildi... gözlerime inanamıyorum.", "{ad}, sana bir ömür misafirlik borcumuz var. Bu köyün kapısı sana hep açık."],
};

export const GENERIC = {
  hello: ["Merhaba {ad}, hoş geldin.", "Selam evladım, nasılsın?", "Merhaba, buyur otur biraz."],
  bye: ["Hoşça kal, yolun açık olsun.", "Görüşürüz {ad}.", "Kendine dikkat et, sis aldatıcıdır."],
};
export const keywordReply = (id, text) => {
  const t = text.toLocaleLowerCase("tr-TR");
  const has = (...k) => k.some(x => t.includes(x));
  if (has("merhaba", "selam", "günaydın", "iyi akşamlar")) return "Merhaba merhaba, hoş geldin.";
  if (has("pınar", "damla")) return id === "mirmir" ? "Miyav, pınar gecenin dilini bilir." : "Pınar bu köyün kalbi evladım. Işığı dönerse her şey düzelir.";
  if (has("sis")) return "Bu sis doğal değil. Pınarın ışığı sönmeden önce hiç böyle sis görmemiştik.";
  if (has("nasılsın", "naber", "ne haber")) return "Sağ ol, idare ediyoruz. Sen nasılsın?";
  if (has("kimsin", "adın", "sen kimsin")) return "Ben " + NPCS[id].name + ". Bu köyde herkes beni bilir.";
  if (has("teşekkür", "sağ ol", "eyvallah")) return "Rica ederim, ne demek.";
  if (has("hava", "yağmur", "güneş")) return "Hava sisli, ama içimiz bahar.";
  if (has("görev", "yardım", "ne yapmalı")) return "Köyün derdi çok ama herkesin bir damlası var. Sen bir bak, olur biter.";
  if (has("hoşça", "görüşürüz", "güle güle")) return "Güle güle, yolun açık olsun.";
  return null;
};
export const fallbackReply = (id, text) => keywordReply(id, text) || NPCS[id].fallback[Math.floor(Math.random() * NPCS[id].fallback.length)];

// Başarımlar
export const ACH = {
  tanis: ["👋", "Tanışma Turu", "Köydeki 7 kişiyle de konuş"],
  dost: ["💖", "Dost Canlısı", "Biriyle 5 kalp seviyesine ulaş"],
  cicek: ["🌸", "Çiçekçi", "10 çiçek topla"],
  gece: ["🌙", "Gece Kuşu", "Gece 02:00'den sonra dışarıda ol"],
  sirr: ["🗝️", "Sır Avcısı", "Bir köylünün sırrını öğren"],
  kurtar: ["✨", "Pınarın Işığı", "Pınarı uyandır"],
  yuru: ["👟", "Gezgin", "5000 adım at"],
};

// ---- Yan görevler (ana görev bittikten sonra açılır; muhtarınki giriş sonrası)
export const SIDE = {
  mektup: { giver: "muhtar", label: "Muhtar'ın 4 mektubunu dağıt", icon: "✉️", to: ["zehra", "hacer", "cemal", "sukru"], coin: 45,
    offer: ["Posta sandığında birikmiş mektuplar var. Sis yüzünden postacı gelemiyor.", "Dört mektup: Zehra'ya, Hacer Nine'ye, Cemal'e ve Bakkal Şükrü'ye. Hepsini elden ver, sana da harçlık çıkar."],
    remind: ["Mektupları sahiplerine ver: fırıncı, masalcı, değirmenci, bakkal. Hepsi tamamlanınca bana dön."],
    done: ["Hepsi yerine ulaştı demek! Köyde haberleşme geri geldi, eline sağlık.", "Al bakalım, 45 altın. Hak ettin evladım."],
    letter: { zehra: "Zehra: 'Mektup mu? Aaa, annemden! Tam fırının başında okuyayım...'", hacer: "Hacer Nine: 'Torunumdan mektup... Gözlüğüm nerede? Oku sen evladım, sesli oku.'", cemal: "Cemal: 'Yedek parça siparişi gelmiş! Yoksa yine gecikmeli mi? Hah, tamam.'", sukru: "Şükrü: 'Fatura mı bu? Yok yok, tahsilat! Hay Allah, sağ ol.'" } },
  mantar: { giver: "zehra", label: "Zehra'ya 4 mantar", icon: "🍄", need: 4, item: "mush", coin: 35,
    offer: ["Mantarlı pide yapacağım ama sis yüzünden mantarcılar çıkamıyor.", "Ormanda kırmızı şapkalı mantarlar bulursun. Dört tane getir, sana hem altın hem simit."],
    remind: ["Kırmızı şapkalı, beyaz benekli mantarları ağaçların dibinde ara. Dört tane yeter."],
    done: ["Mis gibi mantarlar! Pide bu akşam bedava... sana değil tabii, hesap benden.", "Al şu altınları ve iki simit. Eline sağlık."] },
  balik: { giver: "kemal", label: "Kemal'e 3 balık", icon: "🎣", need: 3, item: "fish", coin: 50,
    offer: ["Pınar sakin, balıklar yüzeye çıkıyor. Ama benim oltayı sis yedi, kırıldı.", "Sana eski oltamı veriyorum. Pınarın kenarında E'ye bas, balık yakala, sonra üç tane getir. Yanında sabır getir."],
    remind: ["Pınarın kenarına git, 'Olta at' de, balık vurunca hemen E'ye bas. Üç balık yeter."],
    done: ["Üç balık, hepsi diri! Ocak başında kızarttık mı tamam.", "Al evladım altınını. Oltayı da sana bıraktım, hep sende kalsın."] },
  hazine: { giver: "hacer", label: "Hacer Nine'nin 3 madalyon parçası", icon: "🏅", need: 3, item: "medal", coin: 80,
    offer: ["Pınarın bekçisine ait bir madalyon vardı, üç parçaya ayrılıp köyün üç ucuna gömülmüş.", "Parlayan toprak yığınlarını ara, E ile kaz. Üç parçayı bulursan sana masalın bilinmeyen kısmını anlatırım."],
    remind: ["Toprak yığınları geceleri bile hafifçe parlar. Harita yok ama minimapte sarı noktalar görürsün."],
    done: ["Üç parça tam! Hepsini birleştirdim bak, bir kuş figürü çıktı.", "Pınarın bekçisi bir kuşmuş, madalyon onun tüyünden... Al, 80 altın senin. Parçalar bende kalsın, kıymetli."] },
};
export const LETTER_TO = SIDE.mektup.to;
export const FISH = {
  hamsi: { n: "Hamsi", e: "🐟", p: 6, w: 60 }, sazan: { n: "Sazan", e: "🐠", p: 12, w: 32 }, alabalik: { n: "Alabalık", e: "🐡", p: 22, w: 14 },
  yayin: { n: "Yayın Balığı", e: "🐋", p: 45, w: 5, rain: 3 }, altin: { n: "Altın Balık", e: "✨", p: 120, w: 3, night: true }, bot: { n: "Eski Çizme", e: "👢", p: 0, w: 8, junk: true },
};
export const SHOP = [
  { id: "cizme", n: "Koşu Çizmesi", e: "👢", p: 80, d: "Daha hızlı yürür ve koşarsın" },
  { id: "fener", n: "Cep Feneri", e: "🔦", p: 60, d: "Geceleri daha geniş ışık" },
  { id: "olta2", n: "Gümüş Olta", e: "🎣", p: 100, d: "Balık daha uzun tutunur, nadir balık şansı artar", req: "olta" },
  { id: "hali", n: "Kilim", e: "🟥", p: 50, d: "Evine yeni bir halı", home: true },
  { id: "tablo", n: "Tablo", e: "🖼️", p: 70, d: "Evinin duvarına bir manzara", home: true },
  { id: "saksi", n: "Saksı Çiçeği", e: "🪴", p: 40, d: "Evine canlılık", home: true },
  { id: "lamba", n: "Yıldız Lambası", e: "💡", p: 90, d: "Tavandan sarkan parlak lamba", home: true },
  { id: "gramofon", n: "Gramofon", e: "📻", p: 150, d: "Evde müzik çalar", home: true },
];
export const BUY_ITEMS = [{ k: "flower", n: "Çiçek", e: "🌸", p: 8 }, { k: "simit", n: "Simit", e: "🥯", p: 12 }];
export const SELL_PRICE = { mush: 6, antika: 60, flower: 3 };
export const RIDDLES = [
  { q: "Sular kurur, ışık söner, ama dibinde ne kalır?", o: ["Taş", "Hatıra", "Kum"], a: 1 },
  { q: "Yemek yer ama doymaz, su içer ama ölür. Nedir?", o: ["Ateş", "Kurt", "Değirmen"], a: 0 },
  { q: "Kanatsız uçar, gözsüz ağlar, dişsiz güler. Nedir?", o: ["Kuş", "Bulut", "Yıldız"], a: 1 },
  { q: "Kuyuya düşer ama ıslanmaz. Nedir?", o: ["Kova", "Taş", "Gölge"], a: 2 },
  { q: "Çıkardıkça büyür. Nedir?", o: ["Kar", "Borç", "Çukur"], a: 2 },
];
GENERIC.fest = ["Bu gece pınarın şerefine şenlik var!", "Bak havai fişekler, köy ilk kez bu kadar güzel.", "Gel biraz dans edelim, olur mu?", "Pınar uyandığından beri gülmekten yoruldum."];
ACH.tanis[2] = "Köydeki 8 kişiyle de konuş";
Object.assign(ACH, {
  balik: ["🎣", "Olta Ustası", "10 balık yakala"], altin: ["✨", "Altın Balık", "Altın balığı yakala"], hazine: ["🏺", "Define Avcısı", "5 kez kaz"],
  mektup: ["✉️", "Postacı", "Mektup görevini bitir"], mantar: ["🍄", "Mantarcı", "Mantar görevini bitir"], zengin: ["🪙", "Cebi Dolu", "Toplam 300 altın kazan"],
  ev: ["🏠", "Ev Sahibi", "Kendi evine gir"], yagmur: ["🌧️", "Yağmurda Balık", "Yağmur yağarken balık tut"], senlik: ["🎆", "Şenlik Ruhu", "Köy şenliğine katıl"],
  foto: ["📷", "Fotoğrafçı", "Bir fotoğraf çek"], bilmece: ["🧩", "Bilmece Ustası", "3 bilmece çöz"], tum: ["🏆", "Köyün Kahramanı", "Tüm görevleri bitir"],
});
GIFT.flower.lines.sukru = "Çiçek mi? Vitrine koyarım, müşteri artar!";
GIFT.simit.lines.sukru = "Simit! Zehra'dan mı aldın? Bana indirim yapmaz o...";
