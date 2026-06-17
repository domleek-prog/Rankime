const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ensureCached } = require('./animeHelpers');

// GET /api/watched
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT we.id, we.anilist_id, we.added_at,
           ac.title_romaji, ac.title_english, ac.cover_image_url,
           ac.episode_count, ac.genres, ac.description, ac.studio
    FROM watched_entries we
    JOIN anime_cache ac ON ac.anilist_id = we.anilist_id
    WHERE we.user_id = ?
    ORDER BY we.added_at DESC
  `).all(req.user.id);

  res.json({
    list: rows.map(r => ({
      id: r.id, anilistId: r.anilist_id, addedAt: r.added_at,
      titleRomaji: r.title_romaji, titleEnglish: r.title_english,
      coverImageUrl: r.cover_image_url, episodeCount: r.episode_count,
      genres: JSON.parse(r.genres), description: r.description, studio: r.studio || null,
    }))
  });
});

// POST /api/watched/add
router.post('/add', requireAuth, async (req, res) => {
  const { anilistId } = req.body;
  if (!anilistId) return res.status(400).json({ error: 'anilistId is required' });

  const existing = db.prepare('SELECT id FROM watched_entries WHERE user_id = ? AND anilist_id = ?').get(req.user.id, anilistId);
  if (existing) return res.status(409).json({ error: 'Already on your watched list' });

  try { await ensureCached(anilistId); } catch (err) { return res.status(502).json({ error: err.message }); }

  const animeRow = db.prepare('SELECT * FROM anime_cache WHERE anilist_id = ?').get(anilistId);
  if (!animeRow) return res.status(404).json({ error: 'Anime not found' });

  db.prepare('INSERT INTO watched_entries (user_id, anilist_id) VALUES (?, ?)').run(req.user.id, anilistId);
  res.status(201).json({ ok: true, addedTitle: animeRow.title_english || animeRow.title_romaji });
});

// DELETE /api/watched/:anilistId
router.delete('/:anilistId', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM watched_entries WHERE user_id = ? AND anilist_id = ?')
    .run(req.user.id, parseInt(req.params.anilistId));
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
