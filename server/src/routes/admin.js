const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/admin/stats — single-admin control panel data
router.get('/stats', requireAuth, requireAdmin, (req, res) => {
  const count = sql => db.prepare(sql).get().n;

  const totals = {
    users: count('SELECT COUNT(*) AS n FROM users'),
    rankedEntries: count('SELECT COUNT(*) AS n FROM ranked_entries'),
    watchedEntries: count('SELECT COUNT(*) AS n FROM watched_entries'),
    categoryEntries: count('SELECT COUNT(*) AS n FROM category_entries'),
    cachedAnime: count('SELECT COUNT(*) AS n FROM anime_cache'),
    // Users with at least one ranked entry — a rough "active" proxy
    usersWithList: count('SELECT COUNT(DISTINCT user_id) AS n FROM ranked_entries'),
  };

  const recentUsers = db.prepare(`
    SELECT id, email, display_name, created_at
    FROM users ORDER BY created_at DESC LIMIT 10
  `).all().map(u => ({
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    createdAt: u.created_at,
  }));

  // Most-ranked anime across all users — preview of the Global Leaderboard data
  const topAnime = db.prepare(`
    SELECT re.anilist_id, ac.title_romaji, ac.title_english, ac.cover_image_url,
           COUNT(*) AS list_count
    FROM ranked_entries re
    JOIN anime_cache ac ON ac.anilist_id = re.anilist_id
    GROUP BY re.anilist_id
    ORDER BY list_count DESC, ac.title_romaji ASC
    LIMIT 10
  `).all().map(r => ({
    anilistId: r.anilist_id,
    title: r.title_english || r.title_romaji,
    coverImageUrl: r.cover_image_url,
    listCount: r.list_count,
  }));

  res.json({ totals, recentUsers, topAnime });
});

module.exports = router;
