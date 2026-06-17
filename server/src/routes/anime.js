const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { fetchFromAniList, upsertCache, ensureCached, getMainStudio, ANILIST_URL } = require('./animeHelpers');

const SEARCH_QUERY = `
query ($search: String!) {
  Page(perPage: 10) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      title { romaji english }
      coverImage { large }
      episodes
      genres
      description(asHtml: false)
      studios(isMain: true) { nodes { name } }
    }
  }
}`;

// Search — proxies AniList so rate limiting stays server-side
router.get('/search', requireAuth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ results: [] });

  try {
    const data = await fetchFromAniList(SEARCH_QUERY, { search: q.trim() });
    const results = data.Page.media.map(m => ({
      anilistId: m.id,
      titleRomaji: m.title.romaji,
      titleEnglish: m.title.english || null,
      coverImageUrl: m.coverImage?.large || null,
      episodeCount: m.episodes || null,
      genres: m.genres || [],
      description: m.description || null,
      studio: getMainStudio(m),
    }));
    res.json({ results });
  } catch (err) {
    console.error('AniList search error:', err.message);
    res.status(502).json({ error: 'Failed to reach AniList' });
  }
});

// GET /api/list — the user's ranked list
router.get('/list', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT re.id, re.anilist_id, re.rank_position, re.added_at,
           ac.title_romaji, ac.title_english, ac.cover_image_url,
           ac.episode_count, ac.genres, ac.description, ac.studio
    FROM ranked_entries re
    JOIN anime_cache ac ON ac.anilist_id = re.anilist_id
    WHERE re.user_id = ?
    ORDER BY re.rank_position ASC
  `).all(req.user.id);

  const list = rows.map(r => ({
    id: r.id,
    anilistId: r.anilist_id,
    rankPosition: r.rank_position,
    addedAt: r.added_at,
    titleRomaji: r.title_romaji,
    titleEnglish: r.title_english,
    coverImageUrl: r.cover_image_url,
    episodeCount: r.episode_count,
    genres: JSON.parse(r.genres),
    description: r.description,
    studio: r.studio || null,
  }));
  res.json({ list });
});

// POST /api/list/add
router.post('/list/add', requireAuth, async (req, res) => {
  const { anilistId } = req.body;
  if (!anilistId) return res.status(400).json({ error: 'anilistId is required' });

  // Already on list?
  const existing = db.prepare(
    'SELECT id FROM ranked_entries WHERE user_id = ? AND anilist_id = ?'
  ).get(req.user.id, anilistId);
  if (existing) return res.status(409).json({ error: 'Already on your list' });

  try { await ensureCached(anilistId); } catch (err) { return res.status(502).json({ error: err.message }); }

  const animeRow = db.prepare('SELECT * FROM anime_cache WHERE anilist_id = ?').get(anilistId);
  if (!animeRow) return res.status(404).json({ error: 'Anime not found' });

  const MAX = 50;
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM ranked_entries WHERE user_id = ?').get(req.user.id);
  const count = countRow.cnt;

  let removedShow = null;

  const addEntry = db.transaction(() => {
    let nextRank = count + 1;

    if (count >= MAX) {
      // Remove the current #50
      const last = db.prepare(`
        SELECT re.anilist_id, ac.title_romaji, ac.title_english
        FROM ranked_entries re JOIN anime_cache ac ON ac.anilist_id = re.anilist_id
        WHERE re.user_id = ? ORDER BY re.rank_position DESC LIMIT 1
      `).get(req.user.id);
      db.prepare('DELETE FROM ranked_entries WHERE user_id = ? AND anilist_id = ?')
        .run(req.user.id, last.anilist_id);
      removedShow = { anilistId: last.anilist_id, title: last.title_english || last.title_romaji };
      nextRank = MAX;
    }

    db.prepare(
      'INSERT INTO ranked_entries (user_id, anilist_id, rank_position) VALUES (?, ?, ?)'
    ).run(req.user.id, anilistId, nextRank);
  });

  addEntry();

  const addedTitle = animeRow.title_english || animeRow.title_romaji;
  res.status(201).json({ ok: true, addedTitle, removedShow });
});

// DELETE /api/list/:anilistId
router.delete('/list/:anilistId', requireAuth, (req, res) => {
  const { anilistId } = req.params;

  const reorder = db.transaction(() => {
    const result = db.prepare(
      'DELETE FROM ranked_entries WHERE user_id = ? AND anilist_id = ?'
    ).run(req.user.id, parseInt(anilistId));

    if (result.changes === 0) return false;

    // Re-number remaining entries so rank_position stays gapless
    const remaining = db.prepare(
      'SELECT id FROM ranked_entries WHERE user_id = ? ORDER BY rank_position ASC'
    ).all(req.user.id);
    const update = db.prepare('UPDATE ranked_entries SET rank_position = ? WHERE id = ?');
    remaining.forEach((r, i) => update.run(i + 1, r.id));
    return true;
  });

  const deleted = reorder();
  if (!deleted) return res.status(404).json({ error: 'Entry not found on your list' });
  res.json({ ok: true });
});

// PATCH /api/list/reorder — accepts full ordered array of anilistIds
router.patch('/list/reorder', requireAuth, (req, res) => {
  const { order } = req.body; // array of anilistIds in new rank order
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });

  const reorder = db.transaction(() => {
    const update = db.prepare(
      'UPDATE ranked_entries SET rank_position = ? WHERE user_id = ? AND anilist_id = ?'
    );
    order.forEach((anilistId, i) => update.run(i + 1, req.user.id, anilistId));
  });

  reorder();
  res.json({ ok: true });
});

module.exports = router;
