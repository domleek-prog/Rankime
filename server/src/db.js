const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'rankime.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Safe migrations — ignore if column already exists
try { db.exec('ALTER TABLE anime_cache ADD COLUMN studio TEXT'); } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS anime_cache (
    anilist_id INTEGER PRIMARY KEY,
    title_romaji TEXT NOT NULL,
    title_english TEXT,
    cover_image_url TEXT,
    episode_count INTEGER,
    genres TEXT NOT NULL DEFAULT '[]',
    description TEXT,
    cached_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS ranked_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anilist_id INTEGER NOT NULL REFERENCES anime_cache(anilist_id),
    rank_position INTEGER NOT NULL,
    added_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, anilist_id)
  );

  CREATE INDEX IF NOT EXISTS idx_ranked_entries_user ON ranked_entries(user_id, rank_position);

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS category_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    anilist_id INTEGER NOT NULL REFERENCES anime_cache(anilist_id),
    rank_position INTEGER NOT NULL,
    added_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, category_id, anilist_id)
  );

  CREATE INDEX IF NOT EXISTS idx_category_entries ON category_entries(user_id, category_id, rank_position);

  CREATE TABLE IF NOT EXISTS watched_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anilist_id INTEGER NOT NULL REFERENCES anime_cache(anilist_id),
    added_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, anilist_id)
  );

  CREATE INDEX IF NOT EXISTS idx_watched_entries ON watched_entries(user_id, added_at);
`);

module.exports = db;
