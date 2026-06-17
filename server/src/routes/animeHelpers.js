const fetch = require('node-fetch');
const db = require('../db');

const ANILIST_URL = 'https://graphql.anilist.co';
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

async function fetchFromAniList(query, variables) {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

function getMainStudio(media) {
  const nodes = media.studios?.nodes || [];
  return nodes[0]?.name || null;
}

function upsertCache(media) {
  db.prepare(`
    INSERT INTO anime_cache (anilist_id, title_romaji, title_english, cover_image_url, episode_count, genres, description, studio, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(anilist_id) DO UPDATE SET
      title_romaji = excluded.title_romaji,
      title_english = excluded.title_english,
      cover_image_url = excluded.cover_image_url,
      episode_count = excluded.episode_count,
      genres = excluded.genres,
      description = excluded.description,
      studio = excluded.studio,
      cached_at = excluded.cached_at
  `).run(
    media.id,
    media.title.romaji,
    media.title.english || null,
    media.coverImage?.large || null,
    media.episodes || null,
    JSON.stringify(media.genres || []),
    media.description || null,
    getMainStudio(media)
  );
}

async function ensureCached(anilistId) {
  const cached = db.prepare('SELECT * FROM anime_cache WHERE anilist_id = ?').get(anilistId);
  const isStale = !cached || (Math.floor(Date.now() / 1000) - cached.cached_at > CACHE_TTL_SECONDS);
  if (!isStale) return;

  try {
    const data = await fetchFromAniList(`
      query ($id: Int!) {
        Media(id: $id, type: ANIME) {
          id title { romaji english } coverImage { large } episodes genres description(asHtml: false)
          studios(isMain: true) { nodes { name } }
        }
      }`, { id: anilistId });
    upsertCache(data.Media);
  } catch (err) {
    if (!cached) throw new Error('Could not fetch anime data from AniList');
  }
}

module.exports = { fetchFromAniList, upsertCache, ensureCached, getMainStudio, ANILIST_URL, CACHE_TTL_SECONDS };
