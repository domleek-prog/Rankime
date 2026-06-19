// The fixed set of categories every user gets. Defined in code (not the DB)
// so the list is identical for everyone and can be versioned with the app.
// `key` is the stable slug used in URLs and stored on category_entries.
const FIXED_CATEGORIES = [
  { key: 'action', name: 'Action' },
  { key: 'adventure', name: 'Adventure' },
  { key: 'comedy', name: 'Comedy' },
  { key: 'romance', name: 'Romance' },
  { key: 'fantasy', name: 'Fantasy' },
  { key: 'sci-fi', name: 'Sci-Fi' },
  { key: 'slice-of-life', name: 'Slice of Life' },
  { key: 'sports', name: 'Sports' },
  { key: 'drama', name: 'Drama' },
  { key: 'supernatural', name: 'Supernatural' },
];

const CATEGORY_KEYS = new Set(FIXED_CATEGORIES.map(c => c.key));

module.exports = { FIXED_CATEGORIES, CATEGORY_KEYS };
