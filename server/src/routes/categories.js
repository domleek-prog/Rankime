const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ensureCached } = require('./animeHelpers');
const { FIXED_CATEGORIES, CATEGORY_KEYS } = require('../fixedCategories');

const MAX_ENTRIES = 25;

// Reject any key not in the fixed set. Returns true if it responded with 404.
function rejectUnknownKey(res, key) {
  if (!CATEGORY_KEYS.has(key)) {
    res.status(404).json({ error: 'Unknown category' });
    return true;
  }
  return false;
}

// GET /api/categories — the fixed list, with this user's entry count per category
router.get('/', requireAuth, (req, res) => {
  const counts = db.prepare(`
    SELECT category_key, COUNT(*) as cnt
    FROM category_entries WHERE user_id = ?
    GROUP BY category_key
  `).all(req.user.id);
  const countByKey = Object.fromEntries(counts.map(r => [r.category_key, r.cnt]));

  const categories = FIXED_CATEGORIES.map(c => ({
    id: c.key,            // client uses `id` as the nav/endpoint identifier
    name: c.name,
    entry_count: countByKey[c.key] || 0,
  }));
  res.json({ categories });
});

// GET /api/categories/:id/entries
router.get('/:id/entries', requireAuth, (req, res) => {
  if (rejectUnknownKey(res, req.params.id)) return;

  const rows = db.prepare(`
    SELECT ce.id, ce.anilist_id, ce.rank_position, ce.added_at,
           ac.title_romaji, ac.title_english, ac.cover_image_url,
           ac.episode_count, ac.genres, ac.description, ac.studio
    FROM category_entries ce
    JOIN anime_cache ac ON ac.anilist_id = ce.anilist_id
    WHERE ce.user_id = ? AND ce.category_key = ?
    ORDER BY ce.rank_position ASC
  `).all(req.user.id, req.params.id);

  res.json({
    list: rows.map(r => ({
      id: r.id, anilistId: r.anilist_id, rankPosition: r.rank_position, addedAt: r.added_at,
      titleRomaji: r.title_romaji, titleEnglish: r.title_english,
      coverImageUrl: r.cover_image_url, episodeCount: r.episode_count,
      genres: JSON.parse(r.genres), description: r.description, studio: r.studio || null,
    }))
  });
});

// POST /api/categories/:id/add
router.post('/:id/add', requireAuth, async (req, res) => {
  if (rejectUnknownKey(res, req.params.id)) return;
  const { anilistId } = req.body;
  if (!anilistId) return res.status(400).json({ error: 'anilistId is required' });

  const existing = db.prepare(
    'SELECT id FROM category_entries WHERE user_id = ? AND category_key = ? AND anilist_id = ?'
  ).get(req.user.id, req.params.id, anilistId);
  if (existing) return res.status(409).json({ error: 'Already in this category' });

  try { await ensureCached(anilistId); } catch (err) { return res.status(502).json({ error: err.message }); }

  const animeRow = db.prepare('SELECT * FROM anime_cache WHERE anilist_id = ?').get(anilistId);
  if (!animeRow) return res.status(404).json({ error: 'Anime not found' });

  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM category_entries WHERE user_id = ? AND category_key = ?').get(req.user.id, req.params.id);
  let removedShow = null;

  db.transaction(() => {
    let nextRank = countRow.cnt + 1;
    if (countRow.cnt >= MAX_ENTRIES) {
      const last = db.prepare(`
        SELECT ce.anilist_id, ac.title_romaji, ac.title_english
        FROM category_entries ce JOIN anime_cache ac ON ac.anilist_id = ce.anilist_id
        WHERE ce.user_id = ? AND ce.category_key = ? ORDER BY ce.rank_position DESC LIMIT 1
      `).get(req.user.id, req.params.id);
      db.prepare('DELETE FROM category_entries WHERE user_id = ? AND category_key = ? AND anilist_id = ?')
        .run(req.user.id, req.params.id, last.anilist_id);
      removedShow = { anilistId: last.anilist_id, title: last.title_english || last.title_romaji };
      nextRank = MAX_ENTRIES;
    }
    db.prepare('INSERT INTO category_entries (user_id, category_key, anilist_id, rank_position) VALUES (?, ?, ?, ?)')
      .run(req.user.id, req.params.id, anilistId, nextRank);
  })();

  res.status(201).json({ ok: true, addedTitle: animeRow.title_english || animeRow.title_romaji, removedShow });
});

// DELETE /api/categories/:id/entries/:anilistId
router.delete('/:id/entries/:anilistId', requireAuth, (req, res) => {
  if (rejectUnknownKey(res, req.params.id)) return;
  db.transaction(() => {
    const result = db.prepare(
      'DELETE FROM category_entries WHERE user_id = ? AND category_key = ? AND anilist_id = ?'
    ).run(req.user.id, req.params.id, parseInt(req.params.anilistId));
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });

    const remaining = db.prepare(
      'SELECT id FROM category_entries WHERE user_id = ? AND category_key = ? ORDER BY rank_position ASC'
    ).all(req.user.id, req.params.id);
    const update = db.prepare('UPDATE category_entries SET rank_position = ? WHERE id = ?');
    remaining.forEach((r, i) => update.run(i + 1, r.id));
  })();
  res.json({ ok: true });
});

// PATCH /api/categories/:id/reorder
router.patch('/:id/reorder', requireAuth, (req, res) => {
  if (rejectUnknownKey(res, req.params.id)) return;
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });

  db.transaction(() => {
    const update = db.prepare(
      'UPDATE category_entries SET rank_position = ? WHERE user_id = ? AND category_key = ? AND anilist_id = ?'
    );
    order.forEach((anilistId, i) => update.run(i + 1, req.user.id, req.params.id, anilistId));
  })();
  res.json({ ok: true });
});

module.exports = router;
