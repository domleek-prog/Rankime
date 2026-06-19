const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const TOP_N = 30;

// GET /api/global/top — the Rankime Top 30.
// Each leaderboard slot scores (51 - rank_position): a user's #1 = 50 pts down
// to #50 = 1. Points are summed across all users' leaderboards.
// Note: AniList lists seasons as separate entries, so seasons are ranked
// separately here (a v1 decision — franchise grouping can come later).
router.get('/top', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT re.anilist_id,
           SUM(51 - re.rank_position) AS points,
           COUNT(*) AS list_count,
           ac.title_romaji, ac.title_english, ac.cover_image_url, ac.studio
    FROM ranked_entries re
    JOIN anime_cache ac ON ac.anilist_id = re.anilist_id
    GROUP BY re.anilist_id
    ORDER BY points DESC, list_count DESC, ac.title_romaji ASC
    LIMIT ?
  `).all(TOP_N);

  const list = rows.map((r, i) => ({
    rankPosition: i + 1,
    anilistId: r.anilist_id,
    titleRomaji: r.title_romaji,
    titleEnglish: r.title_english,
    coverImageUrl: r.cover_image_url,
    studio: r.studio || null,
    points: r.points,
    listCount: r.list_count,
  }));

  res.json({ list });
});

module.exports = router;
