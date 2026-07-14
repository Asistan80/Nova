from flask import Blueprint, jsonify, request, render_template, session
import json
import os
import random
import uuid

bp = Blueprint(
    'rise_of_the_bosses',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/games/rise-of-the-bosses/static',
)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
PLAYERS_DIR = os.path.join(DATA_DIR, 'players')
LEADERBOARD_FILE = os.path.join(DATA_DIR, 'leaderboard.json')
os.makedirs(PLAYERS_DIR, exist_ok=True)


def _visitor_profile_path():
    """Her ziyaretçiye kendi kaydını veren, çerez tabanlı benzersiz kimlik."""
    vid = session.get('rob_visitor_id')
    if not vid:
        vid = uuid.uuid4().hex
        session['rob_visitor_id'] = vid
        session.permanent = True
    return os.path.join(PLAYERS_DIR, f"{vid}.json")

BOSSES = [
    {"name": "Yesil Engerek", "nameEn": "Green Viper",    "color": "#4caf50", "level": 8},
    {"name": "Kum Kobrasi",   "nameEn": "Sand Cobra",     "color": "#d2b48c", "level": 12},
    {"name": "Buz Pitonu",    "nameEn": "Ice Python",     "color": "#66d9ef", "level": 16},
    {"name": "Lav Engeregi",  "nameEn": "Lava Viper",     "color": "#ff5722", "level": 20},
    {"name": "Cyber Snake",   "nameEn": "Cyber Snake",    "color": "#00e5ff", "level": 25},
    {"name": "Titan Snake",   "nameEn": "Titan Snake",    "color": "#9e9e9e", "level": 30},
    {"name": "Galaxy Snake",  "nameEn": "Galaxy Snake",   "color": "#7c4dff", "level": 36},
    {"name": "Shadow Snake",  "nameEn": "Shadow Snake",   "color": "#424242", "level": 42},
    {"name": "Phantom Snake", "nameEn": "Phantom Snake",  "color": "#b0bec5", "level": 50},
    {"name": "Dragon Snake",  "nameEn": "Dragon Snake",   "color": "#e53935", "level": 58},
    {"name": "Crystal Snake", "nameEn": "Crystal Snake",  "color": "#40c4ff", "level": 67},
    {"name": "Toxic Snake",   "nameEn": "Toxic Snake",    "color": "#76ff03", "level": 77},
    {"name": "Inferno Snake", "nameEn": "Inferno Snake",  "color": "#ff6d00", "level": 88},
    {"name": "Mythic Snake",  "nameEn": "Mythic Snake",   "color": "#ffd700", "level": 100},
    {"name": "Eternal Snake", "nameEn": "Eternal Snake",  "color": "#ffffff", "level": 115},
]

ARENAS = [
    {"key": "cayir",    "name": "Çayır",           "nameEn": "Meadow",       "icon": "🌿", "unlockLevel": 1,   "bg1": "#0a1f0f", "bg2": "#142e1a", "grid": "rgba(140,255,140,0.05)"},
    {"key": "orman",    "name": "Orman",           "nameEn": "Forest",       "icon": "🌲", "unlockLevel": 10,  "bg1": "#08160a", "bg2": "#122a16", "grid": "rgba(100,220,120,0.05)"},
    {"key": "col",      "name": "Çöl",             "nameEn": "Desert",       "icon": "🏜", "unlockLevel": 20,  "bg1": "#2e2410", "bg2": "#3d3018", "grid": "rgba(255,220,140,0.06)"},
    {"key": "volkan",   "name": "Volkan",          "nameEn": "Volcano",      "icon": "🌋", "unlockLevel": 30,  "bg1": "#2e0a05", "bg2": "#1a0503", "grid": "rgba(255,120,80,0.08)"},
    {"key": "buz",      "name": "Buz",             "nameEn": "Ice",          "icon": "❄",  "unlockLevel": 40,  "bg1": "#0a1a2e", "bg2": "#142e3d", "grid": "rgba(140,220,255,0.07)"},
    {"key": "cyber",    "name": "Cyber City",      "nameEn": "Cyber City",   "icon": "⚡", "unlockLevel": 55,  "bg1": "#0a0a2e", "bg2": "#1a0a3d", "grid": "rgba(0,229,255,0.08)"},
    {"key": "lab",      "name": "Laboratuvar",     "nameEn": "Laboratory",   "icon": "☢",  "unlockLevel": 70,  "bg1": "#0a2e1a", "bg2": "#1a3d2a", "grid": "rgba(150,255,120,0.07)"},
    {"key": "uzay",     "name": "Uzay",            "nameEn": "Space",        "icon": "🌌", "unlockLevel": 90,  "bg1": "#05050f", "bg2": "#0a0a2e", "grid": "rgba(180,180,255,0.06)"},
    {"key": "cennet",   "name": "Cennet Arenası",  "nameEn": "Heaven Arena", "icon": "👑", "unlockLevel": 120, "bg1": "#2e2a0a", "bg2": "#3d3818", "grid": "rgba(255,235,150,0.08)"},
    {"key": "karanlik", "name": "Karanlık Diyar",  "nameEn": "Dark Realm",   "icon": "💀", "unlockLevel": 150, "bg1": "#0a0505", "bg2": "#1a0a0a", "grid": "rgba(255,80,80,0.06)"},
]
ARENA_BY_KEY = {a["key"]: a for a in ARENAS}


BOSS_FRAGMENT_TARGET = 100
BOSS_FRAGMENT_REWARD = 10  # fragments granted for each REPEAT win against a boss

UPGRADE_DEFS = {
    "hiz":          {"name": "Hız",          "nameEn": "Speed",       "icon": "⚡", "desc": "Hareket hızını artırır", "descEn": "Increases movement speed"},
    "miknatis":     {"name": "Mıknatıs",     "nameEn": "Magnet",      "icon": "🧲", "desc": "Yemleri sana çeker (menzil artar)", "descEn": "Pulls food toward you (range increases)"},
    "xpBonus":      {"name": "XP Bonusu",    "nameEn": "XP Bonus",    "icon": "⭐", "desc": "Kazanılan XP miktarını artırır", "descEn": "Increases XP earned"},
    "altinBonus":   {"name": "Altın Bonusu", "nameEn": "Gold Bonus",  "icon": "💰", "desc": "Kazanılan altın miktarını artırır", "descEn": "Increases gold earned"},
    "dayaniklilik": {"name": "Dayanıklılık", "nameEn": "Endurance",   "icon": "❤️", "desc": "Her 25 seviyede bir ekstra can (kalkan) kazandırır", "descEn": "Grants an extra shield every 25 levels"},
    "sans":         {"name": "Şans",         "nameEn": "Luck",        "icon": "🍀", "desc": "Nadir yemlerin (Kristal/Mega) çıkma ihtimalini artırır", "descEn": "Increases the odds of rare food (Crystal/Mega)"},
    "bossGucu":     {"name": "Boss Gücü",    "nameEn": "Boss Power",  "icon": "🛡", "desc": "Boss karşılaşmalarında level'ine küçük bir bonus ekler", "descEn": "Adds a small level bonus during boss fights"},
}
UPGRADE_MAX_LEVEL = 100
UPGRADE_BASE_TABLE = {1: 100, 2: 300, 3: 500, 4: 1000, 5: 1500, 6: 2200, 7: 3000, 8: 4000, 9: 5200, 10: 6500}

PRESTIGE_REWARD_NAMES = [
    "🏵 Prestij Rozeti I", "🎖 Onur Çerçevesi", "💫 Aura Efekti", "🔱 Kadim Amblem",
    "🌠 Göktaşı İzi", "🏆 Şampiyon Çerçevesi", "👁 Bilge Gözü", "🪐 Yörünge Halesi",
]

SNAKE_SKINS = [
    {"key": "neon_pink",    "name": "Neon Pembe",        "nameEn": "Neon Pink",        "color": "#ff3d9a", "color2": "#ff3d9a", "pattern": "solid",   "shape": "daire",   "price": 150},
    {"key": "ice_blue",     "name": "Buz Mavisi",        "nameEn": "Ice Blue",         "color": "#66d9ef", "color2": "#66d9ef", "pattern": "solid",   "shape": "daire",   "price": 150},
    {"key": "toxic_stripe", "name": "Toksik Çizgili",    "nameEn": "Toxic Stripes",    "color": "#76ff03", "color2": "#1b3a0f", "pattern": "striped", "shape": "daire",   "price": 300},
    {"key": "blood_dots",   "name": "Kan Benekli",       "nameEn": "Blood Spots",      "color": "#d32f2f", "color2": "#3a0a0a", "pattern": "scales",  "shape": "daire",   "price": 300},
    {"key": "pixel_block",  "name": "Piksel Blok",       "nameEn": "Pixel Block",      "color": "#8bc34a", "color2": "#33691e", "pattern": "striped", "shape": "kare",    "price": 400},
    {"key": "cyber_grad",   "name": "Cyber Gradyan",     "nameEn": "Cyber Gradient",   "color": "#00e5ff", "color2": "#7c4dff", "pattern": "gradient","shape": "kare",    "price": 500},
    {"key": "fire_flame",   "name": "Ateş Alevi",        "nameEn": "Fire Flame",       "color": "#ffeb3b", "color2": "#ff3d00", "pattern": "gradient","shape": "daire",   "price": 500},
    {"key": "royal_scales", "name": "Kraliyet Pulları",  "nameEn": "Royal Scales",     "color": "#9c27b0", "color2": "#4a148c", "pattern": "scales",  "shape": "altigen", "price": 600},
    {"key": "shadow_glow",  "name": "Gölge Neon",        "nameEn": "Shadow Neon",      "color": "#263238", "color2": "#00e5ff", "pattern": "glow",    "shape": "elmas",   "price": 650},
    {"key": "gold_sparkle", "name": "Altın Parıltı",     "nameEn": "Gold Sparkle",     "color": "#ffd700", "color2": "#fff59d", "pattern": "sparkle", "shape": "daire",   "price": 900},
    {"key": "diamond_edge", "name": "Elmas Kenar",       "nameEn": "Diamond Edge",     "color": "#40c4ff", "color2": "#01579b", "pattern": "gradient","shape": "elmas",   "price": 950},
    {"key": "galaxy_rain",  "name": "Galaksi Gökkuşağı", "nameEn": "Galaxy Rainbow",   "color": "#7c4dff", "color2": "#ff3d9a", "pattern": "rainbow", "shape": "yildiz",  "price": 1200},
]
SNAKE_SKIN_BY_KEY = {s["key"]: s for s in SNAKE_SKINS}

QUEST_DEFS = [
    {"key": "feedCollect",  "title": "500 Yem Topla",     "titleEn": "Collect 500 Food",     "icon": "🍎", "target": 500,   "reward": 150},
    {"key": "eatSnakes",    "title": "10 Yılan Ye",       "titleEn": "Eat 10 Snakes",         "icon": "🐍", "target": 10,    "reward": 200},
    {"key": "bossWin",      "title": "1 Boss Yen",        "titleEn": "Defeat 1 Boss",         "icon": "👑", "target": 1,     "reward": 300},
    {"key": "gamesPlayed",  "title": "3 Oyun Oyna",       "titleEn": "Play 3 Games",          "icon": "🎮", "target": 3,     "reward": 100},
    {"key": "xpEarned",     "title": "50.000 XP Kazan",   "titleEn": "Earn 50,000 XP",        "icon": "✨", "target": 50000, "reward": 250},
    {"key": "bigSnakeHunt", "title": "Dev Yılan Avla",    "titleEn": "Hunt a Giant Snake",     "icon": "🎯", "target": 1,     "reward": 200},
]


ACHIEVEMENT_DEFS = [
    {"key": "ilkOyun",        "title": "İlk Oyun",         "titleEn": "First Game",           "icon": "🎮", "target": 1,      "reward": 50},
    {"key": "ilkYem",         "title": "İlk Yem",          "titleEn": "First Bite",           "icon": "🍎", "target": 1,      "reward": 30},
    {"key": "ilkAv",          "title": "İlk Av",           "titleEn": "First Kill",           "icon": "🐍", "target": 1,      "reward": 50},
    {"key": "ilkBoss",        "title": "İlk Boss",         "titleEn": "First Boss",           "icon": "👑", "target": 1,      "reward": 100},
    {"key": "ilkSkin",        "title": "İlk Skin",         "titleEn": "First Skin",           "icon": "🎨", "target": 1,      "reward": 80},
    {"key": "skin10",         "title": "10 Skin",          "titleEn": "10 Skins",             "icon": "🎨", "target": 10,     "reward": 500},
    {"key": "tumSkinler",     "title": "Tüm Skinler",      "titleEn": "All Skins",            "icon": "🌈", "target": len(BOSSES), "reward": 1500},
    {"key": "boss10",         "title": "10 Boss",          "titleEn": "10 Bosses",            "icon": "⚔",  "target": 10,     "reward": 300},
    {"key": "boss100",        "title": "100 Boss",         "titleEn": "100 Bosses",           "icon": "⚔",  "target": 100,    "reward": 2000},
    {"key": "boss500",        "title": "500 Boss",         "titleEn": "500 Bosses",           "icon": "⚔",  "target": 500,    "reward": 10000},
    {"key": "level100",       "title": "Level 100",        "titleEn": "Level 100",            "icon": "📈", "target": 100,    "reward": 1000},
    {"key": "level500",       "title": "Level 500",        "titleEn": "Level 500",            "icon": "📈", "target": 500,    "reward": 5000},
    {"key": "level1000",      "title": "Level 1000",       "titleEn": "Level 1000",           "icon": "📈", "target": 1000,   "reward": 20000},
    {"key": "enBuyukYilan",   "title": "En Büyük Yılan",   "titleEn": "Biggest Snake",        "icon": "📏", "target": 150,    "reward": 400},
    {"key": "olmedenBossKes", "title": "Ölmeden Boss Kes", "titleEn": "Flawless Boss Kill",   "icon": "🥷", "target": 1,      "reward": 600},
    {"key": "saat100",        "title": "100 Saat Oyna",    "titleEn": "Play 100 Hours",       "icon": "⏳", "target": 360000, "reward": 5000},
]

ACHIEVEMENT_PROGRESS = {
    "ilkOyun":        lambda p: p["stats"].get("games", 0),
    "ilkYem":         lambda p: p["stats"].get("totalFoodEaten", 0),
    "ilkAv":          lambda p: p["stats"].get("totalAIEaten", 0),
    "ilkBoss":        lambda p: p["stats"].get("bossWins", 0),
    "ilkSkin":        lambda p: len(p.get("skinsUnlocked", [])),
    "skin10":         lambda p: len(p.get("skinsUnlocked", [])),
    "tumSkinler":     lambda p: len(p.get("skinsUnlocked", [])),
    "boss10":         lambda p: p["stats"].get("bossWins", 0),
    "boss100":        lambda p: p["stats"].get("bossWins", 0),
    "boss500":        lambda p: p["stats"].get("bossWins", 0),
    "level100":       lambda p: p.get("bestLevel", 1),
    "level500":       lambda p: p.get("bestLevel", 1),
    "level1000":      lambda p: p.get("bestLevel", 1),
    "enBuyukYilan":   lambda p: p.get("longestSnake", 0),
    "olmedenBossKes": lambda p: p["stats"].get("flawlessBossWins", 0),
    "saat100":        lambda p: p["stats"].get("totalPlaySeconds", 0),
}


DAILY_LOGIN_REWARDS = [
    {"day": 1, "type": "gold",  "amount": 100, "label": "100 Altın", "labelEn": "100 Gold"},
    {"day": 2, "type": "gold",  "amount": 150, "label": "150 Altın", "labelEn": "150 Gold"},
    {"day": 3, "type": "gold",  "amount": 250, "label": "250 Altın", "labelEn": "250 Gold"},
    {"day": 4, "type": "gold",  "amount": 400, "label": "400 Altın", "labelEn": "400 Gold"},
    {"day": 5, "type": "gold",  "amount": 600, "label": "600 Altın", "labelEn": "600 Gold"},
    {"day": 6, "type": "gold",  "amount": 900, "label": "900 Altın", "labelEn": "900 Gold"},
    {"day": 7, "type": "chest", "amount": 200, "label": "🎁 Altın Sandık + 200 Altın", "labelEn": "🎁 Gold Chest + 200 Gold"},
]


CHEST_TIERS = [
    {"key": "bronze",    "name": "Bronz Sandık",     "nameEn": "Bronze Chest",    "icon": "🥉", "weight": 50, "goldMin": 30,   "goldMax": 80,   "fragMin": 3,  "fragMax": 8,   "fragChance": 0.30, "cosmeticChance": 0.03},
    {"key": "silver",    "name": "Gümüş Sandık",     "nameEn": "Silver Chest",    "icon": "🥈", "weight": 30, "goldMin": 80,   "goldMax": 180,  "fragMin": 5,  "fragMax": 12,  "fragChance": 0.50, "cosmeticChance": 0.08},
    {"key": "gold",      "name": "Altın Sandık",     "nameEn": "Gold Chest",      "icon": "🥇", "weight": 14, "goldMin": 180,  "goldMax": 400,  "fragMin": 10, "fragMax": 20,  "fragChance": 0.70, "cosmeticChance": 0.18},
    {"key": "diamond",   "name": "Elmas Sandık",     "nameEn": "Diamond Chest",   "icon": "💎", "weight": 5,  "goldMin": 400,  "goldMax": 900,  "fragMin": 20, "fragMax": 35,  "fragChance": 0.85, "cosmeticChance": 0.35},
    {"key": "legendary", "name": "Efsanevi Sandık",  "nameEn": "Legendary Chest", "icon": "👑", "weight": 1,  "goldMin": 1000, "goldMax": 2500, "fragMin": 40, "fragMax": 100, "fragChance": 1.00, "cosmeticChance": 0.70},
]
CHEST_TIER_BY_KEY = {t["key"]: t for t in CHEST_TIERS}

COSMETIC_ORNAMENTS = [
    "🔥 Ateş Çerçevesi", "❄️ Buz Çerçevesi", "🌌 Galaksi Çerçevesi", "💀 Kafatası Rozeti",
    "👑 Taç Rozeti", "🐉 Ejder Amblemi", "⚡ Şimşek Amblemi", "🌈 Gökkuşağı Efekti",
    "🌟 Yıldız Tozu Efekti", "🩸 Kan Kırmızısı Çerçeve", "🕸 Gölge Örgüsü", "💠 Kristal Hale",
]


def roll_chest_tier(boss_level: int):
    """Higher-level bosses skew the drop toward rarer chest tiers."""
    bonus = min(boss_level / 20.0, 4.0)  # up to +4x weight nudge for high-tier bosses
    weights = []
    for i, t in enumerate(CHEST_TIERS):
        rarity_factor = i / (len(CHEST_TIERS) - 1)  # 0 (bronze) .. 1 (legendary)
        weights.append(t["weight"] * (1 + bonus * rarity_factor))
    return random.choices(CHEST_TIERS, weights=weights, k=1)[0]


def open_chest_reward(tier_key: str, profile: dict):
    tier = CHEST_TIER_BY_KEY.get(tier_key)
    if not tier:
        return None

    gold = random.randint(tier["goldMin"], tier["goldMax"])

    fragment = None
    if random.random() < tier["fragChance"]:
        unlocked_bosses = [b for b in BOSSES if (b["name"] + " Skin") in profile.get("skinsUnlocked", [])
                           and b["name"] not in profile.get("legendarySkins", [])]
        if unlocked_bosses:
            boss = random.choice(unlocked_bosses)
            amount = random.randint(tier["fragMin"], tier["fragMax"])
            frag = profile.setdefault("bossFragments", {})
            before = frag.get(boss["name"], 0)
            after = min(BOSS_FRAGMENT_TARGET, before + amount)
            frag[boss["name"]] = after
            fragment = {"boss": boss["name"], "bossEn": boss.get("nameEn", boss["name"]), "amount": after - before}
            if after >= BOSS_FRAGMENT_TARGET and boss["name"] not in profile.get("legendarySkins", []):
                profile.setdefault("legendarySkins", []).append(boss["name"])
                fragment["legendaryUnlocked"] = True
        else:
            gold += tier["fragMax"] * 5  # no eligible boss yet -> compensate with gold

    cosmetic = None
    if random.random() < tier["cosmeticChance"]:
        owned = set(profile.get("cosmeticsUnlocked", []))
        available = [c for c in COSMETIC_ORNAMENTS if c not in owned]
        if available:
            cosmetic = random.choice(available)
            profile.setdefault("cosmeticsUnlocked", []).append(cosmetic)
        else:
            gold += 100  # already own everything -> bonus gold

    profile["totalGold"] = profile.get("totalGold", 0) + gold
    stats = profile.setdefault("stats", default_profile()["stats"])
    stats["totalGoldEarned"] = stats.get("totalGoldEarned", 0) + gold

    return {"tier": tier_key, "tierName": tier["name"], "tierNameEn": tier.get("nameEn", tier["name"]), "icon": tier["icon"], "gold": gold, "fragment": fragment, "cosmetic": cosmetic}


MEDAL_TIERS = [
    {"key": "bronze",    "name": "Bronz",     "nameEn": "Bronze",    "icon": "🥉", "minScore": 0},
    {"key": "silver",    "name": "Gümüş",     "nameEn": "Silver",    "icon": "🥈", "minScore": 50},
    {"key": "gold",      "name": "Altın",     "nameEn": "Gold",      "icon": "🥇", "minScore": 100},
    {"key": "diamond",   "name": "Elmas",     "nameEn": "Diamond",   "icon": "💎", "minScore": 180},
    {"key": "legendary", "name": "Efsanevi",  "nameEn": "Legendary", "icon": "👑", "minScore": 300},
]


def compute_match_score(data: dict) -> int:
    level = int(data.get("level", 1))
    ai_eaten = int(data.get("aiEaten", 0))
    food_eaten = int(data.get("foodEaten", 0))
    gold_earned = int(data.get("goldEarned", 0))
    boss_result = data.get("bossResult")
    score = level * 10 + ai_eaten * 6 + (food_eaten // 5) + (gold_earned // 10)
    if boss_result == "win":
        score += 100
    if data.get("bigKill"):
        score += 20
    if data.get("flawlessBossWin"):
        score += 30
    return score


def medal_for_score(score: int) -> dict:
    earned = MEDAL_TIERS[0]
    for tier in MEDAL_TIERS:
        if score >= tier["minScore"]:
            earned = tier
    return earned


def upgrade_cost(level_after: int) -> int:
    """Cost in gold to go FROM (level_after-1) TO level_after."""
    if level_after in UPGRADE_BASE_TABLE:
        return UPGRADE_BASE_TABLE[level_after]
    if level_after <= 10:
        return UPGRADE_BASE_TABLE.get(level_after, 100)
    return round(6500 * (1.10 ** (level_after - 10)))


def today_str():
    import datetime
    return datetime.date.today().isoformat()


def yesterday_str():
    import datetime
    return (datetime.date.today() - datetime.timedelta(days=1)).isoformat()


def default_profile():
    return {
        "name": "Oyuncu",
        "totalGold": 0,
        "bestLevel": 1,
        "longestSnake": 0,
        "skinsUnlocked": [],
        "bossesDefeated": [],
        "bossFragments": {b["name"]: 0 for b in BOSSES},
        "legendarySkins": [],
        "chestInventory": [],
        "cosmeticsUnlocked": [],
        "medals": {t["key"]: 0 for t in MEDAL_TIERS},
        "bestMedalEver": None,
        "prestigeLevel": 0,
        "purchasedSkins": ["default"],
        "equippedSkin": "default",
        "selectedArena": "cayir",
        "upgrades": {k: 0 for k in UPGRADE_DEFS},
        "achievementsClaimed": [],
        "dailyLogin": {"lastClaimDate": None, "streak": 0},
        "settings": {
            "sound": True,
            "music": True,
            "musicTrack": "yumusak",  # yumusak | ambient | enerjik
            "language": "tr",  # tr | en
            "graphics": "orta",   # dusuk | orta | yuksek
            "fps": 60,             # 30 | 60 | 120
            "vibration": True,
            "notifications": False,
        },
        "dailyQuests": {
            "date": today_str(),
            "progress": {q["key"]: 0 for q in QUEST_DEFS},
            "claimed": {q["key"]: False for q in QUEST_DEFS},
        },
        "stats": {
            "games": 0,
            "wins": 0,
            "losses": 0,
            "bossWins": 0,
            "bossLosses": 0,
            "totalPlaySeconds": 0,
            "totalFoodEaten": 0,
            "totalAIEaten": 0,
            "flawlessBossWins": 0,
            "totalGoldEarned": 0,
            "longestGameSeconds": 0,
        },
    }


def ensure_daily_quests(profile):
    dq = profile.get("dailyQuests")
    if not dq or dq.get("date") != today_str():
        profile["dailyQuests"] = {
            "date": today_str(),
            "progress": {q["key"]: 0 for q in QUEST_DEFS},
            "claimed": {q["key"]: False for q in QUEST_DEFS},
        }
    else:
        for q in QUEST_DEFS:
            dq["progress"].setdefault(q["key"], 0)
            dq["claimed"].setdefault(q["key"], False)
    return profile["dailyQuests"]


def load_profile():
    data_file = _visitor_profile_path()
    if not os.path.exists(data_file):
        return default_profile()
    try:
        with open(data_file, "r", encoding="utf-8") as f:
            profile = json.load(f)
    except (json.JSONDecodeError, OSError):
        return default_profile()
    base = default_profile()
    base.update(profile)
    base["stats"] = {**default_profile()["stats"], **profile.get("stats", {})}
    base["upgrades"] = {**default_profile()["upgrades"], **profile.get("upgrades", {})}
    base["achievementsClaimed"] = profile.get("achievementsClaimed", [])
    base["dailyLogin"] = {**default_profile()["dailyLogin"], **profile.get("dailyLogin", {})}
    base["bossFragments"] = {**default_profile()["bossFragments"], **profile.get("bossFragments", {})}
    base["legendarySkins"] = profile.get("legendarySkins", [])
    base["settings"] = {**default_profile()["settings"], **profile.get("settings", {})}
    base["chestInventory"] = profile.get("chestInventory", [])
    base["cosmeticsUnlocked"] = profile.get("cosmeticsUnlocked", [])
    base["medals"] = {**default_profile()["medals"], **profile.get("medals", {})}
    base["bestMedalEver"] = profile.get("bestMedalEver")
    base["prestigeLevel"] = profile.get("prestigeLevel", 0)
    base["purchasedSkins"] = profile.get("purchasedSkins", ["default"])
    base["equippedSkin"] = profile.get("equippedSkin", "default")
    base["selectedArena"] = profile.get("selectedArena", "cayir")
    if base["selectedArena"] not in ARENA_BY_KEY:
        base["selectedArena"] = "cayir"
    ensure_daily_quests(base)
    return base


def save_profile(profile):
    data_file = _visitor_profile_path()
    os.makedirs(PLAYERS_DIR, exist_ok=True)
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(profile, f, ensure_ascii=False, indent=2)


def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        return []
    try:
        with open(LEADERBOARD_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def save_leaderboard(entries):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(LEADERBOARD_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


@bp.route("/oyna/rise-of-the-bosses")
def index():
    return render_template("rise_of_the_bosses/index.html")


@bp.route("/api/bosses", methods=["GET"])
def get_bosses():
    return jsonify(BOSSES)


@bp.route("/api/profile", methods=["GET"])
def get_profile():
    return jsonify(load_profile())


@bp.route("/api/profile", methods=["POST"])
def update_profile():
    data = request.get_json(force=True) or {}
    profile = load_profile()

    if data.get("name"):
        profile["name"] = str(data["name"])[:20]

    profile["totalGold"] = profile.get("totalGold", 0) + int(data.get("goldEarned", 0))
    profile["bestLevel"] = max(profile.get("bestLevel", 1), int(data.get("level", 1)))
    profile["longestSnake"] = max(profile.get("longestSnake", 0), int(data.get("length", 0)))

    skin = data.get("skinUnlocked")
    if skin and skin not in profile["skinsUnlocked"]:
        profile["skinsUnlocked"].append(skin)

    boss = data.get("bossDefeated")
    legendary_unlocked = None
    chest_dropped = None
    if boss:
        if boss not in profile["bossesDefeated"]:
            profile["bossesDefeated"].append(boss)
        else:
            frag = profile.setdefault("bossFragments", {})
            frag[boss] = min(BOSS_FRAGMENT_TARGET, frag.get(boss, 0) + BOSS_FRAGMENT_REWARD)
            if frag[boss] >= BOSS_FRAGMENT_TARGET and boss not in profile.get("legendarySkins", []):
                profile.setdefault("legendarySkins", []).append(boss)
                legendary_unlocked = boss

        boss_info = next((b for b in BOSSES if b["name"] == boss), None)
        boss_level = boss_info["level"] if boss_info else 10
        tier = roll_chest_tier(boss_level)
        chest = {"id": uuid.uuid4().hex[:10], "tier": tier["key"], "source": boss}
        profile.setdefault("chestInventory", []).append(chest)
        chest_dropped = {"tier": tier["key"], "tierName": tier["name"], "tierNameEn": tier.get("nameEn", tier["name"]), "icon": tier["icon"]}

    stats = profile.setdefault("stats", default_profile()["stats"])
    stats["games"] = stats.get("games", 0) + 1
    stats["totalPlaySeconds"] = stats.get("totalPlaySeconds", 0) + int(data.get("playSeconds", 0))
    stats["totalFoodEaten"] = stats.get("totalFoodEaten", 0) + int(data.get("foodEaten", 0))
    stats["totalAIEaten"] = stats.get("totalAIEaten", 0) + int(data.get("aiEaten", 0))
    stats["totalGoldEarned"] = stats.get("totalGoldEarned", 0) + int(data.get("goldEarned", 0))
    stats["longestGameSeconds"] = max(stats.get("longestGameSeconds", 0), int(data.get("playSeconds", 0)))
    if data.get("flawlessBossWin"):
        stats["flawlessBossWins"] = stats.get("flawlessBossWins", 0) + 1

    result = data.get("result")
    if result == "win":
        stats["wins"] = stats.get("wins", 0) + 1
    elif result == "loss":
        stats["losses"] = stats.get("losses", 0) + 1

    boss_result = data.get("bossResult")
    if boss_result == "win":
        stats["bossWins"] = stats.get("bossWins", 0) + 1
    elif boss_result == "loss":
        stats["bossLosses"] = stats.get("bossLosses", 0) + 1

    # --- daily quest progress ---
    dq = ensure_daily_quests(profile)
    prog = dq["progress"]
    prog["feedCollect"] = prog.get("feedCollect", 0) + int(data.get("foodEaten", 0))
    prog["eatSnakes"] = prog.get("eatSnakes", 0) + int(data.get("aiEaten", 0))
    prog["xpEarned"] = prog.get("xpEarned", 0) + int(data.get("xpGained", 0))
    prog["gamesPlayed"] = min(
        QUEST_DEFS[3]["target"], prog.get("gamesPlayed", 0) + 1
    )
    if boss_result == "win":
        prog["bossWin"] = min(QUEST_DEFS[2]["target"], prog.get("bossWin", 0) + 1)
    if data.get("bigKill"):
        prog["bigSnakeHunt"] = min(QUEST_DEFS[5]["target"], prog.get("bigSnakeHunt", 0) + 1)

    # --- medal for this match ---
    score = compute_match_score(data)
    medal = medal_for_score(score)
    medals = profile.setdefault("medals", default_profile()["medals"])
    medals[medal["key"]] = medals.get(medal["key"], 0) + 1
    tier_order = [t["key"] for t in MEDAL_TIERS]
    if not profile.get("bestMedalEver") or tier_order.index(medal["key"]) > tier_order.index(profile["bestMedalEver"]):
        profile["bestMedalEver"] = medal["key"]

    save_profile(profile)
    response = dict(profile)
    response["legendaryUnlockedNow"] = legendary_unlocked
    response["chestDroppedNow"] = chest_dropped
    response["medalEarnedNow"] = {**medal, "score": score}
    return jsonify(response)


@bp.route("/api/upgrades", methods=["GET"])
def get_upgrade_defs():
    return jsonify({"defs": UPGRADE_DEFS, "maxLevel": UPGRADE_MAX_LEVEL})


@bp.route("/api/upgrade", methods=["POST"])
def buy_upgrade():
    data = request.get_json(force=True) or {}
    key = data.get("key")
    if key not in UPGRADE_DEFS:
        return jsonify({"success": False, "reason": "invalid_key"}), 400

    profile = load_profile()
    current = profile["upgrades"].get(key, 0)
    if current >= UPGRADE_MAX_LEVEL:
        return jsonify({"success": False, "reason": "max_level", "profile": profile})

    next_level = current + 1
    cost = upgrade_cost(next_level)
    if profile["totalGold"] < cost:
        return jsonify({"success": False, "reason": "insufficient_gold", "cost": cost, "profile": profile})

    profile["totalGold"] -= cost
    profile["upgrades"][key] = next_level
    save_profile(profile)
    return jsonify({"success": True, "profile": profile, "newLevel": next_level, "cost": cost})


@bp.route("/api/quests", methods=["GET"])
def get_quests():
    profile = load_profile()
    save_profile(profile)  # persist any daily reset
    return jsonify({"defs": QUEST_DEFS, "state": profile["dailyQuests"]})


@bp.route("/api/quests/claim", methods=["POST"])
def claim_quest():
    data = request.get_json(force=True) or {}
    key = data.get("key")
    quest = next((q for q in QUEST_DEFS if q["key"] == key), None)
    if not quest:
        return jsonify({"success": False, "reason": "invalid_key"}), 400

    profile = load_profile()
    dq = ensure_daily_quests(profile)
    if dq["claimed"].get(key):
        return jsonify({"success": False, "reason": "already_claimed", "profile": profile})
    if dq["progress"].get(key, 0) < quest["target"]:
        return jsonify({"success": False, "reason": "not_complete", "profile": profile})

    dq["claimed"][key] = True
    profile["totalGold"] += quest["reward"]
    save_profile(profile)
    return jsonify({"success": True, "profile": profile, "reward": quest["reward"]})


@bp.route("/api/profile/reset", methods=["POST"])
def reset_profile():
    profile = default_profile()
    save_profile(profile)
    return jsonify(profile)


@bp.route("/api/achievements", methods=["GET"])
def get_achievements():
    profile = load_profile()
    save_profile(profile)
    result = []
    for ach in ACHIEVEMENT_DEFS:
        raw_progress = ACHIEVEMENT_PROGRESS[ach["key"]](profile)
        progress = min(ach["target"], raw_progress)
        unlocked = raw_progress >= ach["target"]
        claimed = ach["key"] in profile.get("achievementsClaimed", [])
        result.append({**ach, "progress": progress, "unlocked": unlocked, "claimed": claimed})
    return jsonify(result)


@bp.route("/api/achievements/claim", methods=["POST"])
def claim_achievement():
    data = request.get_json(force=True) or {}
    key = data.get("key")
    ach = next((a for a in ACHIEVEMENT_DEFS if a["key"] == key), None)
    if not ach:
        return jsonify({"success": False, "reason": "invalid_key"}), 400

    profile = load_profile()
    claimed_list = profile.setdefault("achievementsClaimed", [])
    if key in claimed_list:
        return jsonify({"success": False, "reason": "already_claimed", "profile": profile})

    progress = ACHIEVEMENT_PROGRESS[key](profile)
    if progress < ach["target"]:
        return jsonify({"success": False, "reason": "not_complete", "profile": profile})

    claimed_list.append(key)
    profile["totalGold"] += ach["reward"]
    save_profile(profile)
    return jsonify({"success": True, "profile": profile, "reward": ach["reward"]})


@bp.route("/api/chests", methods=["GET"])
def get_chests():
    profile = load_profile()
    save_profile(profile)
    return jsonify({
        "inventory": profile.get("chestInventory", []),
        "tiers": CHEST_TIERS,
        "cosmeticsUnlocked": profile.get("cosmeticsUnlocked", []),
        "allCosmetics": COSMETIC_ORNAMENTS,
    })


@bp.route("/api/chests/open", methods=["POST"])
def open_chest():
    data = request.get_json(force=True) or {}
    chest_id = data.get("id")
    profile = load_profile()
    inventory = profile.get("chestInventory", [])
    chest = next((c for c in inventory if c["id"] == chest_id), None)
    if not chest:
        return jsonify({"success": False, "reason": "not_found", "profile": profile}), 404

    inventory.remove(chest)
    reward = open_chest_reward(chest["tier"], profile)
    save_profile(profile)
    return jsonify({"success": True, "reward": reward, "profile": profile})


@bp.route("/api/chests/open-all", methods=["POST"])
def open_all_chests():
    profile = load_profile()
    inventory = profile.get("chestInventory", [])
    if not inventory:
        return jsonify({"success": False, "reason": "empty", "profile": profile})

    rewards = []
    for chest in list(inventory):
        rewards.append(open_chest_reward(chest["tier"], profile))
    profile["chestInventory"] = []
    save_profile(profile)

    summary = {
        "count": len(rewards),
        "totalGold": sum(r["gold"] for r in rewards),
        "fragments": [r["fragment"] for r in rewards if r["fragment"]],
        "cosmetics": [r["cosmetic"] for r in rewards if r["cosmetic"]],
    }
    return jsonify({"success": True, "rewards": rewards, "summary": summary, "profile": profile})


@bp.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    entries = load_leaderboard()
    entries.sort(key=lambda e: e.get("score", 0), reverse=True)
    return jsonify(entries[:50])


@bp.route("/api/leaderboard", methods=["POST"])
def submit_leaderboard():
    data = request.get_json(force=True) or {}
    name = str(data.get("name", "Oyuncu")).strip()[:20] or "Oyuncu"
    entry = {
        "id": uuid.uuid4().hex[:10],
        "name": name,
        "score": int(data.get("score", 0)),
        "level": int(data.get("level", 1)),
        "mode": str(data.get("mode", ""))[:20],
        "date": today_str(),
    }
    entries = load_leaderboard()
    entries.append(entry)
    entries.sort(key=lambda e: e.get("score", 0), reverse=True)
    entries = entries[:200]  # keep file from growing unbounded
    save_leaderboard(entries)
    return jsonify(entries[:50])


@bp.route("/api/leaderboard/<entry_id>", methods=["DELETE"])
def delete_leaderboard_entry(entry_id):
    entries = load_leaderboard()
    entries = [e for e in entries if e.get("id") != entry_id]
    save_leaderboard(entries)
    entries.sort(key=lambda e: e.get("score", 0), reverse=True)
    return jsonify(entries[:50])


@bp.route("/api/leaderboard/clear", methods=["POST"])
def clear_leaderboard():
    save_leaderboard([])
    return jsonify([])


@bp.route("/api/prestige", methods=["GET"])
def get_prestige():
    profile = load_profile()
    save_profile(profile)
    maxed_count = sum(1 for k in UPGRADE_DEFS if profile["upgrades"].get(k, 0) >= UPGRADE_MAX_LEVEL)
    eligible = maxed_count == len(UPGRADE_DEFS)
    return jsonify({
        "prestigeLevel": profile.get("prestigeLevel", 0),
        "eligible": eligible,
        "maxedCount": maxed_count,
        "totalUpgrades": len(UPGRADE_DEFS),
    })


@bp.route("/api/prestige/activate", methods=["POST"])
def activate_prestige():
    profile = load_profile()
    maxed_count = sum(1 for k in UPGRADE_DEFS if profile["upgrades"].get(k, 0) >= UPGRADE_MAX_LEVEL)
    if maxed_count < len(UPGRADE_DEFS):
        return jsonify({"success": False, "reason": "not_eligible", "profile": profile})

    profile["upgrades"] = {k: 0 for k in UPGRADE_DEFS}
    profile["prestigeLevel"] = profile.get("prestigeLevel", 0) + 1
    idx = (profile["prestigeLevel"] - 1) % len(PRESTIGE_REWARD_NAMES)
    reward_name = f"{PRESTIGE_REWARD_NAMES[idx]} (Prestij {profile['prestigeLevel']})"
    profile.setdefault("cosmeticsUnlocked", []).append(reward_name)

    save_profile(profile)
    return jsonify({"success": True, "profile": profile, "prestigeLevel": profile["prestigeLevel"], "reward": reward_name})


@bp.route("/api/arenas", methods=["GET"])
def get_arenas():
    profile = load_profile()
    save_profile(profile)
    best_level = profile.get("bestLevel", 1)
    result = []
    for a in ARENAS:
        result.append({**a, "unlocked": best_level >= a["unlockLevel"]})
    return jsonify({"arenas": result, "selected": profile.get("selectedArena", "cayir")})


@bp.route("/api/arena/select", methods=["POST"])
def select_arena():
    data = request.get_json(force=True) or {}
    key = data.get("key")
    arena = ARENA_BY_KEY.get(key)
    if not arena:
        return jsonify({"success": False, "reason": "invalid_key"}), 400

    profile = load_profile()
    if profile.get("bestLevel", 1) < arena["unlockLevel"]:
        return jsonify({"success": False, "reason": "locked", "profile": profile})

    profile["selectedArena"] = key
    save_profile(profile)
    return jsonify({"success": True, "profile": profile})


@bp.route("/api/skins", methods=["GET"])
def get_skins():
    profile = load_profile()
    save_profile(profile)
    boss_skins = []
    for b in BOSSES:
        skin_name = b["name"] + " Skin"
        is_legendary = b["name"] in profile.get("legendarySkins", [])
        boss_skins.append({
            "key": f"boss:{b['name']}",
            "name": skin_name,
            "nameEn": b.get("nameEn", b["name"]) + " Skin",
            "color": b["color"],
            "color2": "#ffd700" if is_legendary else b["color"],
            "pattern": "glow" if is_legendary else "solid",
            "shape": "yildiz" if is_legendary else "daire",
            "owned": skin_name in profile.get("skinsUnlocked", []),
            "legendary": is_legendary,
        })
    return jsonify({
        "catalog": SNAKE_SKINS,
        "bossSkins": boss_skins,
        "purchasedSkins": profile.get("purchasedSkins", ["default"]),
        "equippedSkin": profile.get("equippedSkin", "default"),
    })


@bp.route("/api/skins/buy", methods=["POST"])
def buy_skin():
    data = request.get_json(force=True) or {}
    key = data.get("key")
    skin = SNAKE_SKIN_BY_KEY.get(key)
    if not skin:
        return jsonify({"success": False, "reason": "invalid_key"}), 400

    profile = load_profile()
    if key in profile.get("purchasedSkins", []):
        return jsonify({"success": False, "reason": "already_owned", "profile": profile})
    if profile["totalGold"] < skin["price"]:
        return jsonify({"success": False, "reason": "insufficient_gold", "cost": skin["price"], "profile": profile})

    profile["totalGold"] -= skin["price"]
    profile.setdefault("purchasedSkins", ["default"]).append(key)
    save_profile(profile)
    return jsonify({"success": True, "profile": profile})


@bp.route("/api/skins/equip", methods=["POST"])
def equip_skin():
    data = request.get_json(force=True) or {}
    key = data.get("key")
    profile = load_profile()

    owned = key == "default" or key in profile.get("purchasedSkins", [])
    if key.startswith("boss:"):
        boss_name = key.split("boss:", 1)[1]
        owned = (boss_name + " Skin") in profile.get("skinsUnlocked", [])

    if not owned:
        return jsonify({"success": False, "reason": "not_owned", "profile": profile})

    profile["equippedSkin"] = key
    save_profile(profile)
    return jsonify({"success": True, "profile": profile})


@bp.route("/api/settings", methods=["POST"])
def update_settings():
    data = request.get_json(force=True) or {}
    profile = load_profile()
    allowed_keys = {"sound", "music", "musicTrack", "graphics", "fps", "vibration", "notifications", "language"}
    settings = profile.setdefault("settings", default_profile()["settings"])
    for k, v in data.items():
        if k in allowed_keys:
            settings[k] = v
    save_profile(profile)
    return jsonify(profile)


@bp.route("/api/boss-fragments", methods=["GET"])
def get_boss_fragments():
    profile = load_profile()
    save_profile(profile)
    result = []
    for b in BOSSES:
        frag = profile.get("bossFragments", {}).get(b["name"], 0)
        result.append({
            "name": b["name"],
            "nameEn": b.get("nameEn", b["name"]),
            "color": b["color"],
            "fragments": frag,
            "target": BOSS_FRAGMENT_TARGET,
            "legendary": b["name"] in profile.get("legendarySkins", []),
            "skinUnlocked": (b["name"] + " Skin") in profile.get("skinsUnlocked", []),
        })
    return jsonify(result)


@bp.route("/api/daily-login", methods=["GET"])
def get_daily_login():
    profile = load_profile()
    dl = profile["dailyLogin"]
    claimed_today = dl["lastClaimDate"] == today_str()
    # what the streak WOULD become if claimed right now
    if dl["lastClaimDate"] == today_str():
        preview_streak = dl["streak"]
    elif dl["lastClaimDate"] == yesterday_str():
        preview_streak = dl["streak"] + 1
    else:
        preview_streak = 1
    day_index = ((preview_streak - 1) % 7) + 1
    save_profile(profile)
    return jsonify({
        "rewards": DAILY_LOGIN_REWARDS,
        "streak": dl["streak"],
        "claimedToday": claimed_today,
        "nextDayIndex": day_index,
    })


@bp.route("/api/daily-login/claim", methods=["POST"])
def claim_daily_login():
    profile = load_profile()
    dl = profile["dailyLogin"]

    if dl["lastClaimDate"] == today_str():
        return jsonify({"success": False, "reason": "already_claimed", "profile": profile})

    if dl["lastClaimDate"] == yesterday_str():
        new_streak = dl["streak"] + 1
    else:
        new_streak = 1  # streak broken or first-ever claim

    day_index = ((new_streak - 1) % 7) + 1
    reward = DAILY_LOGIN_REWARDS[day_index - 1]

    dl["streak"] = new_streak
    dl["lastClaimDate"] = today_str()
    stats = profile.setdefault("stats", default_profile()["stats"])

    if reward["type"] == "chest":
        chest = {"id": uuid.uuid4().hex[:10], "tier": "gold", "source": "daily-login"}
        profile.setdefault("chestInventory", []).append(chest)
        bonus_gold = 200  # small guaranteed bonus alongside the chest
        profile["totalGold"] += bonus_gold
        stats["totalGoldEarned"] = stats.get("totalGoldEarned", 0) + bonus_gold
    else:
        profile["totalGold"] += reward["amount"]
        stats["totalGoldEarned"] = stats.get("totalGoldEarned", 0) + reward["amount"]

    save_profile(profile)
    return jsonify({
        "success": True,
        "profile": profile,
        "reward": reward,
        "streak": new_streak,
        "dayIndex": day_index,
    })

