from flask import Blueprint, request, jsonify, render_template
import sqlite3, json, os, datetime

bp = Blueprint('rise_of_the_bosses', __name__, template_folder='templates')

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True)
DB = os.path.join(DATA_DIR, 'rotb.db')


def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''CREATE TABLE IF NOT EXISTS players (
        name TEXT PRIMARY KEY,
        essence INTEGER DEFAULT 0,
        lifetime_essence INTEGER DEFAULT 0,
        prestige_count INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        lifetime_boss_kills INTEGER DEFAULT 0,
        lifetime_orbs INTEGER DEFAULT 0,
        lifetime_deaths INTEGER DEFAULT 0,
        had_close_call INTEGER DEFAULT 0,
        upgrades TEXT DEFAULT '{}',
        unlocked_ach TEXT DEFAULT '{}',
        selected_arena INTEGER DEFAULT 0,
        selected_skin INTEGER DEFAULT 0,
        difficulty TEXT DEFAULT 'normal',
        updated_at TEXT
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        score INTEGER NOT NULL,
        essence_earned INTEGER DEFAULT 0,
        bosses_defeated INTEGER DEFAULT 0,
        created_at TEXT
    )''')
    conn.commit()
    conn.close()


init_db()


@bp.route('/oyna/rise-of-the-bosses')
def index():
    return render_template('rise_of_the_bosses/index.html')


@bp.route('/api/load_progress')
def load_progress():
    name = request.args.get('name', '').strip()
    if not name:
        return jsonify({'found': False})
    conn = get_db()
    row = conn.execute('SELECT * FROM players WHERE name=?', (name,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'found': False})
    d = dict(row)
    d['upgrades'] = json.loads(d['upgrades'] or '{}')
    d['unlocked_ach'] = json.loads(d['unlocked_ach'] or '{}')
    d['had_close_call'] = bool(d['had_close_call'])
    return jsonify({'found': True, 'state': d})


@bp.route('/api/save_progress', methods=['POST'])
def save_progress():
    data = request.get_json(force=True)
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'ok': False, 'error': 'name required'}), 400
    s = data.get('state', {})
    conn = get_db()
    conn.execute('''INSERT INTO players (name, essence, lifetime_essence, prestige_count, best_score,
        lifetime_boss_kills, lifetime_orbs, lifetime_deaths, had_close_call, upgrades, unlocked_ach,
        selected_arena, selected_skin, difficulty, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(name) DO UPDATE SET
        essence=excluded.essence, lifetime_essence=excluded.lifetime_essence,
        prestige_count=excluded.prestige_count, best_score=excluded.best_score,
        lifetime_boss_kills=excluded.lifetime_boss_kills, lifetime_orbs=excluded.lifetime_orbs,
        lifetime_deaths=excluded.lifetime_deaths, had_close_call=excluded.had_close_call,
        upgrades=excluded.upgrades, unlocked_ach=excluded.unlocked_ach,
        selected_arena=excluded.selected_arena, selected_skin=excluded.selected_skin,
        difficulty=excluded.difficulty, updated_at=excluded.updated_at
        ''', (
        name, s.get('essence', 0), s.get('lifetimeEssence', 0), s.get('prestigeCount', 0), s.get('bestScore', 0),
        s.get('lifetimeBossKills', 0), s.get('lifetimeOrbs', 0), s.get('lifetimeDeaths', 0),
        1 if s.get('hadCloseCall') else 0, json.dumps(s.get('upgrades', {})), json.dumps(s.get('unlockedAch', {})),
        s.get('selectedArena', 0), s.get('selectedSkin', 0), s.get('difficulty', 'normal'),
        datetime.datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})


@bp.route('/api/player/<name>', methods=['DELETE'])
def delete_player(name):
    conn = get_db()
    conn.execute('DELETE FROM players WHERE name=?', (name,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})


@bp.route('/api/leaderboard')
def leaderboard():
    conn = get_db()
    rows = conn.execute('SELECT * FROM scores ORDER BY score DESC LIMIT 100').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@bp.route('/api/leaderboard', methods=['POST'])
def add_score():
    data = request.get_json(force=True)
    name = (data.get('name') or 'Anonim').strip()[:24]
    score = int(data.get('score', 0))
    essence = int(data.get('essence_earned', 0))
    bosses = int(data.get('bosses_defeated', 0))
    conn = get_db()
    conn.execute('INSERT INTO scores (name, score, essence_earned, bosses_defeated, created_at) VALUES (?,?,?,?,?)',
                 (name, score, essence, bosses, datetime.datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})


@bp.route('/api/leaderboard/<int:score_id>', methods=['DELETE'])
def delete_score(score_id):
    conn = get_db()
    conn.execute('DELETE FROM scores WHERE id=?', (score_id,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

