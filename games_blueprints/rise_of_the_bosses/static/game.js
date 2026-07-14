// ===================== SNAKE EVOLUTION: RISE OF THE BOSSES =====================

let CANVAS_W = 1200, CANVAS_H = 750; // mutable: resized to fill available space / true fullscreen
const SEGMENT_SPACING = 5.5;
const FOOD_TYPES = [
  { key: "normal", color: "#8bc34a", radius: 4, xp: 3,  gold: 1,  weight: 55 },
  { key: "xp",     color: "#ffd54f", radius: 5, xp: 9,  gold: 1,  weight: 20 },
  { key: "gold",   color: "#ffb300", radius: 5, xp: 2,  gold: 9,  weight: 15 },
  { key: "crystal",color: "#40c4ff", radius: 6, xp: 16, gold: 4,  weight: 7 },
  { key: "mega",   color: "#ff3d81", radius: 8, xp: 30, gold: 7,  weight: 3 },
];
let MAX_FOOD = 70;
let AI_COUNT = 16;
let glowEnabled = true;
let targetFps = 60;

const GRAPHICS_PRESETS = {
  dusuk:  { ai: 7,  food: 110, glow: false },
  orta:   { ai: 11, food: 170, glow: true },
  yuksek: { ai: 16, food: 230, glow: true },
};

let settings = { sound: true, music: true, musicTrack: 'yumusak', graphics: 'orta', fps: 60, vibration: true, notifications: false, language: 'tr' };

function applyGraphicsPreset(key) {
  const preset = GRAPHICS_PRESETS[key] || GRAPHICS_PRESETS.orta;
  AI_COUNT = preset.ai;
  MAX_FOOD = preset.food;
  glowEnabled = preset.glow;
}

// ---------------- Audio ----------------
let audioCtx = null;
let musicNodes = null;
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playTone(freq, duration, type, vol, delay) {
  if (!settings.sound) return;
  const ac = getAudioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + (delay || 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol || 0.15, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}
function sfxEat() { playTone(620, 0.08, 'triangle', 0.08); }
function sfxEatAI() { playTone(180, 0.15, 'sawtooth', 0.1); }
function sfxLevelUp() { playTone(500, 0.1, 'sine', 0.12); playTone(750, 0.12, 'sine', 0.12, 0.09); }
function sfxShield() { playTone(900, 0.2, 'sine', 0.14); }
function sfxBossAppear() { playTone(110, 0.5, 'sawtooth', 0.12); }
function sfxBossWin() { playTone(523, 0.15, 'triangle', 0.14); playTone(659, 0.15, 'triangle', 0.14, 0.14); playTone(784, 0.25, 'triangle', 0.16, 0.28); }
function sfxBossLose() { playTone(300, 0.3, 'sawtooth', 0.14); playTone(180, 0.4, 'sawtooth', 0.14, 0.25); }

const MUSIC_TRACKS = {
  yumusak: { notes: [130.81, 164.81, 196.00], gain: 0.022, type: 'sine',     chordSpeed: 7 },
  ambient: { notes: [110.00, 146.83, 164.81], gain: 0.020, type: 'sine',     chordSpeed: 11 },
  enerjik: { notes: [196.00, 246.94, 293.66, 349.23], gain: 0.026, type: 'triangle', chordSpeed: 4 },
};

function startMusic() {
  if (!settings.music || musicNodes) return;
  const ac = getAudioCtx();
  if (!ac) return;
  const track = MUSIC_TRACKS[settings.musicTrack] || MUSIC_TRACKS.yumusak;
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.connect(ac.destination);
  gain.gain.linearRampToValueAtTime(track.gain, ac.currentTime + 1.2);

  const oscs = track.notes.map((freq, i) => {
    const osc = ac.createOscillator();
    osc.type = track.type;
    osc.frequency.value = freq;
    // slight detune per voice for a softer, wider chorus-like feel
    osc.detune.value = (i - 1) * 4;
    osc.connect(gain);
    osc.start();
    return osc;
  });

  musicNodes = { oscs, gain, ac };
}
function stopMusic() {
  if (!musicNodes) return;
  try {
    musicNodes.gain.gain.linearRampToValueAtTime(0, musicNodes.ac.currentTime + 0.4);
    musicNodes.oscs.forEach(o => o.stop(musicNodes.ac.currentTime + 0.45));
  } catch (e) { /* already stopped */ }
  musicNodes = null;
}
function restartMusicIfPlaying() {
  if (musicNodes) { stopMusic(); startMusic(); }
}
function vibrate(pattern) {
  if (settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
}

const POWERUP_TYPES = {
  magnet: { icon: '🧲', color: '#40c4ff', duration: 15, label: 'Mıknatıs', labelEn: 'Magnet' },
  speed:  { icon: '⚡', color: '#ffeb3b', duration: 15, label: 'Hız', labelEn: 'Speed' },
};

const MAP_EVENTS = {
  xpRain:     { icon: '✨', name: 'XP Yağmuru',        nameEn: 'XP Rain',        desc: 'XP kazancı x2!',                descEn: 'XP gain x2!',                    color: '#ffd54f', duration: 30 },
  goldStorm:  { icon: '🟡', name: 'Altın Fırtınası',    nameEn: 'Gold Storm',     desc: 'Nadir altın yemler yağıyor!',   descEn: 'Rare gold food is raining down!', color: '#ffb300', duration: 30 },
  lowGravity: { icon: '🌙', name: 'Düşük Yerçekimi',    nameEn: 'Low Gravity',    desc: 'Yılanlar daha akıcı dönüyor!',  descEn: 'Snakes turn much more smoothly!', color: '#40c4ff', duration: 30 },
  giantWave:  { icon: '🌊', name: 'Dev Yem Dalgası',    nameEn: 'Giant Food Wave','desc': 'Devasa yemler belirdi!',      descEn: 'Giant food has appeared!',        color: '#ff3d81', duration: 4 },
};
const MAP_EVENT_KEYS = Object.keys(MAP_EVENTS);

function getBuffEffects() {
  if (!state) return { magnetBonus: 0, speedBonus: 0 };
  const t = state.matchElapsedSeconds;
  return {
    magnetBonus: (state.magnetBuffUntil && t < state.magnetBuffUntil) ? 240 : 0,
    speedBonus: (state.speedBuffUntil && t < state.speedBuffUntil) ? 0.9 : 0,
  };
}

function getEventEffects() {
  const base = { xpMult: 1, turnMult: 1, goldBonus: 0 };
  if (!state || !state.activeEvent) return base;
  switch (state.activeEvent.type) {
    case 'xpRain': return { ...base, xpMult: 2 };
    case 'goldStorm': return { ...base, goldBonus: 45 };
    case 'lowGravity': return { ...base, turnMult: 1.8 };
    default: return base;
  }
}

const MEDAL_INFO = [
  { key: 'bronze', name: 'Bronz', nameEn: 'Bronze', icon: '🥉' },
  { key: 'silver', name: 'Gümüş', nameEn: 'Silver', icon: '🥈' },
  { key: 'gold', name: 'Altın', nameEn: 'Gold', icon: '🥇' },
  { key: 'diamond', name: 'Elmas', nameEn: 'Diamond', icon: '💎' },
  { key: 'legendary', name: 'Efsanevi', nameEn: 'Legendary', icon: '👑' },
];

let skinsCache = null;

async function fetchSkins() {
  const res = await fetch('/api/skins');
  skinsCache = await res.json();
  updateSkinPreview();
}

const SHAPE_LABELS = {
  daire:   { tr: 'Daire Gövde',   en: 'Round Body' },
  kare:    { tr: 'Kare Gövde',    en: 'Square Body' },
  elmas:   { tr: 'Elmas Gövde',   en: 'Diamond Body' },
  altigen: { tr: 'Altıgen Gövde', en: 'Hexagon Body' },
  yildiz:  { tr: 'Yıldız Gövde',  en: 'Star Body' },
};

const PATTERN_LABELS = {
  solid:    { tr: 'Düz Renk',     en: 'Solid Color' },
  gradient: { tr: 'Gradyan',      en: 'Gradient' },
  striped:  { tr: 'Çizgili',      en: 'Striped' },
  scales:   { tr: 'Pullu',        en: 'Scaled' },
  rainbow:  { tr: 'Gökkuşağı',    en: 'Rainbow' },
  glow:     { tr: 'Neon Parlama', en: 'Neon Glow' },
  sparkle:  { tr: 'Parıltılı',    en: 'Sparkly' },
};
function patternLabel(key) { return PATTERN_LABELS[key] ? PATTERN_LABELS[key][settings.language] : ''; }
function shapeLabel(key) { return SHAPE_LABELS[key] ? SHAPE_LABELS[key][settings.language] : ''; }

function skinSwatchCss(skin) {
  const c1 = skin.color, c2 = skin.color2 || skin.color;
  let base;
  switch (skin.pattern) {
    case 'gradient': base = `background: linear-gradient(135deg, ${c1}, ${c2});`; break;
    case 'striped': base = `background: repeating-linear-gradient(45deg, ${c1}, ${c1} 5px, ${c2} 5px, ${c2} 10px);`; break;
    case 'scales': base = `background-color:${c2}; background-image: radial-gradient(${c1} 35%, transparent 36%); background-size: 7px 7px;`; break;
    case 'rainbow': base = `background: conic-gradient(red, orange, yellow, green, blue, violet, red);`; break;
    case 'glow': base = `background:${c1}; box-shadow: 0 0 10px ${c2};`; break;
    case 'sparkle': base = `background-color:${c1}; background-image: radial-gradient(white 12%, transparent 13%); background-size: 6px 6px;`; break;
    default: base = `background:${c1};`;
  }
  const shapeCss = {
    kare: 'border-radius: 6px;',
    elmas: 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); border-radius:0;',
    altigen: 'clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); border-radius:0;',
    yildiz: 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); border-radius:0;',
  }[skin.shape] || '';
  return base + shapeCss;
}

function updateSkinPreview() {
  const swatch = document.getElementById('p-skin-swatch');
  const nameEl = document.getElementById('p-skin-name');
  if (!swatch || !skinsCache) return;
  const key = skinsCache.equippedSkin || 'default';
  let name = t('defaultSkinName');
  const skin = resolveEquippedSkin();
  if (key.startsWith('boss:')) {
    const bs = skinsCache.bossSkins.find(b => b.key === key);
    if (bs) name = L(bs, 'name');
  } else if (key !== 'default') {
    const cs = skinsCache.catalog.find(s => s.key === key);
    if (cs) name = L(cs, 'name');
  }
  swatch.setAttribute('style', `width:16px; height:16px; border-radius:50%; display:inline-block; border:1px solid rgba(255,255,255,0.3); ${skinSwatchCss(skin)}`);
  nameEl.textContent = name;
}

function resolveEquippedSkin() {
  const fallback = { color: '#39ff88', color2: '#39ff88', pattern: 'solid', shape: 'daire' };
  if (!skinsCache) return fallback;
  const key = skinsCache.equippedSkin || 'default';
  if (key === 'default') return fallback;
  if (key.startsWith('boss:')) {
    const bs = skinsCache.bossSkins.find(b => b.key === key);
    return bs ? { color: bs.color, color2: bs.color2 || bs.color, pattern: bs.pattern || 'solid', shape: bs.shape || 'daire' } : fallback;
  }
  const cs = skinsCache.catalog.find(s => s.key === key);
  return cs ? { color: cs.color, color2: cs.color2 || cs.color, pattern: cs.pattern || 'solid', shape: cs.shape || 'daire' } : fallback;
}

const TRANSLATIONS = {
  playerNameLabel: { tr: 'Oyuncu Adı', en: 'Player Name' },
  playerNamePlaceholder: { tr: 'İsmini gir...', en: 'Enter your name...' },
  modeLabel: { tr: 'Oyun Modu', en: 'Game Mode' },
  mode1: { tr: '1 Dakika', en: '1 Minute' },
  mode2: { tr: '2 Dakika', en: '2 Minutes' },
  mode3: { tr: '3 Dakika', en: '3 Minutes' },
  mode5: { tr: '5 Dakika', en: '5 Minutes' },
  modeEndless: { tr: 'Sonsuz Mod', en: 'Endless Mode' },
  difficultyLabel: { tr: 'Zorluk', en: 'Difficulty' },
  diffEasy: { tr: 'Kolay', en: 'Easy' },
  diffNormal: { tr: 'Normal', en: 'Normal' },
  diffHard: { tr: 'Zor', en: 'Hard' },
  startBtn: { tr: '▶ OYUNA BAŞLA', en: '▶ START GAME' },
  marketBtn: { tr: '🛒 Market', en: '🛒 Market' },
  questsBtn: { tr: '📅 Görevler', en: '📅 Quests' },
  achievementsBtn: { tr: '🏆 Başarımlar', en: '🏆 Achievements' },
  statsBtn: { tr: '📊 İstatistikler', en: '📊 Statistics' },
  dailyBtn: { tr: '🎁 Günlük Ödül', en: '🎁 Daily Reward' },
  bossesBtn: { tr: '🧩 Boss Koleksiyonu', en: '🧩 Boss Collection' },
  settingsBtn: { tr: '⚙ Ayarlar', en: '⚙ Settings' },
  chestsBtn: { tr: '🎰 Boss Sandıkları', en: '🎰 Boss Chests' },
  skinsBtn: { tr: '🎨 Skinler', en: '🎨 Skins' },
  leaderboardBtn: { tr: '📋 Skor Tablosu', en: '📋 Leaderboard' },
  arenasBtn: { tr: '🗺 Arena Seç', en: '🗺 Choose Arena' },
  newBadge: { tr: 'YENİ', en: 'NEW' },
  helpText: {
    tr: 'Fare ile yönünü kontrol et. Yem topla, seviye atla, senden küçük yılanları ye. Süre bitince (veya sonsuz modda periyodik olarak) bir Final Boss karşına çıkar — leveline göre kazanır ya da kaybedersin.',
    en: 'Control your direction with the mouse. Collect food, level up, eat snakes smaller than you. When time runs out (or periodically in Endless Mode) a Final Boss appears — you win or lose based on your level.'
  },
  playerLabel: { tr: 'Oyuncu', en: 'Player' },
  arenaLabel: { tr: '🗺 Arenan', en: '🗺 Your Arena' },
  appearanceLabel: { tr: '🎨 Görünümün', en: '🎨 Your Skin' },
  defaultSkinName: { tr: 'Varsayılan', en: 'Default' },
  totalGoldLabel: { tr: 'Toplam Altın', en: 'Total Gold' },
  bestLevelLabel: { tr: 'En Yüksek Level', en: 'Best Level' },
  longestSnakeLabel: { tr: 'En Uzun Yılan', en: 'Longest Snake' },
  bossWinsLabel: { tr: 'Boss Galibiyeti', en: 'Boss Wins' },
  totalGamesLabel: { tr: 'Toplam Oyun / Galibiyet', en: 'Total Games / Wins' },
  medalsLabel: { tr: '🏅 Madalyalar', en: '🏅 Medals' },
  bossCollectionLabel: { tr: 'Boss Koleksiyonu', en: 'Boss Collection' },
  backBtn: { tr: '← Ana Menü', en: '← Main Menu' },
  marketTitle: { tr: '🛒 Market', en: '🛒 Market' },
  marketSub: { tr: 'Altınını kalıcı geliştirmelere harca — her seviye biraz daha pahalı olur.', en: 'Spend your gold on permanent upgrades — each level costs a bit more.' },
  questsTitle: { tr: '📅 Günlük Görevler', en: '📅 Daily Quests' },
  questsSub: { tr: 'Görevler her gün sıfırlanır. Tamamlayınca ödülünü almayı unutma!', en: 'Quests reset every day. Don\'t forget to claim your reward when done!' },
  achievementsTitle: { tr: '🏆 Başarımlar', en: '🏆 Achievements' },
  achievementsSub: { tr: 'Kalıcı hedefler — bir kez tamamlanır, bir kez ödül verir.', en: 'Permanent goals — completed once, rewarded once.' },
  statsTitle: { tr: '📊 İstatistikler', en: '📊 Statistics' },
  statsSub: { tr: 'Tüm zamanlar boyunca topladığın veriler.', en: 'Your all-time stats.' },
  dailyTitle: { tr: '🎁 Günlük Giriş Ödülü', en: '🎁 Daily Login Reward' },
  dailySub: { tr: 'Her gün giriş yap, ödülünü al. 7. gün özel Boss Sandığı! Bir gün kaçırırsan seri sıfırlanır.', en: 'Log in every day to claim a reward. Day 7 gives a special Boss Chest! Miss a day and your streak resets.' },
  claimBtn: { tr: 'Ödülü Al', en: 'Claim Reward' },
  bossesTitle: { tr: '🧩 Boss Koleksiyonu', en: '🧩 Boss Collection' },
  bossesSub: { tr: 'İlk galibiyet skin açar. Sonraki galibiyetler Boss Parçası verir — 100 parça ile Legendary (sadece görsel) versiyon açılır.', en: 'The first win unlocks a skin. Further wins grant Boss Fragments — 100 fragments unlock a Legendary (cosmetic only) version.' },
  settingsTitle: { tr: '⚙ Ayarlar', en: '⚙ Settings' },
  settingsSub: { tr: 'Değişiklikler anında uygulanır ve kaydedilir.', en: 'Changes apply and save instantly.' },
  soundLabel: { tr: '🔊 Ses Efektleri', en: '🔊 Sound Effects' },
  musicLabel: { tr: '🎵 Müzik', en: '🎵 Music' },
  musicTrackLabel: { tr: '🎼 Müzik Türü', en: '🎼 Music Track' },
  trackSoft: { tr: 'Yumuşak', en: 'Soft' },
  trackAmbient: { tr: 'Ambient', en: 'Ambient' },
  trackEnergetic: { tr: 'Enerjik', en: 'Energetic' },
  graphicsLabel: { tr: '🎨 Grafik Kalitesi', en: '🎨 Graphics Quality' },
  graphicsLow: { tr: 'Düşük', en: 'Low' },
  graphicsMed: { tr: 'Orta', en: 'Medium' },
  graphicsHigh: { tr: 'Yüksek', en: 'High' },
  vibrationLabel: { tr: '📳 Titreşim', en: '📳 Vibration' },
  vibrationNote: { tr: '(mobil cihazlarda)', en: '(on mobile devices)' },
  notificationsLabel: { tr: '🔔 Bildirimler', en: '🔔 Notifications' },
  notificationsNote: { tr: '(tarayıcı izni gerekir)', en: '(requires browser permission)' },
  langLabel: { tr: '🌐 Dil', en: '🌐 Language' },
  chestsTitle: { tr: '🎰 Boss Sandıkları', en: '🎰 Boss Chests' },
  chestsSub: { tr: 'Boss yenince nadire göre sandık düşer: Bronz, Gümüş, Altın, Elmas, Efsanevi. Sandıklardan altın, boss parçası ve nadir kozmetikler çıkabilir.', en: 'Defeating a boss drops a chest based on rarity: Bronze, Silver, Gold, Diamond, Legendary. Chests may contain gold, boss fragments, and rare cosmetics.' },
  openAllBtn: { tr: 'Tümünü Aç', en: 'Open All' },
  cosmeticsLabel: { tr: '🎨 Kozmetik Koleksiyonu', en: '🎨 Cosmetic Collection' },
  skinsTitle: { tr: '🎨 Skinler', en: '🎨 Skins' },
  skinsSub: { tr: 'Oyun parasıyla renk satın al veya boss yenerek açtığın görünümleri seç. Seçili skin oyunda yılanının rengi olur.', en: 'Buy colors with in-game gold or select looks unlocked by defeating bosses. The selected skin becomes your snake\'s appearance in-game.' },
  purchasableLabel: { tr: 'Satın Alınabilir Renkler', en: 'Purchasable Colors' },
  bossSkinsLabel: { tr: 'Boss Skinleri', en: 'Boss Skins' },
  leaderboardTitle: { tr: '📋 Skor Tablosu', en: '📋 Leaderboard' },
  leaderboardSub: { tr: 'Maç sonunda hesaplanan skorunla kaydolabilirsin. Skor = level×10 + yenilen yılan×6 + boss galibiyeti bonusu + yem/altın bonusu.', en: 'You can save your score at the end of a match. Score = level×10 + snakes eaten×6 + boss win bonus + food/gold bonus.' },
  clearAllBtn: { tr: '🗑 Tümünü Temizle', en: '🗑 Clear All' },
  arenasTitle: { tr: '🗺 Arena Seç', en: '🗺 Choose Arena' },
  arenasSub: { tr: 'Level yükseldikçe yeni arenaların kilidi açılır. Her arenanın kendine has bir atmosferi var.', en: 'New arenas unlock as your level increases. Each arena has its own atmosphere.' },
  // common action words
  selectBtn: { tr: 'Seç', en: 'Select' },
  selectedBtn: { tr: 'Seçili ✔', en: 'Selected ✔' },
  buyBtn: { tr: 'Satın Al', en: 'Buy' },
  maxBtn: { tr: '✔ MAKSİMUM', en: '✔ MAX LEVEL' },
  upgradeBtn: { tr: 'Yükselt', en: 'Upgrade' },
  claimedBtn: { tr: 'Alındı ✔', en: 'Claimed ✔' },
  claimBtnShort: { tr: 'Talep Et', en: 'Claim' },
  inProgress: { tr: 'Devam Ediyor', en: 'In Progress' },
  lockedLabel: { tr: '🔒 Kilitli', en: '🔒 Locked' },
  skinUnlockedLabel: { tr: '✔ Skin Açık', en: '✔ Skin Unlocked' },
  defeatFirstLabel: { tr: '🔒 Önce Yen', en: '🔒 Defeat First' },
  legendaryLabel: { tr: '🌟 Legendary', en: '🌟 Legendary' },
  rewardLabel: { tr: 'Ödül', en: 'Reward' },
  levelAbbrev: { tr: 'Lv', en: 'Lv' },
  openBtn: { tr: 'Aç', en: 'Open' },
  chestEmptyLabel: { tr: 'Henüz sandığın yok. Boss yenerek sandık kazan!', en: 'No chests yet. Defeat bosses to earn chests!' },
  noCosmeticsLabel: { tr: 'Henüz kozmetik açılmadı', en: 'No cosmetics unlocked yet' },
  greatBtn: { tr: 'Harika!', en: 'Awesome!' },
  finalBossTitle: { tr: '⚔ FINAL BOSS BELİRDİ', en: '⚔ FINAL BOSS APPEARED' },
  victoryTitle: { tr: '🏆 ZAFER!', en: '🏆 VICTORY!' },
  defeatTitle: { tr: '💀 YENİLDİN', en: '💀 DEFEATED' },
  continueBtn: { tr: 'Devam Et', en: 'Continue' },
  noRewardText: { tr: 'Ödül yok. Daha güçlenip tekrar dene!', en: 'No reward. Get stronger and try again!' },
  matchScoreLabel: { tr: 'Maç Skoru', en: 'Match Score' },
  medalWord: { tr: 'Madalya', en: 'Medal' },
  saveScoreTitle: { tr: '📋 Skoru Tabloya Kaydet', en: '📋 Save Score to Leaderboard' },
  namePlaceholder: { tr: 'İsmini yaz...', en: 'Enter your name...' },
  saveBtn: { tr: 'Kaydet', en: 'Save' },
  skipBtn: { tr: 'Geç', en: 'Skip' },
  settingSaved: { tr: 'Ayar kaydedildi.', en: 'Setting saved.' },
  emptyLeaderboard: { tr: 'Henüz kayıtlı skor yok. Bir maç bitir ve skorunu kaydet!', en: 'No scores yet. Finish a match and save your score!' },
  insufficientGold: { tr: 'Yetersiz altın! Gerekli', en: 'Not enough gold! Needed' },
  alreadyMax: { tr: 'Bu geliştirme zaten maksimum seviyede!', en: 'This upgrade is already at max level!' },
  purchaseFailed: { tr: 'Satın alma başarısız.', en: 'Purchase failed.' },
  questClaimed: { tr: 'Görev tamamlandı!', en: 'Quest completed!' },
  questNotReady: { tr: 'Görev henüz tamamlanmadı veya zaten alındı.', en: 'Quest not complete yet, or already claimed.' },
  achievementClaimed: { tr: '🏆 Başarım tamamlandı!', en: '🏆 Achievement completed!' },
  achievementNotReady: { tr: 'Başarım henüz tamamlanmadı veya zaten alındı.', en: 'Achievement not complete yet, or already claimed.' },
  chestOpenFailed: { tr: 'Sandık açılamadı.', en: 'Could not open chest.' },
  noChestsToOpen: { tr: 'Açılacak sandığın yok.', en: 'You have no chests to open.' },
  newCosmeticSuffix: { tr: 'yeni kozmetik', en: 'new cosmetic(s)' },
  chestsOpenedSuffix: { tr: 'sandık açıldı!', en: 'chest(s) opened!' },
  dayWord: { tr: 'gün', en: 'day' },
  dayLabel: { tr: 'Gün', en: 'Day' },
  alreadyClaimedToday: { tr: 'Bugün Zaten Alındı ✔', en: 'Already Claimed Today ✔' },
  wonChestSuffix: { tr: 'kazandın! Boss Sandıkları\'ndan aç.', en: 'won! Open it from Boss Chests.' },
  wonSuffix: { tr: 'kazandın!', en: 'won!' },
  dailyAlreadyClaimed: { tr: 'Bugünün ödülü zaten alınmış.', en: 'Today\'s reward has already been claimed.' },
  fragmentSuffix: { tr: 'Parçası', en: 'Fragment' },
  legendaryUnlockedText: { tr: '🌟 LEGENDARY AÇILDI!', en: '🌟 LEGENDARY UNLOCKED!' },
  skinPurchased: { tr: '🎨 Skin satın alındı!', en: '🎨 Skin purchased!' },
  skinEquipped: { tr: 'Skin seçildi! Bir sonraki oyunda görünecek.', en: 'Skin selected! It will show in your next game.' },
  skinNotOwned: { tr: 'Bu skin henüz sana ait değil.', en: 'You don\'t own this skin yet.' },
  arenaChanged: { tr: '🗺 Arena değiştirildi! Bir sonraki maçında uygulanacak.', en: '🗺 Arena changed! It will apply to your next match.' },
  arenaLocked: { tr: 'Bu arena henüz kilitli.', en: 'This arena is still locked.' },
  newSkinLabel: { tr: 'Yeni Skin', en: 'New Skin' },
  collectionPointLabel: { tr: 'Koleksiyon Puanı', en: 'Collection Point' },
  eatenByBigger: { tr: 'Daha büyük bir yılan seni yedi. Ulaştığın level', en: 'A bigger snake ate you. Level reached' },
  pointsWord: { tr: 'puan', en: 'points' },
  scoreSavedToast: { tr: '🏆 Skorun tabloya kaydedildi!', en: '🏆 Your score was saved to the leaderboard!' },
  confirmPrestige: { tr: 'Tüm geliştirmelerin sıfırlanacak ve karşılığında özel bir kozmetik rozet kazanacaksın. Emin misin?', en: 'All your upgrades will reset, and you\'ll receive a special cosmetic badge in return. Are you sure?' },
  confirmQuit: { tr: 'Oyundan çıkıp ana menüye dönmek istediğine emin misin? Bu maçın skoru kaydedilmeyecek.', en: 'Are you sure you want to quit to the main menu? This match\'s score will not be saved.' },
  confirmClearLeaderboard: { tr: 'Skor tablosundaki TÜM kayıtları silmek istediğine emin misin?', en: 'Are you sure you want to delete ALL leaderboard entries?' },
  leaderboardCleared: { tr: 'Skor tablosu temizlendi.', en: 'Leaderboard cleared.' },
  prestigeSystemLabel: { tr: '🌟 Prestij Sistemi', en: '🌟 Prestige System' },
  currentPrestigeLabel: { tr: 'Şu anki: Prestij', en: 'Current: Prestige' },
  prestigeDesc: { tr: 'Tüm 7 geliştirmeyi Lv 100\'e ulaştır, istersen Prestij yap: geliştirmeler sıfırlanır ama özel bir kozmetik rozet kazanırsın. Güç avantajı sağlamaz, sadece statü.', en: 'Get all 7 upgrades to Lv 100, then Prestige if you want: upgrades reset but you earn a special cosmetic badge. No power advantage, just status.' },
  upgradesMaxedLabel: { tr: 'geliştirme maksimum seviyede', en: 'upgrades at max level' },
  prestigeBtnReady: { tr: '🌟 Prestij Yap', en: '🌟 Prestige Now' },
  prestigeBtnNotReady: { tr: 'Henüz Hazır Değil', en: 'Not Ready Yet' },
  prestigeToast: { tr: 'oldun! Ödül', en: 'reached! Reward' },
  prestigeWord: { tr: 'Prestij', en: 'Prestige' },
  prestigeFailToast: { tr: 'Prestij için tüm geliştirmeler Lv 100 olmalı.', en: 'All upgrades must be Lv 100 to Prestige.' },
  shieldSavedYou: { tr: 'Kalkan seni kurtardı!', en: 'Your shield saved you!' },
  remainingWord: { tr: 'kalan', en: 'left' },
  notifPermDenied: { tr: 'Bildirim izni verilmedi.', en: 'Notification permission denied.' },
  dailyRewardReady: { tr: '🎁 Günlük ödülün hazır! Menüden alabilirsin.', en: '🎁 Your daily reward is ready! Claim it from the menu.' },
  protectedLabel: { tr: 'Korumalısın', en: 'You are protected' },
  statTotalGames: { tr: 'Toplam Oyun', en: 'Total Games' },
  statWins: { tr: 'Galibiyet', en: 'Wins' },
  statLosses: { tr: 'Mağlubiyet', en: 'Losses' },
  statBossWins: { tr: 'Boss Galibiyeti', en: 'Boss Wins' },
  statBestLevel: { tr: 'En Büyük Level', en: 'Best Level' },
  statLongestSnake: { tr: 'En Uzun Yılan', en: 'Longest Snake' },
  statAIEaten: { tr: 'Yenilen Yılan Sayısı', en: 'Snakes Eaten' },
  statFoodEaten: { tr: 'Toplanan Yem', en: 'Food Collected' },
  statGoldEarned: { tr: 'Toplanan Altın', en: 'Gold Earned' },
  statLongestGame: { tr: 'En Uzun Oyun', en: 'Longest Game' },
  statTotalTime: { tr: 'Toplam Süre', en: 'Total Time' },
  statFlawlessBoss: { tr: 'Kayıpsız Boss Zaferi', en: 'Flawless Boss Wins' },
};

function t(key) {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[settings.language] || entry.tr;
}

function L(obj, field) {
  if (!obj) return '';
  if (settings.language === 'en' && obj[field + 'En']) return obj[field + 'En'];
  return obj[field];
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[key]) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (TRANSLATIONS[key]) el.placeholder = t(key);
  });
  document.documentElement.lang = settings.language;
}

let canvas, ctx;
let profile = null;
let bosses = [];
let state = null; // active game state
let upgradeDefsData = {}; // key -> {name, icon, desc}
let upgradeMaxLevel = 100;
let questDefs = [];
let questState = null;

const UPGRADE_BASE_TABLE = { 1: 100, 2: 300, 3: 500, 4: 1000, 5: 1500, 6: 2200, 7: 3000, 8: 4000, 9: 5200, 10: 6500 };
function upgradeCost(levelAfter) {
  if (levelAfter <= 10) return UPGRADE_BASE_TABLE[levelAfter] || 100;
  return Math.round(6500 * Math.pow(1.10, levelAfter - 10));
}
function computeEffects(upgrades) {
  upgrades = upgrades || {};
  return {
    speedMult: 1 + (upgrades.hiz || 0) * 0.003,
    magnetRadius: 30 + (upgrades.miknatis || 0) * 1.2,
    xpMult: 1 + (upgrades.xpBonus || 0) * 0.005,
    goldMult: 1 + (upgrades.altinBonus || 0) * 0.005,
    shields: Math.floor((upgrades.dayaniklilik || 0) / 25),
    luckBonus: (upgrades.sans || 0) * 0.4,
    bossPowerBonus: (upgrades.bossGucu || 0) * 0.1,
  };
}
function effectLabel(key, upgrades) {
  const e = computeEffects(upgrades);
  switch (key) {
    case 'hiz': return `Hız çarpanı: x${e.speedMult.toFixed(2)}`;
    case 'miknatis': return `Çekim menzili: ${e.magnetRadius.toFixed(0)}px`;
    case 'xpBonus': return `XP çarpanı: x${e.xpMult.toFixed(2)}`;
    case 'altinBonus': return `Altın çarpanı: x${e.goldMult.toFixed(2)}`;
    case 'dayaniklilik': return `Kalkan sayısı: ${e.shields}`;
    case 'sans': return `Nadir yem şansı: +${e.luckBonus.toFixed(0)}`;
    case 'bossGucu': return `Boss karşısında: +${e.bossPowerBonus.toFixed(1)} level`;
    default: return '';
  }
}
function showToast(msg) {
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.textContent = msg;
  document.body.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), 2200);
}

// ---------------- Profile / API ----------------
async function fetchProfile() {
  const res = await fetch('/api/profile');
  profile = await res.json();
  if (profile.settings) settings = { ...settings, ...profile.settings };
  applyGraphicsPreset(settings.graphics);
  targetFps = settings.fps;
  applyLanguage();
  renderProfile();
}
async function fetchBosses() {
  const res = await fetch('/api/bosses');
  bosses = await res.json();
}
async function postGameResult(payload) {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  profile = await res.json();
  renderProfile();
  if (profile.legendaryUnlockedNow) {
    showToast(`🌟 ${profile.legendaryUnlockedNow} Legendary skin açıldı!`);
  }
  if (profile.chestDroppedNow) {
    showToast(`${profile.chestDroppedNow.icon} ${L(profile.chestDroppedNow, 'tierName')} ${t('wonChestSuffix')}`);
    const dot = document.getElementById('chest-dot');
    if (dot) dot.classList.remove('hidden');
  }
  if (profile.medalEarnedNow) {
    showMedalReveal(profile.medalEarnedNow);
    setTimeout(() => showScoreSaveCard(profile.medalEarnedNow.score, state ? state.player.level : profile.bestLevel), 900);
  }
}

function renderProfile() {
  if (!profile) return;
  document.getElementById('p-name').innerHTML = profile.name + (profile.prestigeLevel > 0 ? `<span class="prestige-badge">🌟 P${profile.prestigeLevel}</span>` : '');
  document.getElementById('p-gold').textContent = profile.totalGold;
  document.getElementById('p-level').textContent = profile.bestLevel;
  document.getElementById('p-snake').textContent = profile.longestSnake;
  document.getElementById('p-bosswins').textContent = profile.stats.bossWins;
  document.getElementById('p-games').textContent = `${profile.stats.games} / ${profile.stats.wins}`;
  document.getElementById('player-name').value = profile.name === 'Oyuncu' ? '' : profile.name;

  const medalRow = document.getElementById('medal-row');
  medalRow.innerHTML = MEDAL_INFO.map(m => `
    <div class="medal-chip" title="${L(m, 'name')}">
      <div class="m-icon">${m.icon}</div>
      <div class="m-count">${(profile.medals && profile.medals[m.key]) || 0}</div>
    </div>
  `).join('');

  const list = document.getElementById('boss-list');
  list.innerHTML = '';
  bosses.forEach(b => {
    const chip = document.createElement('div');
    chip.className = 'boss-chip' + (profile.bossesDefeated.includes(b.name) ? ' done' : '');
    chip.textContent = (profile.bossesDefeated.includes(b.name) ? '✔ ' : '') + L(b, 'name');
    list.appendChild(chip);
  });
}

// ---------------- Menu wiring ----------------
let selectedMode = 120;
let selectedDifficulty = 'normal';
const DIFFICULTY_PRESETS = {
  easy:   { aiCountMult: 0.65, aiLevelMax: 6,  speedMult: 0.85 },
  normal: { aiCountMult: 1.0,  aiLevelMax: 10, speedMult: 1.0 },
  hard:   { aiCountMult: 1.5,  aiLevelMax: 20, speedMult: 1.2 },
};

document.addEventListener('fullscreenchange', () => {
  if (state && state.running) resizeCanvas(true);
});
window.addEventListener('resize', () => {
  if (state && state.running) resizeCanvas(true);
});

function setupMenu() {
  document.querySelectorAll('#mode-grid .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-grid .mode-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMode = parseInt(btn.dataset.mode, 10);
    });
  });
  document.querySelector('#mode-grid .mode-btn[data-mode="120"]').classList.add('selected');

  document.querySelectorAll('#difficulty-grid .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#difficulty-grid .mode-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDifficulty = btn.dataset.difficulty;
    });
  });
  document.querySelector('#difficulty-grid .mode-btn[data-difficulty="normal"]').classList.add('selected');

  document.getElementById('start-btn').addEventListener('click', startGame);

  document.getElementById('open-market-btn').addEventListener('click', openMarket);
  document.getElementById('open-quests-btn').addEventListener('click', openQuests);
  document.getElementById('open-achievements-btn').addEventListener('click', openAchievements);
  document.getElementById('open-stats-btn').addEventListener('click', openStats);
  document.getElementById('open-daily-btn').addEventListener('click', openDailyLogin);
  document.getElementById('open-bosses-btn').addEventListener('click', openBossCollection);
  document.getElementById('open-settings-btn').addEventListener('click', openSettings);
  document.getElementById('open-chests-btn').addEventListener('click', openChests);
  document.getElementById('open-skins-btn').addEventListener('click', openSkins);
  document.getElementById('open-leaderboard-btn').addEventListener('click', openLeaderboard);
  document.getElementById('open-arenas-btn').addEventListener('click', openArenas);
  document.getElementById('arenas-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('leaderboard-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('clear-leaderboard-btn').addEventListener('click', clearLeaderboard);
  document.getElementById('market-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('quests-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('achievements-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('stats-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('daily-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('daily-claim-btn').addEventListener('click', claimDailyLoginReward);
  document.getElementById('bosses-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('settings-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('chests-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('skins-back-btn').addEventListener('click', closeSubScreens);
  document.getElementById('open-all-chests-btn').addEventListener('click', openAllChests);
  document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
  document.getElementById('quit-to-menu-btn').addEventListener('click', quitToMenu);
  setupSettingsControls();
}

function hideAllSubScreens() {
  ['market-screen', 'quests-screen', 'achievements-screen', 'stats-screen', 'daily-screen', 'bosses-screen', 'settings-screen', 'chests-screen', 'skins-screen', 'leaderboard-screen', 'arenas-screen'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
}

function closeSubScreens() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.remove('hidden');
}

// ---------------- Market ----------------
async function fetchUpgradeDefs() {
  const res = await fetch('/api/upgrades');
  const data = await res.json();
  upgradeDefsData = data.defs;
  upgradeMaxLevel = data.maxLevel;
}

async function openMarket() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('market-screen').classList.remove('hidden');
  renderMarket();
  await renderPrestigeBox();
}

function renderMarket() {
  document.getElementById('market-gold').textContent = profile.totalGold;
  const grid = document.getElementById('upgrade-grid');
  grid.innerHTML = '';
  Object.keys(upgradeDefsData).forEach(key => {
    const def = upgradeDefsData[key];
    const level = (profile.upgrades && profile.upgrades[key]) || 0;
    const maxed = level >= upgradeMaxLevel;
    const cost = maxed ? null : upgradeCost(level + 1);
    const canAfford = !maxed && profile.totalGold >= cost;

    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `
      <div class="u-top">
        <div class="u-name">${def.icon} ${L(def, 'name')}</div>
        <div class="u-level">${t('levelAbbrev')} ${level}/${upgradeMaxLevel}</div>
      </div>
      <div class="u-desc">${L(def, 'desc')}<br><span style="color:var(--accent)">${effectLabel(key, profile.upgrades)}</span></div>
      <div class="u-bar-bg"><div class="u-bar-fill" style="width:${(level / upgradeMaxLevel) * 100}%"></div></div>
      <button class="u-buy-btn ${maxed ? 'maxed' : ''}" ${maxed || !canAfford ? 'disabled' : ''} data-key="${key}">
        ${maxed ? t('maxBtn') : `${t('upgradeBtn')} · 💰 ${cost}`}
      </button>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll('.u-buy-btn').forEach(btn => {
    btn.addEventListener('click', () => buyUpgrade(btn.dataset.key));
  });
}

async function buyUpgrade(key) {
  const res = await fetch('/api/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    renderProfile();
    renderMarket();
    showToast(`${upgradeDefsData[key].icon} ${L(upgradeDefsData[key], 'name')} → ${t('levelAbbrev')} ${data.newLevel}!`);
  } else {
    profile = data.profile || profile;
    renderMarket();
    if (data.reason === 'insufficient_gold') showToast(`${t('insufficientGold')}: 💰 ${data.cost}`);
    else if (data.reason === 'max_level') showToast(t('alreadyMax'));
    else showToast(t('purchaseFailed'));
  }
}

// ---------------- Prestige ----------------
async function renderPrestigeBox() {
  const res = await fetch('/api/prestige');
  const data = await res.json();
  const box = document.getElementById('prestige-box');
  box.innerHTML = `
    <div class="pr-title">${t('prestigeSystemLabel')} ${data.prestigeLevel > 0 ? `· ${t('currentPrestigeLabel')} ${data.prestigeLevel}` : ''}</div>
    <div class="pr-desc">${t('prestigeDesc')}</div>
    <div class="pr-bar-bg"><div class="pr-bar-fill" style="width:${(data.maxedCount / data.totalUpgrades) * 100}%"></div></div>
    <div class="pr-desc">${data.maxedCount} / ${data.totalUpgrades} ${t('upgradesMaxedLabel')}</div>
    <button class="pr-btn" id="prestige-btn" ${data.eligible ? '' : 'disabled'}>${data.eligible ? t('prestigeBtnReady') : t('prestigeBtnNotReady')}</button>
  `;
  document.getElementById('prestige-btn').addEventListener('click', activatePrestige);
}

async function activatePrestige() {
  const confirmed = confirm(t('confirmPrestige'));
  if (!confirmed) return;
  const res = await fetch('/api/prestige/activate', { method: 'POST' });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    renderProfile();
    renderMarket();
    await renderPrestigeBox();
    showToast(`🌟 ${t('prestigeWord')} ${data.prestigeLevel} ${t('prestigeToast')}: ${data.reward}`);
  } else {
    showToast(t('prestigeFailToast'));
  }
}

// ---------------- Daily Quests ----------------
async function fetchQuests() {
  const res = await fetch('/api/quests');
  const data = await res.json();
  questDefs = data.defs;
  questState = data.state;
}

async function openQuests() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('quests-screen').classList.remove('hidden');
  await fetchQuests();
  renderQuests();
}

function renderQuests() {
  document.getElementById('quests-gold').textContent = profile.totalGold;
  const list = document.getElementById('quest-list');
  list.innerHTML = '';
  questDefs.forEach(q => {
    const progress = Math.min(q.target, (questState.progress && questState.progress[q.key]) || 0);
    const claimed = questState.claimed && questState.claimed[q.key];
    const done = progress >= q.target;
    const pct = Math.min(100, (progress / q.target) * 100);

    const card = document.createElement('div');
    card.className = 'quest-card';
    card.innerHTML = `
      <div class="q-icon">${q.icon}</div>
      <div class="q-body">
        <div class="q-title">${L(q, 'title')}</div>
        <div class="q-bar-bg"><div class="q-bar-fill" style="width:${pct}%"></div></div>
        <div class="q-progress">${progress.toLocaleString()} / ${q.target.toLocaleString()} · ${t('rewardLabel')}: 💰 ${q.reward}</div>
      </div>
      <button class="q-claim-btn ${claimed ? 'done' : ''}" data-key="${q.key}" ${(!done || claimed) ? 'disabled' : ''}>
        ${claimed ? t('claimedBtn') : (done ? t('claimBtnShort') : t('inProgress'))}
      </button>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll('.q-claim-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => claimQuest(btn.dataset.key));
  });
}

async function claimQuest(key) {
  const res = await fetch('/api/quests/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    questState.claimed[key] = true;
    renderProfile();
    renderQuests();
    showToast(`${t('questClaimed')} +💰 ${data.reward}`);
  } else {
    showToast(t('questNotReady'));
  }
}

// ---------------- Achievements ----------------
let achievementsCache = [];

async function fetchAchievements() {
  const res = await fetch('/api/achievements');
  achievementsCache = await res.json();
}

async function openAchievements() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('achievements-screen').classList.remove('hidden');
  await fetchAchievements();
  renderAchievements();
}

function renderAchievements() {
  document.getElementById('ach-gold').textContent = profile.totalGold;
  const list = document.getElementById('achievement-list');
  list.innerHTML = '';
  achievementsCache.forEach(a => {
    const pct = Math.min(100, (a.progress / a.target) * 100);
    const card = document.createElement('div');
    card.className = 'quest-card';
    card.innerHTML = `
      <div class="q-icon">${a.icon}</div>
      <div class="q-body">
        <div class="q-title">${L(a, 'title')}</div>
        <div class="q-bar-bg"><div class="q-bar-fill" style="width:${pct}%"></div></div>
        <div class="q-progress">${a.progress.toLocaleString()} / ${a.target.toLocaleString()} · ${t('rewardLabel')}: 💰 ${a.reward}</div>
      </div>
      <button class="q-claim-btn ${a.claimed ? 'done' : ''}" data-key="${a.key}" ${(!a.unlocked || a.claimed) ? 'disabled' : ''}>
        ${a.claimed ? t('claimedBtn') : (a.unlocked ? t('claimBtnShort') : t('inProgress'))}
      </button>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll('.q-claim-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => claimAchievement(btn.dataset.key));
  });
}

async function claimAchievement(key) {
  const res = await fetch('/api/achievements/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    const a = achievementsCache.find(x => x.key === key);
    if (a) a.claimed = true;
    renderProfile();
    renderAchievements();
    showToast(`${t('achievementClaimed')} +💰 ${data.reward}`);
  } else {
    showToast(t('achievementNotReady'));
  }
}

// ---------------- Utility ----------------
function rand(a, b) { return a + Math.random() * (b - a); }
function spawnPositionAwayFromPlayer(px, py, minDist) {
  minDist = minDist || 180;
  let x, y, tries = 0;
  do {
    x = rand(40, CANVAS_W - 40);
    y = rand(40, CANVAS_H - 40);
    tries++;
  } while (dist(x, y, px, py) < minDist && tries < 15);
  return { x, y };
}
function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }
function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function weightedFoodType(luckBonus, goldBonus) {
  luckBonus = luckBonus || 0;
  goldBonus = goldBonus || 0;
  const weights = FOOD_TYPES.map(f => {
    if (f.key === 'crystal' || f.key === 'mega') return f.weight + luckBonus * 0.5;
    if (f.key === 'gold') return f.weight + goldBonus;
    return f.weight;
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < FOOD_TYPES.length; i++) {
    if (r < weights[i]) return FOOD_TYPES[i];
    r -= weights[i];
  }
  return FOOD_TYPES[0];
}
function xpNeeded(level) { return 12 + level * 5; }
function radiusForLevel(level) { return Math.min(8 + level * 0.55, 55); }
function speedForLevel(level) { return Math.min(1.1 + level * 0.006, 1.8); }

// ---------------- Snake object ----------------
function makeSnake(x, y, level, color, name, isPlayer) {
  return {
    x, y,
    angle: rand(0, Math.PI * 2),
    targetAngle: 0,
    path: [{ x, y }],
    level, xp: 0,
    length: 12 + level * 2,
    color, name, isPlayer,
    alive: true,
    wanderTimer: 0,
  };
}

function snakeRadius(s) { return radiusForLevel(s.level); }
function snakeSpeed(s) {
  const base = speedForLevel(s.level);
  if (s.isPlayer && state && state.effects) {
    return base * (state.effects.speedMult + getBuffEffects().speedBonus);
  }
  if (!s.isPlayer && state && state.difficultyPreset) {
    return base * state.difficultyPreset.speedMult;
  }
  return base;
}

function snakePoints(s) {
  // sample path at SEGMENT_SPACING intervals to get body circle centers
  const pts = [];
  let need = s.length;
  let acc = 0;
  let prev = s.path[0];
  pts.push(prev);
  for (let i = 1; i < s.path.length && pts.length < need; i++) {
    const cur = s.path[i];
    acc += dist(prev.x, prev.y, cur.x, cur.y);
    if (acc >= SEGMENT_SPACING) {
      pts.push(cur);
      acc = 0;
    }
    prev = cur;
  }
  return pts;
}

// ---------------- Game state ----------------
function startGame() {
  const nameInput = document.getElementById('player-name').value.trim();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('event-banner').classList.add('hidden');
  document.body.classList.add('in-game');

  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas(false);

  const equippedSkin = resolveEquippedSkin();
  const player = makeSnake(CANVAS_W / 2, CANVAS_H / 2, 1, equippedSkin.color, nameInput || profile.name || 'Sen', true);
  player.skinColor2 = equippedSkin.color2;
  player.skinPattern = equippedSkin.pattern;
  player.skinShape = equippedSkin.shape;

  const diffPreset = DIFFICULTY_PRESETS[selectedDifficulty] || DIFFICULTY_PRESETS.normal;
  const aiCount = Math.max(3, Math.round(AI_COUNT * diffPreset.aiCountMult));
  const ai = [];
  for (let i = 0; i < aiCount; i++) {
    const lvl = Math.max(1, Math.round(rand(1, diffPreset.aiLevelMax)));
    const pos = spawnPositionAwayFromPlayer(player.x, player.y);
    ai.push(makeSnake(pos.x, pos.y, lvl,
      `hsl(${Math.round(rand(0,360))},70%,55%)`, 'AI-' + (i + 1), false));
  }

  const effects = computeEffects(profile.upgrades);
  const arena = getCurrentArena();

  state = {
    player, ai, food: [],
    mode: selectedMode, // seconds, 0 = endless
    timeLeft: selectedMode,
    elapsed: 0,
    goldEarned: 0,
    paused: false,
    over: false,
    mouse: { x: CANVAS_W / 2, y: CANVAS_H / 2 },
    lastBossAt: 0,
    running: true,
    effects,
    shields: effects.shields,
    invulnFrames: 300, // ~5s spawn protection so you can get oriented first
    sessionFoodEaten: 0,
    sessionAIEaten: 0,
    sessionXPGained: 0,
    sessionBigKill: false,
    hitsTaken: 0,
    matchElapsedSeconds: 0,
    activeEvent: null,
    nextEventAt: rand(15, 25),
    powerups: [],
    nextPowerupAt: rand(8, 14),
    magnetBuffUntil: 0,
    speedBuffUntil: 0,
    arena,
    difficultyPreset: diffPreset,
  };

  for (let i = 0; i < MAX_FOOD; i++) spawnFood();

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });

  lastTs = null;
  startMusic();
  attemptAutoFullscreen();
  requestAnimationFrame(loop);
}

function onMouseMove(e) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width, scaleY = canvas.height / r.height;
  state.mouse.x = (e.clientX - r.left) * scaleX;
  state.mouse.y = (e.clientY - r.top) * scaleY;
}
function onTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width, scaleY = canvas.height / r.height;
  state.mouse.x = (touch.clientX - r.left) * scaleX;
  state.mouse.y = (touch.clientY - r.top) * scaleY;
}

function spawnFood() {
  const luck = state && state.effects ? state.effects.luckBonus : 0;
  const goldBonus = getEventEffects().goldBonus;
  const type = weightedFoodType(luck, goldBonus);
  state.food.push({
    x: rand(20, CANVAS_W - 20),
    y: rand(20, CANVAS_H - 20),
    type,
  });
}

// ---------------- Update ----------------
let lastTs = null;
function loop(ts) {
  if (!state || !state.running) return;
  requestAnimationFrame(loop);

  if (lastTs === null) lastTs = ts;
  const elapsedMs = ts - lastTs;
  const frameInterval = 1000 / (targetFps || 60);
  if (elapsedMs < frameInterval) return; // FPS cap: skip this tick

  const dt = Math.min(elapsedMs / 16.6667, 3);
  lastTs = ts;

  if (!state.paused && !state.over) {
    update(dt);
  }
  draw();
}

function moveSnake(s, targetAngle, dt) {
  const diff = angleDiff(s.angle, targetAngle);
  const maxTurn = 0.09 * dt * getEventEffects().turnMult;
  s.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
  const sp = snakeSpeed(s) * dt;
  s.x += Math.cos(s.angle) * sp;
  s.y += Math.sin(s.angle) * sp;

  // bounce off walls
  const r = snakeRadius(s);
  if (s.x < r) { s.x = r; s.angle = Math.PI - s.angle; }
  if (s.x > CANVAS_W - r) { s.x = CANVAS_W - r; s.angle = Math.PI - s.angle; }
  if (s.y < r) { s.y = r; s.angle = -s.angle; }
  if (s.y > CANVAS_H - r) { s.y = CANVAS_H - r; s.angle = -s.angle; }

  s.path.unshift({ x: s.x, y: s.y });
  const maxPathLen = Math.ceil((s.length * SEGMENT_SPACING) / 1.2) + 20;
  if (s.path.length > maxPathLen) s.path.length = maxPathLen;
}

function gainXP(s, amount) {
  s.xp += amount;
  let leveled = false;
  while (s.xp >= xpNeeded(s.level)) {
    s.xp -= xpNeeded(s.level);
    s.level++;
    s.length += 9;
    leveled = true;
  }
  if (leveled && state && s === state.player) {
    sfxLevelUp();
    vibrate(30);
  }
}

function update(dt) {
  // --- player ---
  const targetAngle = Math.atan2(state.mouse.y - state.player.y, state.mouse.x - state.player.x);
  moveSnake(state.player, targetAngle, dt);

  // --- AI ---
  state.ai.forEach(a => {
    if (!a.alive) return;
    a.wanderTimer -= dt;
    if (a.wanderTimer <= 0) {
      // seek nearest food sometimes, else wander
      let target = null;
      if (Math.random() < 0.5) {
        let best = null, bestD = 9999;
        for (const f of state.food) {
          const d = dist(a.x, a.y, f.x, f.y);
          if (d < 180 && d < bestD) { bestD = d; best = f; }
        }
        if (best) target = Math.atan2(best.y - a.y, best.x - a.x);
      }
      a.targetAngle = target !== null ? target : rand(0, Math.PI * 2);
      a.wanderTimer = rand(20, 60);
    }
    moveSnake(a, a.targetAngle, dt);
  });

  // --- magnet effect: pull nearby food toward player ---
  const magnetR = state.effects.magnetRadius + getBuffEffects().magnetBonus;
  if (magnetR > 30) {
    for (const f of state.food) {
      const d = dist(state.player.x, state.player.y, f.x, f.y);
      if (d < magnetR && d > 2) {
        const pull = (1 - d / magnetR) * 2.2 * dt;
        f.x += (state.player.x - f.x) / d * pull;
        f.y += (state.player.y - f.y) / d * pull;
      }
    }
  }

  // --- food collisions ---
  for (let i = state.food.length - 1; i >= 0; i--) {
    const f = state.food[i];
    if (dist(state.player.x, state.player.y, f.x, f.y) < snakeRadius(state.player) + f.type.radius) {
      const xpGain = Math.round(f.type.xp * state.effects.xpMult * getEventEffects().xpMult);
      gainXP(state.player, xpGain);
      state.goldEarned += Math.round(f.type.gold * state.effects.goldMult);
      state.sessionFoodEaten++;
      state.sessionXPGained += xpGain;
      sfxEat();
      state.food.splice(i, 1);
      continue;
    }
    for (const a of state.ai) {
      if (!a.alive) continue;
      if (dist(a.x, a.y, f.x, f.y) < snakeRadius(a) + f.type.radius) {
        gainXP(a, Math.round(f.type.xp * 0.6));
        state.food.splice(i, 1);
        break;
      }
    }
  }
  while (state.food.length < MAX_FOOD) spawnFood();

  // --- player vs AI collisions ---
  if (state.invulnFrames > 0) state.invulnFrames -= dt;
  const pr = snakeRadius(state.player);
  for (const a of state.ai) {
    if (!a.alive) continue;
    const ar = snakeRadius(a);
    const pts = snakePoints(a);
    for (const pt of pts) {
      const d = dist(state.player.x, state.player.y, pt.x, pt.y);
      if (d < pr * 0.55 + ar * 0.55) {
        if (state.player.level > a.level + 1) {
          killAI(a, state.player);
        } else if (a.level > state.player.level + 1) {
          if (!handleLethalHit()) return;
        } else {
          // close level -> both take a hit; smaller one dies
          if (state.player.level >= a.level) killAI(a, state.player);
          else if (!handleLethalHit()) return;
        }
        break;
      }
    }
  }

  // --- AI vs AI collisions (throttled for performance) ---
  state.aiCollisionTick = (state.aiCollisionTick || 0) + 1;
  if (state.aiCollisionTick % 2 === 0) {
    const aliveAI = state.ai.filter(x => x.alive);
    const pointsCache = new Map();
    aliveAI.forEach(x => pointsCache.set(x, snakePoints(x)));
    for (let i = 0; i < aliveAI.length; i++) {
      const a = aliveAI[i];
      if (!a.alive) continue;
      const ar = snakeRadius(a);
      for (let j = 0; j < aliveAI.length; j++) {
        if (i === j) continue;
        const b = aliveAI[j];
        if (!b.alive) continue;
        const br = snakeRadius(b);
        const bPoints = pointsCache.get(b);
        for (let k = 0; k < bPoints.length; k += 3) {
          const pt = bPoints[k];
          const d = dist(a.x, a.y, pt.x, pt.y);
          if (d < ar * 0.55 + br * 0.55) {
            if (a.level > b.level + 1) killAI(b, a);
            else if (b.level > a.level + 1) killAI(a, b);
            break;
          }
        }
      }
    }
  }

  // respawn dead AI as fresh ones to keep arena lively
  state.ai.forEach(a => {
    if (!a.alive) {
      const pos = spawnPositionAwayFromPlayer(state.player.x, state.player.y);
      Object.assign(a, makeSnake(pos.x, pos.y,
        Math.max(1, Math.round(rand(1, Math.max(4, state.player.level * 0.8 * state.difficultyPreset.aiCountMult)))),
        `hsl(${Math.round(rand(0,360))},70%,55%)`, a.name, false));
    }
  });

  // --- timer ---
  state.timeLeft -= dt / 60; // dt is in "60fps frames", so /60 -> seconds per frame *approx*
  state.matchElapsedSeconds += dt / 60;
  updateMapEvents();
  updatePowerups();
  updateHud();

  if (state.mode > 0 && state.timeLeft <= 0) {
    triggerBossFight();
  } else if (state.mode === 0) {
    state.lastBossAt += dt / 60;
    if (state.lastBossAt > 90) { // endless mode boss every ~90s
      state.lastBossAt = 0;
      triggerBossFight();
    }
  }
}

// Returns true if the hit was survived (shield consumed), false if the game ended
function handleLethalHit() {
  if (state.invulnFrames > 0) return true; // still invulnerable from a previous save
  if (state.shields > 0) {
    state.shields--;
    state.hitsTaken++;
    state.invulnFrames = 90; // ~1.5s of invulnerability
    sfxShield();
    vibrate(60);
    showToast(`🛡 ${t('shieldSavedYou')} (${state.shields} ${t('remainingWord')})`);
    return true;
  }
  vibrate([80, 40, 80]);
  endGame(false, null);
  return false;
}

function killAI(a, killer) {
  const isPlayer = killer === state.player;
  if (isPlayer) {
    state.sessionAIEaten++;
    sfxEatAI();
    vibrate(15);
    if (a.level >= 20) state.sessionBigKill = true;
  }
  spawnCorpse(a);
  a.alive = false;
}

function spawnCorpse(deadSnake) {
  // Doc: "Ölen yılan tamamen yemlere dönüşür; ne kadar büyükse o kadar fazla XP bırakır."
  const pts = snakePoints(deadSnake);
  const pelletCount = Math.max(4, Math.min(18, Math.round(deadSnake.length / 4)));
  const xpType = FOOD_TYPES.find(f => f.key === 'xp');
  const goldType = FOOD_TYPES.find(f => f.key === 'gold');
  const crystalType = FOOD_TYPES.find(f => f.key === 'crystal');
  for (let i = 0; i < pelletCount; i++) {
    const idx = Math.min(pts.length - 1, Math.floor((i / pelletCount) * pts.length));
    const p = pts[idx] || pts[0];
    let type = xpType;
    if (i % 5 === 0) type = goldType;
    else if (deadSnake.level >= 15 && i % 7 === 0) type = crystalType;
    state.food.push({ x: p.x + rand(-8, 8), y: p.y + rand(-8, 8), type });
  }
}

function spawnPowerup() {
  const keys = Object.keys(POWERUP_TYPES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  state.powerups.push({ x: rand(50, CANVAS_W - 50), y: rand(50, CANVAS_H - 50), type });
}

function updatePowerups() {
  if (state.powerups.length < 2 && state.matchElapsedSeconds >= state.nextPowerupAt) {
    spawnPowerup();
    state.nextPowerupAt = state.matchElapsedSeconds + rand(14, 22);
  }
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const pu = state.powerups[i];
    if (dist(state.player.x, state.player.y, pu.x, pu.y) < snakeRadius(state.player) + 16) {
      const info = POWERUP_TYPES[pu.type];
      if (pu.type === 'magnet') state.magnetBuffUntil = state.matchElapsedSeconds + info.duration;
      if (pu.type === 'speed') state.speedBuffUntil = state.matchElapsedSeconds + info.duration;
      state.powerups.splice(i, 1);
      sfxShield();
      vibrate(40);
      showToast(`${info.icon} ${L(info, 'label')} ${settings.language === 'en' ? 'active' : 'aktif'}! (${info.duration}s)`);
    }
  }
}

function drawPowerups() {
  const t = state.matchElapsedSeconds;
  state.powerups.forEach(pu => {
    const info = POWERUP_TYPES[pu.type];
    const pulse = 3 + Math.sin(t * 5 + pu.x) * 2;
    ctx.beginPath();
    ctx.fillStyle = info.color;
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 16;
    ctx.arc(pu.x, pu.y, 14 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.icon, pu.x, pu.y);
    ctx.textBaseline = 'alphabetic';
  });
}

function spawnGiantWave() {
  const mega = FOOD_TYPES.find(f => f.key === 'mega');
  const crystal = FOOD_TYPES.find(f => f.key === 'crystal');
  for (let i = 0; i < 14; i++) {
    state.food.push({
      x: rand(30, CANVAS_W - 30),
      y: rand(30, CANVAS_H - 30),
      type: Math.random() < 0.5 ? mega : crystal,
    });
  }
}

function triggerMapEvent() {
  const key = MAP_EVENT_KEYS[Math.floor(Math.random() * MAP_EVENT_KEYS.length)];
  const info = MAP_EVENTS[key];
  state.activeEvent = { type: key, endsAt: state.matchElapsedSeconds + info.duration };
  if (key === 'giantWave') spawnGiantWave();
  showEventBanner(info);
  sfxShield();
  vibrate(50);
  showToast(`${info.icon} ${L(info, 'name')}! ${L(info, 'desc')}`);
}

function endMapEvent() {
  state.activeEvent = null;
  document.getElementById('event-banner').classList.add('hidden');
}

function updateMapEvents() {
  if (state.activeEvent) {
    const info = MAP_EVENTS[state.activeEvent.type];
    const remaining = Math.max(0, Math.ceil(state.activeEvent.endsAt - state.matchElapsedSeconds));
    const banner = document.getElementById('event-banner');
    banner.style.setProperty('--event-color', info.color);
    banner.textContent = `${info.icon} ${L(info, 'name')} · ${remaining}s`;
    if (state.matchElapsedSeconds >= state.activeEvent.endsAt) endMapEvent();
  } else if (state.matchElapsedSeconds >= state.nextEventAt) {
    if (Math.random() < 0.65) triggerMapEvent();
    state.nextEventAt = state.matchElapsedSeconds + rand(20, 32);
  }
}

function showEventBanner(info) {
  const banner = document.getElementById('event-banner');
  banner.style.setProperty('--event-color', info.color);
  banner.textContent = `${info.icon} ${L(info, 'name')}`;
  banner.classList.remove('hidden');
}

// ---------------- HUD ----------------
function updateHud() {
  document.getElementById('hud-level').textContent = state.player.level;
  document.getElementById('hud-gold').textContent = (profile.totalGold + state.goldEarned);
  const need = xpNeeded(state.player.level);
  document.getElementById('xp-fill').style.width = Math.min(100, (state.player.xp / need) * 100) + '%';

  if (state.invulnFrames > 0 && !state.activeEvent) {
    const banner = document.getElementById('event-banner');
    banner.style.setProperty('--event-color', '#39ff88');
    banner.textContent = `🛡 ${t('protectedLabel')} · ${Math.ceil(state.invulnFrames / 60)}s`;
    banner.classList.remove('hidden');
  } else if (!state.activeEvent) {
    document.getElementById('event-banner').classList.add('hidden');
  }

  if (state.mode === 0) {
    document.getElementById('hud-timer').textContent = '♾ Sonsuz';
  } else {
    const t = Math.max(0, Math.ceil(state.timeLeft));
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    document.getElementById('hud-timer').textContent = `⏱ ${m}:${s}`;
  }

  const buffRow = document.getElementById('buff-row');
  const buffs = [];
  if (state.magnetBuffUntil > state.matchElapsedSeconds) {
    buffs.push(`🧲 ${Math.ceil(state.magnetBuffUntil - state.matchElapsedSeconds)}s`);
  }
  if (state.speedBuffUntil > state.matchElapsedSeconds) {
    buffs.push(`⚡ ${Math.ceil(state.speedBuffUntil - state.matchElapsedSeconds)}s`);
  }
  buffRow.innerHTML = buffs.map(b => `<span class="buff-pill">${b}</span>`).join('');
}

// ---------------- Boss fight ----------------
function triggerBossFight() {
  state.paused = true;
  const idx = profile.bossesDefeated.length % bosses.length;
  const boss = bosses[idx];
  const bossLevel = Math.round(boss.level * rand(0.9, 1.1));
  const bossPowerBonus = state.effects.bossPowerBonus;
  const effectiveLevel = state.player.level + bossPowerBonus;
  const win = effectiveLevel > bossLevel;

  const playerSkin = resolveEquippedSkin();
  const playerName = state.player.name;
  const playerSize = Math.round(Math.min(34 + state.player.level * 1.6, 150));
  const bossSize = Math.round(Math.min(34 + bossLevel * 1.6, 150));

  const overlay = document.getElementById('overlay');
  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <h2>${t('finalBossTitle')}</h2>
    <div class="boss-arena">
      <div class="ba-fighter" id="ba-player" style="--size:${playerSize}px; background:${playerSkin.color};">
        <span class="ba-level">${t('levelAbbrev')} ${state.player.level}${bossPowerBonus > 0 ? ` +${bossPowerBonus.toFixed(1)}` : ''}</span>
      </div>
      <div class="ba-vs">VS</div>
      <div class="ba-fighter" id="ba-boss" style="--size:${bossSize}px; background:${boss.color};">
        <span class="ba-level">${t('levelAbbrev')} ${bossLevel}</span>
      </div>
    </div>
    <div class="ba-names"><span>${playerName}</span><span style="color:${boss.color}">${L(boss, 'name')}</span></div>
    <div id="ba-result"></div>
  `;
  sfxBossAppear();
  vibrate([100, 60, 100]);

  setTimeout(() => {
    const winnerEl = document.getElementById(win ? 'ba-player' : 'ba-boss');
    const loserEl = document.getElementById(win ? 'ba-boss' : 'ba-player');
    winnerEl.classList.add(win ? 'ba-attack-right' : 'ba-attack-left');
    loserEl.classList.add('ba-eaten');

    if (win) { sfxBossWin(); vibrate([50, 40, 50, 40, 120]); }
    else { sfxBossLose(); vibrate([200]); }

    setTimeout(() => {
      const resultDiv = document.getElementById('ba-result');
      if (win) {
        const goldReward = Math.round((40 + bossLevel * 3) * state.effects.goldMult);
        state.goldEarned += goldReward;
        resultDiv.innerHTML = `
          <h2 class="win">${t('victoryTitle')}</h2>
          <div class="rewards">+${goldReward} ${settings.language === 'en' ? 'Gold' : 'Altın'} · ${t('newSkinLabel')}: "${L(boss, 'name')} Skin" · ${t('collectionPointLabel')}</div>
          <div class="btn-row">
            <button class="btn-primary" id="continue-btn">${t('continueBtn')}</button>
            <button class="btn-secondary" id="menu-btn">${t('backBtn')}</button>
          </div>`;
        finishEncounter(true, boss.name, boss.name + ' Skin');
      } else {
        resultDiv.innerHTML = `
          <h2 class="lose">${t('defeatTitle')}</h2>
          <div class="rewards">${t('noRewardText')}</div>
          <div class="btn-row">
            <button class="btn-primary" id="menu-btn2">${t('backBtn')}</button>
          </div>`;
        finishEncounter(false, null, null);
      }
      document.getElementById('continue-btn')?.addEventListener('click', () => {
        overlay.classList.add('hidden');
        state.paused = false;
        state.over = false;
        lastTs = null;
        if (state.mode > 0) state.timeLeft = 45; // bonus round after winning
      });
      document.getElementById('menu-btn')?.addEventListener('click', backToMenu);
      document.getElementById('menu-btn2')?.addEventListener('click', backToMenu);
    }, 750);
  }, 1600);
}

function finishEncounter(bossWin, bossDefeatedName, skinUnlocked) {
  state.over = true;
  postGameResult({
    name: null,
    goldEarned: state.goldEarned,
    level: state.player.level,
    length: state.player.length,
    result: bossWin ? 'win' : 'loss',
    bossResult: bossWin ? 'win' : 'loss',
    bossDefeated: bossDefeatedName,
    skinUnlocked: skinUnlocked,
    playSeconds: Math.round(state.mode > 0 ? state.mode : 90),
    foodEaten: state.sessionFoodEaten,
    aiEaten: state.sessionAIEaten,
    xpGained: state.sessionXPGained,
    bigKill: state.sessionBigKill,
    flawlessBossWin: bossWin && state.hitsTaken === 0,
  });
}

function endGame(won, boss) {
  state.paused = true;
  state.over = true;
  const overlay = document.getElementById('overlay');
  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <h2 class="lose">${t('defeatTitle')}</h2>
    <div class="rewards">${t('eatenByBigger')}: ${state.player.level}</div>
    <div class="btn-row">
      <button class="btn-primary" id="menu-btn3">${t('backBtn')}</button>
    </div>`;
  document.getElementById('menu-btn3').addEventListener('click', backToMenu);
  postGameResult({
    name: null,
    goldEarned: state.goldEarned,
    level: state.player.level,
    length: state.player.length,
    result: 'loss',
    playSeconds: 30,
    foodEaten: state.sessionFoodEaten,
    aiEaten: state.sessionAIEaten,
    xpGained: state.sessionXPGained,
    bigKill: state.sessionBigKill,
  });
}

function quitToMenu() {
  if (state && !state.over) {
    const confirmed = confirm(t('confirmQuit'));
    if (!confirmed) return;
  }
  backToMenu();
}

function backToMenu() {
  state.running = false;
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('menu-screen').classList.remove('hidden');
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('event-banner').classList.add('hidden');
  document.body.classList.remove('in-game');
  if (document.fullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
  }
  lastTs = null;
  stopMusic();
}

// ---------------- Draw ----------------
function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // arena background (theme depends on selected arena)
  const arena = state.arena || getCurrentArena();
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bgGrad.addColorStop(0, arena.bg1);
  bgGrad.addColorStop(1, arena.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // grid background
  ctx.strokeStyle = arena.grid || 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  // food
  state.food.forEach(f => {
    ctx.beginPath();
    ctx.fillStyle = f.type.color;
    if (glowEnabled) { ctx.shadowColor = f.type.color; ctx.shadowBlur = 8; }
    ctx.arc(f.x, f.y, f.type.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  drawPowerups();
  ctx.shadowBlur = 0;

  // AI snakes
  state.ai.forEach(a => { if (a.alive) drawSnake(a); });

  // player on top
  drawSnake(state.player);
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function drawShapeAt(x, y, r, shape) {
  ctx.beginPath();
  if (shape === 'kare') {
    const s = r * 1.6;
    ctx.rect(x - s / 2, y - s / 2, s, s);
  } else if (shape === 'elmas') {
    ctx.moveTo(x, y - r * 1.25);
    ctx.lineTo(x + r * 1.25, y);
    ctx.lineTo(x, y + r * 1.25);
    ctx.lineTo(x - r * 1.25, y);
    ctx.closePath();
  } else if (shape === 'altigen') {
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + r * 1.1 * Math.cos(ang);
      const py = y + r * 1.1 * Math.sin(ang);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'yildiz') {
    const spikes = 5, outerR = r * 1.35, innerR = r * 0.65;
    for (let i = 0; i < spikes * 2; i++) {
      const ang = (Math.PI / spikes) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? outerR : innerR;
      const px = x + rad * Math.cos(ang);
      const py = y + rad * Math.sin(ang);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
}

function drawSnake(s) {
  const pts = snakePoints(s);
  const r = snakeRadius(s);
  const pattern = s.skinPattern || 'solid';
  const shape = s.skinShape || 'daire';
  const c1 = s.color;
  const c2 = s.skinColor2 || s.color;

  if (s.isPlayer && state.invulnFrames > 0) {
    const headP0 = pts[0] || { x: s.x, y: s.y };
    const pulse = 4 + Math.sin(state.matchElapsedSeconds * 6) * 2;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(57,255,136,0.8)';
    ctx.lineWidth = 2;
    ctx.arc(headP0.x, headP0.y, r + 8 + pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    const t = pts.length > 1 ? i / (pts.length - 1) : 0;
    let fill = c1;
    if (pattern === 'gradient') fill = lerpColor(c1, c2, t);
    else if (pattern === 'striped') fill = (i % 2 === 0) ? c1 : c2;
    else if (pattern === 'scales') fill = (i % 3 === 0) ? c2 : c1;
    else if (pattern === 'rainbow') fill = `hsl(${Math.round((i * 16 + state.matchElapsedSeconds * 70) % 360)}, 85%, 60%)`;
    else if (pattern === 'sparkle') fill = c1;
    else if (pattern === 'glow') fill = c1;

    ctx.fillStyle = fill;
    ctx.globalAlpha = i === 0 ? 1 : 0.85;
    if (pattern === 'glow') { ctx.shadowColor = c2; ctx.shadowBlur = 16; }
    drawShapeAt(p.x, p.y, i === 0 ? r : r * 0.9, shape);
    ctx.fill();
    if (pattern === 'glow') ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  if (pattern === 'sparkle' && Math.random() < 0.35 && pts.length > 1) {
    const p = pts[Math.floor(Math.random() * pts.length)];
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.arc(p.x + rand(-4, 4), p.y + rand(-4, 4), 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // eyes on head
  const headP = pts[0] || { x: s.x, y: s.y };
  ctx.fillStyle = '#06121a';
  ctx.beginPath();
  ctx.arc(headP.x + Math.cos(s.angle - 0.5) * r * 0.5, headP.y + Math.sin(s.angle - 0.5) * r * 0.5, r * 0.18, 0, Math.PI * 2);
  ctx.arc(headP.x + Math.cos(s.angle + 0.5) * r * 0.5, headP.y + Math.sin(s.angle + 0.5) * r * 0.5, r * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // name/level tag
  const tagText = `${s.name} · Lv${s.level}`;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  const tagW = ctx.measureText(tagText).width;
  const tagY = headP.y - r - 12;
  ctx.fillStyle = 'rgba(4,7,15,0.65)';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(headP.x - tagW / 2 - 8, tagY - 15, tagW + 16, 21, 10) : ctx.rect(headP.x - tagW / 2 - 8, tagY - 15, tagW + 16, 21);
  ctx.fill();
  ctx.fillStyle = s.isPlayer ? '#ffffff' : 'rgba(255,255,255,0.9)';
  ctx.fillText(tagText, headP.x, tagY);
}

// ---------------- Statistics ----------------
function formatDuration(totalSeconds) {
  totalSeconds = Math.round(totalSeconds || 0);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const hu = settings.language === 'en' ? 'h' : 'sa', mu = settings.language === 'en' ? 'm' : 'dk', su = settings.language === 'en' ? 's' : 'sn';
  if (h > 0) return `${h}${hu} ${m}${mu}`;
  if (m > 0) return `${m}${mu} ${s}${su}`;
  return `${s}${su}`;
}

function openStats() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('stats-screen').classList.remove('hidden');
  renderStats();
}

function renderStats() {
  const s = profile.stats;
  const cards = [
    { icon: '🎮', value: s.games, label: t('statTotalGames') },
    { icon: '🏆', value: s.wins, label: t('statWins') },
    { icon: '💀', value: s.losses, label: t('statLosses') },
    { icon: '👑', value: s.bossWins, label: t('statBossWins') },
    { icon: '📈', value: profile.bestLevel, label: t('statBestLevel') },
    { icon: '📏', value: profile.longestSnake, label: t('statLongestSnake') },
    { icon: '🐍', value: s.totalAIEaten, label: t('statAIEaten') },
    { icon: '🍎', value: s.totalFoodEaten.toLocaleString(), label: t('statFoodEaten') },
    { icon: '💰', value: s.totalGoldEarned.toLocaleString(), label: t('statGoldEarned') },
    { icon: '⏱', value: formatDuration(s.longestGameSeconds), label: t('statLongestGame') },
    { icon: '⏳', value: formatDuration(s.totalPlaySeconds), label: t('statTotalTime') },
    { icon: '🥷', value: s.flawlessBossWins, label: t('statFlawlessBoss') },
  ];
  const grid = document.getElementById('stat-grid');
  grid.innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="s-icon">${c.icon}</div>
      <div class="s-value">${c.value}</div>
      <div class="s-label">${c.label}</div>
    </div>
  `).join('');
}

// ---------------- Daily Login ----------------
let dailyLoginState = null;

async function fetchDailyLogin() {
  const res = await fetch('/api/daily-login');
  dailyLoginState = await res.json();
  const dot = document.getElementById('daily-dot');
  dot.classList.toggle('hidden', dailyLoginState.claimedToday);
}

async function openDailyLogin() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('daily-screen').classList.remove('hidden');
  await fetchDailyLogin();
  renderDailyLogin();
}

function renderDailyLogin() {
  const d = dailyLoginState;
  document.getElementById('daily-streak-badge').textContent = `🔥 ${d.streak} ${t('dayWord')}`;
  const grid = document.getElementById('daily-grid');
  grid.innerHTML = d.rewards.map(r => {
    let cls = 'day-card';
    let icon = r.type === 'chest' ? '🎁' : '💰';
    if (r.day === d.nextDayIndex) cls += ' today' + (d.claimedToday ? ' done' : '');
    else if (r.day < d.nextDayIndex) cls += ' done';
    if (r.type === 'chest') cls += ' chest';
    return `
      <div class="${cls}">
        <div class="d-num">${t('dayLabel')} ${r.day}</div>
        <div class="d-icon">${r.day === d.nextDayIndex && d.claimedToday ? '✔' : icon}</div>
        <div>${r.type === 'chest' ? r.amount : r.amount}</div>
      </div>
    `;
  }).join('');

  const btn = document.getElementById('daily-claim-btn');
  if (d.claimedToday) {
    btn.textContent = t('alreadyClaimedToday');
    btn.disabled = true;
  } else {
    const next = d.rewards[d.nextDayIndex - 1];
    btn.textContent = `${t('claimBtn')} · ${L(next, 'label')}`;
    btn.disabled = false;
  }
}

async function claimDailyLoginReward() {
  const res = await fetch('/api/daily-login/claim', { method: 'POST' });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    dailyLoginState.claimedToday = true;
    dailyLoginState.streak = data.streak;
    renderProfile();
    renderDailyLogin();
    document.getElementById('daily-dot').classList.add('hidden');
    showToast(`🎁 ${L(data.reward, 'label')} ${t('wonSuffix')}`);
  } else {
    showToast(t('dailyAlreadyClaimed'));
  }
}

// ---------------- Boss Fragment Collection ----------------
async function openBossCollection() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('bosses-screen').classList.remove('hidden');
  const res = await fetch('/api/boss-fragments');
  const data = await res.json();
  renderBossCollection(data);
}

function renderBossCollection(bossFrags) {
  const grid = document.getElementById('boss-frag-grid');
  grid.innerHTML = bossFrags.map(b => {
    if (!b.skinUnlocked) {
      return `
        <div class="boss-frag-card locked">
          <div class="bf-top"><div class="bf-dot" style="background:${b.color}; color:${b.color};"></div><div class="bf-name">${L(b, 'name')}</div></div>
          <div class="bf-status">${t('lockedLabel')}</div>
          <div class="bf-progress">${t('defeatFirstLabel').replace('🔒 ', '')}</div>
        </div>`;
    }
    if (b.legendary) {
      return `
        <div class="boss-frag-card">
          <div class="bf-top"><div class="bf-dot" style="background:${b.color}; color:${b.color};"></div><div class="bf-name">${L(b, 'name')}</div></div>
          <div class="bf-status legendary">${t('legendaryLabel')}</div>
          <div class="bf-progress">${settings.language === 'en' ? 'Skin fully unlocked' : 'Skin tamamen açıldı'}</div>
        </div>`;
    }
    const pct = Math.min(100, (b.fragments / b.target) * 100);
    return `
      <div class="boss-frag-card">
        <div class="bf-top"><div class="bf-dot" style="background:${b.color}; color:${b.color};"></div><div class="bf-name">${L(b, 'name')}</div></div>
        <div class="bf-status unlocked">${t('skinUnlockedLabel')}</div>
        <div class="u-bar-bg"><div class="u-bar-fill" style="width:${pct}%"></div></div>
        <div class="bf-progress">🧩 ${b.fragments} / ${b.target}</div>
      </div>`;
  }).join('');
}

// ---------------- Settings ----------------
function setupSettingsControls() {
  document.getElementById('set-sound').addEventListener('change', e => updateSetting('sound', e.target.checked));
  document.getElementById('set-music').addEventListener('change', e => updateSetting('music', e.target.checked));
  document.getElementById('set-music-track').addEventListener('change', e => updateSetting('musicTrack', e.target.value));
  document.getElementById('set-graphics').addEventListener('change', e => updateSetting('graphics', e.target.value));
  document.getElementById('set-fps').addEventListener('change', e => updateSetting('fps', parseInt(e.target.value, 10)));
  document.getElementById('set-vibration').addEventListener('change', e => updateSetting('vibration', e.target.checked));
  document.getElementById('set-notifications').addEventListener('change', e => onNotificationsToggle(e.target.checked));
  document.getElementById('set-language').addEventListener('change', e => updateSetting('language', e.target.value));
}

function openSettings() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
  renderSettings();
}

function renderSettings() {
  document.getElementById('set-sound').checked = !!settings.sound;
  document.getElementById('set-music').checked = !!settings.music;
  document.getElementById('set-music-track').value = settings.musicTrack || 'yumusak';
  document.getElementById('set-graphics').value = settings.graphics;
  document.getElementById('set-fps').value = String(settings.fps);
  document.getElementById('set-vibration').checked = !!settings.vibration;
  document.getElementById('set-notifications').checked = !!settings.notifications;
  document.getElementById('set-language').value = settings.language || 'tr';
}

async function updateSetting(key, value) {
  settings[key] = value;
  if (key === 'graphics') applyGraphicsPreset(value);
  if (key === 'fps') targetFps = value;
  if (key === 'music') { value ? startMusic() : stopMusic(); }
  if (key === 'musicTrack') restartMusicIfPlaying();
  if (key === 'language') {
    applyLanguage();
    renderProfile();
  }
  await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value })
  });
  showToast(t('settingSaved'));
}

async function onNotificationsToggle(checked) {
  if (checked && 'Notification' in window) {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      checked = false;
      document.getElementById('set-notifications').checked = false;
      showToast(t('notifPermDenied'));
    }
  }
  updateSetting('notifications', checked);
}

function maybeNotifyDailyReward() {
  if (!settings.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification('🎁 Günlük Ödülün Hazır!', { body: 'Snake Evolution: Rise of the Bosses' });
  } catch (e) { /* ignore */ }
}

function showMedalReveal(medal) {
  const card = document.createElement('div');
  card.className = 'medal-reveal-card';
  card.innerHTML = `
    <div class="mc-icon">${medal.icon}</div>
    <div>
      <div class="mc-name">${L(medal, 'name')} ${t('medalWord')}</div>
      <div class="mc-sub">${t('matchScoreLabel')}: ${medal.score}</div>
    </div>
  `;
  document.body.appendChild(card);
  setTimeout(() => {
    card.style.transition = 'opacity 0.4s, transform 0.4s';
    card.style.opacity = '0';
    card.style.transform = 'translateX(120%)';
    setTimeout(() => card.remove(), 400);
  }, 3200);
}

function computeTargetCanvasSize() {
  if (document.fullscreenElement) {
    return { w: window.innerWidth, h: window.innerHeight };
  }
  const w = Math.round(window.innerWidth * 0.97);
  const h = Math.round(Math.max(420, window.innerHeight - 150));
  return { w, h };
}

function resizeCanvas(rescaleEntities) {
  if (!canvas) return;
  const { w, h } = computeTargetCanvasSize();
  const oldW = CANVAS_W, oldH = CANVAS_H;
  CANVAS_W = w;
  CANVAS_H = h;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  if (rescaleEntities && state) {
    const fx = w / oldW, fy = h / oldH;
    const rescale = s => {
      s.x *= fx; s.y *= fy;
      s.path = [{ x: s.x, y: s.y }]; // reset trail to avoid stretched visuals
    };
    rescale(state.player);
    state.ai.forEach(rescale);
    state.food.forEach(f => { f.x *= fx; f.y *= fy; });
  }
}

function attemptAutoFullscreen() {
  const wrap = document.getElementById('game-wrap');
  try {
    const p = (wrap.requestFullscreen || wrap.webkitRequestFullscreen)?.call(wrap);
    if (p && p.catch) p.catch(() => { /* browser blocked auto-fullscreen, manual button still works */ });
  } catch (e) { /* ignore */ }
}

function toggleFullscreen() {
  const wrap = document.getElementById('game-wrap');
  if (!document.fullscreenElement) {
    (wrap.requestFullscreen || wrap.webkitRequestFullscreen)?.call(wrap);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
  }
}

// ---------------- Leaderboard ----------------
async function openLeaderboard() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('leaderboard-screen').classList.remove('hidden');
  await fetchAndRenderLeaderboard();
}

async function fetchAndRenderLeaderboard() {
  const res = await fetch('/api/leaderboard');
  const entries = await res.json();
  renderLeaderboard(entries);
}

function renderLeaderboard(entries) {
  const list = document.getElementById('leaderboard-list');
  if (entries.length === 0) {
    list.innerHTML = `<div class="lb-empty">${t('emptyLeaderboard')}</div>`;
    return;
  }
  list.innerHTML = entries.map((e, i) => `
    <div class="lb-row">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-name">${e.name}<div class="lb-meta">${t('levelAbbrev')} ${e.level} · ${e.mode || '-'} · ${e.date}</div></div>
      <div class="lb-score">${e.score}</div>
      <button class="lb-del" data-id="${e.id}">🗑</button>
    </div>
  `).join('');
  list.querySelectorAll('.lb-del').forEach(btn => {
    btn.addEventListener('click', () => deleteLeaderboardEntry(btn.dataset.id));
  });
}

async function deleteLeaderboardEntry(id) {
  const res = await fetch(`/api/leaderboard/${id}`, { method: 'DELETE' });
  const entries = await res.json();
  renderLeaderboard(entries);
}

async function clearLeaderboard() {
  const confirmed = confirm(t('confirmClearLeaderboard'));
  if (!confirmed) return;
  const res = await fetch('/api/leaderboard/clear', { method: 'POST' });
  const entries = await res.json();
  renderLeaderboard(entries);
  showToast(t('leaderboardCleared'));
}

function modeLabel(mode) {
  if (mode === 0) return t('modeEndless');
  const map = { 60: t('mode1'), 120: t('mode2'), 180: t('mode3'), 300: t('mode5') };
  return map[mode] || `${mode}s`;
}

function showScoreSaveCard(score, level) {
  const card = document.createElement('div');
  card.className = 'score-save-card';
  card.innerHTML = `
    <div class="ss-title">${t('saveScoreTitle')} · ${score} ${t('pointsWord')}</div>
    <input type="text" id="ss-name-input" maxlength="20" placeholder="${t('namePlaceholder')}" value="${(profile.name && profile.name !== 'Oyuncu') ? profile.name : ''}">
    <div class="ss-btn-row">
      <button class="ss-save" id="ss-save-btn">${t('saveBtn')}</button>
      <button class="ss-skip" id="ss-skip-btn">${t('skipBtn')}</button>
    </div>
  `;
  document.body.appendChild(card);
  const remove = () => card.remove();
  document.getElementById('ss-skip-btn').addEventListener('click', remove);
  document.getElementById('ss-save-btn').addEventListener('click', async () => {
    const name = document.getElementById('ss-name-input').value.trim() || 'Oyuncu';
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, level, mode: modeLabel(state ? state.mode : 0) })
    });
    showToast(t('scoreSavedToast'));
    remove();
  });
}

// ---------------- Boss Chests ----------------
let chestState = null;

async function fetchChests() {
  const res = await fetch('/api/chests');
  chestState = await res.json();
  const dot = document.getElementById('chest-dot');
  dot.classList.toggle('hidden', chestState.inventory.length === 0);
}

async function openChests() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('chests-screen').classList.remove('hidden');
  await fetchChests();
  renderChests();
}

function renderChests() {
  const grid = document.getElementById('chest-grid');
  if (chestState.inventory.length === 0) {
    grid.innerHTML = `<div class="chest-empty">${t('chestEmptyLabel')}</div>`;
  } else {
    // group by tier for a clean stacked view
    const groups = {};
    chestState.inventory.forEach(c => {
      groups[c.tier] = groups[c.tier] || [];
      groups[c.tier].push(c);
    });
    grid.innerHTML = chestState.tiers
      .filter(tier => groups[tier.key])
      .map(tier => {
        const items = groups[tier.key];
        return `
          <div class="chest-card" data-tier="${tier.key}">
            ${items.length > 1 ? `<div class="c-count">x${items.length}</div>` : ''}
            <div class="c-icon">${tier.icon}</div>
            <div class="c-name">${L(tier, 'name')}</div>
            <button class="c-open-btn" data-id="${items[0].id}">${t('openBtn')}</button>
          </div>`;
      }).join('');
  }
  grid.querySelectorAll('.c-open-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openSingleChest(btn.dataset.id); });
  });

  const cosList = document.getElementById('cosmetics-list');
  if (chestState.cosmeticsUnlocked.length === 0) {
    cosList.innerHTML = `<div class="boss-chip">${t('noCosmeticsLabel')}</div>`;
  } else {
    cosList.innerHTML = chestState.cosmeticsUnlocked.map(c => `<div class="boss-chip done">${c}</div>`).join('');
  }
}

function showChestReward(reward) {
  const overlay = document.createElement('div');
  overlay.className = 'chest-reward-overlay';
  const lines = [];
  lines.push(`<div class="cr-item gold">💰 +${reward.gold} ${settings.language === 'en' ? 'Gold' : 'Altın'}</div>`);
  if (reward.fragment) {
    lines.push(`<div class="cr-item frag">🧩 +${reward.fragment.amount} ${L(reward.fragment, 'boss')} ${t('fragmentSuffix')}${reward.fragment.legendaryUnlocked ? ' · ' + t('legendaryUnlockedText') : ''}</div>`);
  }
  if (reward.cosmetic) {
    lines.push(`<div class="cr-item cosmetic">✨ ${reward.cosmetic}</div>`);
  }
  overlay.innerHTML = `
    <div class="cr-icon">${reward.icon}</div>
    <div class="cr-tier">${L(reward, 'tierName')}</div>
    ${lines.join('')}
    <button class="btn-primary" id="chest-reward-close" style="margin-top:20px; width:200px;">${t('greatBtn')}</button>
  `;
  document.body.appendChild(overlay);
  sfxLevelUp();
  vibrate(40);
  document.getElementById('chest-reward-close').addEventListener('click', () => overlay.remove());
}

async function openSingleChest(id) {
  const res = await fetch('/api/chests/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    renderProfile();
    await fetchChests();
    renderChests();
    showChestReward(data.reward);
  } else {
    showToast(t('chestOpenFailed'));
  }
}

async function openAllChests() {
  if (!chestState || chestState.inventory.length === 0) {
    showToast(t('noChestsToOpen'));
    return;
  }
  const res = await fetch('/api/chests/open-all', { method: 'POST' });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    renderProfile();
    await fetchChests();
    renderChests();
    const s = data.summary;
    showToast(`🎰 ${s.count} ${t('chestsOpenedSuffix')} +💰 ${s.totalGold}${s.cosmetics.length ? `, ${s.cosmetics.length} ${t('newCosmeticSuffix')}` : ''}`);
    vibrate([40, 30, 40, 30, 80]);
  } else {
    showToast(t('noChestsToOpen'));
  }
}

// ---------------- Skins ----------------
async function openSkins() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('skins-screen').classList.remove('hidden');
  await fetchSkins();
  renderSkins();
}

function renderSkins() {
  document.getElementById('skins-gold').textContent = `💰 ${profile.totalGold}`;
  const equipped = skinsCache.equippedSkin;

  const catalogGrid = document.getElementById('skin-catalog-grid');
  const defaultCard = `
    <div class="skin-card ${equipped === 'default' ? 'equipped' : ''}">
      <div class="sk-swatch" style="background:#39ff88;"></div>
      <div class="sk-name">${t('defaultSkinName')}</div>
      <button class="sk-btn ${equipped === 'default' ? 'equipped' : 'equip'}" data-key="default" ${equipped === 'default' ? 'disabled' : ''}>
        ${equipped === 'default' ? t('selectedBtn') : t('selectBtn')}
      </button>
    </div>`;
  const catalogCards = skinsCache.catalog.map(s => {
    const owned = skinsCache.purchasedSkins.includes(s.key);
    const isEquipped = equipped === s.key;
    let btn;
    if (isEquipped) btn = `<button class="sk-btn equipped" disabled>${t('selectedBtn')}</button>`;
    else if (owned) btn = `<button class="sk-btn equip" data-key="${s.key}">${t('selectBtn')}</button>`;
    else btn = `<button class="sk-btn buy" data-buy="${s.key}">${t('buyBtn')} · 💰${s.price}</button>`;
    return `
      <div class="skin-card ${isEquipped ? 'equipped' : ''}">
        <div class="sk-swatch" style="${skinSwatchCss(s)}"></div>
        <div class="sk-name">${L(s, 'name')}<br><span style="opacity:0.6;">${patternLabel(s.pattern)}${s.shape && s.shape !== 'daire' ? ' · ' + shapeLabel(s.shape) : ''}</span></div>
        ${btn}
      </div>`;
  }).join('');
  catalogGrid.innerHTML = defaultCard + catalogCards;

  const bossGrid = document.getElementById('skin-boss-grid');
  bossGrid.innerHTML = skinsCache.bossSkins.map(b => {
    const isEquipped = equipped === b.key;
    let btn;
    if (!b.owned) btn = `<button class="sk-btn locked" disabled>${t('defeatFirstLabel')}</button>`;
    else if (isEquipped) btn = `<button class="sk-btn equipped" disabled>${t('selectedBtn')}</button>`;
    else btn = `<button class="sk-btn equip" data-key="${b.key}">${t('selectBtn')}</button>`;
    return `
      <div class="skin-card ${isEquipped ? 'equipped' : ''}">
        <div class="sk-swatch" style="${skinSwatchCss(b)}"></div>
        <div class="sk-name">${L(b, 'name')}${b.legendary ? ' 🌟' : ''}</div>
        ${btn}
      </div>`;
  }).join('');

  document.querySelectorAll('#skins-screen .sk-btn[data-key]').forEach(btn => {
    btn.addEventListener('click', () => equipSkin(btn.dataset.key));
  });
  document.querySelectorAll('#skins-screen .sk-btn[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => buySkin(btn.dataset.buy));
  });
}

async function buySkin(key) {
  const res = await fetch('/api/skins/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    renderProfile();
    await fetchSkins();
    renderSkins();
    showToast(t('skinPurchased'));
  } else if (data.reason === 'insufficient_gold') {
    showToast(`Yetersiz altın! Gerekli: 💰 ${data.cost}`);
  } else {
    showToast('Satın alma başarısız.');
  }
}

async function equipSkin(key) {
  const res = await fetch('/api/skins/equip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const data = await res.json();
  if (data.success) {
    profile = data.profile;
    await fetchSkins();
    renderSkins();
    showToast(t('skinEquipped'));
  } else {
    showToast(t('skinNotOwned'));
  }
}

// ---------------- Arenas ----------------
let arenasCache = null;

async function fetchArenas() {
  const res = await fetch('/api/arenas');
  arenasCache = await res.json();
  const nameEl = document.getElementById('p-arena-name');
  if (nameEl) {
    const cur = arenasCache.arenas.find(a => a.key === arenasCache.selected);
    nameEl.textContent = cur ? `${cur.icon} ${L(cur, 'name')}` : 'Çayır';
  }
}

function getCurrentArena() {
  const fallback = { bg1: '#050a14', bg2: '#050a14', grid: 'rgba(255,255,255,0.03)' };
  if (!arenasCache) return fallback;
  const found = arenasCache.arenas.find(a => a.key === arenasCache.selected);
  return found || fallback;
}

async function openArenas() {
  hideAllSubScreens();
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('arenas-screen').classList.remove('hidden');
  await fetchArenas();
  renderArenas();
}

function renderArenas() {
  const grid = document.getElementById('arena-grid');
  grid.innerHTML = arenasCache.arenas.map(a => {
    const isSelected = arenasCache.selected === a.key;
    let btn;
    if (!a.unlocked) btn = `<button class="ar-btn locked" disabled>🔒 ${t('levelAbbrev')} ${a.unlockLevel}</button>`;
    else if (isSelected) btn = `<button class="ar-btn selected" disabled>${t('selectedBtn')}</button>`;
    else btn = `<button class="ar-btn select" data-key="${a.key}">${t('selectBtn')}</button>`;
    return `
      <div class="arena-card ${!a.unlocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}"
           style="background: linear-gradient(160deg, ${a.bg1}, ${a.bg2});">
        <div class="ar-icon">${a.icon}</div>
        <div class="ar-name">${L(a, 'name')}</div>
        ${btn}
      </div>`;
  }).join('');
  grid.querySelectorAll('.ar-btn.select').forEach(btn => {
    btn.addEventListener('click', () => selectArena(btn.dataset.key));
  });
}

async function selectArena(key) {
  const res = await fetch('/api/arena/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const data = await res.json();
  if (data.success) {
    await fetchArenas();
    renderArenas();
    showToast(t('arenaChanged'));
  } else {
    showToast(t('arenaLocked'));
  }
}

// ---------------- Init ----------------
async function init() {
  setupMenu();
  await fetchBosses();
  await fetchUpgradeDefs();
  await fetchProfile();
  await fetchSkins();
  await fetchArenas();
  await fetchDailyLogin();
  if (!dailyLoginState.claimedToday) {
    showToast(t('dailyRewardReady'));
    maybeNotifyDailyReward();
  }
  await fetchChests();
}
init();
