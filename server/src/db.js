const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'rankime.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// One-time migration from user-defined categories to fixed code-defined ones.
// Detected by the presence of the old `categories` table; runs only once
// because the table is dropped here and never recreated.
const hasOldCategories = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
).get();
if (hasOldCategories) {
  db.exec('DROP TABLE IF EXISTS category_entries');
  db.exec('DROP TABLE IF EXISTS categories');
}

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
    studio TEXT,
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

  CREATE TABLE IF NOT EXISTS category_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_key TEXT NOT NULL,
    anilist_id INTEGER NOT NULL REFERENCES anime_cache(anilist_id),
    rank_position INTEGER NOT NULL,
    added_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, category_key, anilist_id)
  );

  CREATE INDEX IF NOT EXISTS idx_category_entries ON category_entries(user_id, category_key, rank_position);

  CREATE TABLE IF NOT EXISTS watched_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anilist_id INTEGER NOT NULL REFERENCES anime_cache(anilist_id),
    added_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, anilist_id)
  );

  CREATE INDEX IF NOT EXISTS idx_watched_entries ON watched_entries(user_id, added_at);
`);

// Safe migrations for databases created before a column existed.
// Runs after CREATE TABLE so the table is guaranteed to exist; the ALTER
// throws (and is ignored) only when the column is already present.
try { db.exec('ALTER TABLE anime_cache ADD COLUMN studio TEXT'); } catch {}

module.exports = db;
