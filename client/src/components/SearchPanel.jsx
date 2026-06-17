import { useState, useEffect } from 'react';
import api from '../api/client';
import AnimeCard from './AnimeCard';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// mode: 'leaderboard' | 'category' | 'watched'
export default function SearchPanel({ leaderboardIds, watchedIds, categoryIds, onAdd, mode = 'leaderboard' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setLoading(true);
    setError('');
    api.get('/search', { params: { q: debouncedQuery } })
      .then(r => setResults(r.data.results))
      .catch(() => setError('Search failed. Try again.'))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  function getStatus(anime) {
    if (mode === 'leaderboard') return leaderboardIds?.has(anime.anilistId) ? 'on-list' : null;
    if (mode === 'category') return categoryIds?.has(anime.anilistId) ? 'on-list' : null;
    if (mode === 'watched') return watchedIds?.has(anime.anilistId) ? 'on-list' : null;
    return null;
  }

  const addLabel = mode === 'watched' ? '+ Watched' : '+ Add';

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">🔍</span>
        <input
          autoFocus
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search anime…"
          className="w-full bg-[#0d1424] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 transition-colors"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 text-xs animate-pulse">searching…</span>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100dvh-260px)]">
        {results.map(anime => (
          <AnimeCard
            key={anime.anilistId}
            anime={anime}
            status={getStatus(anime)}
            onAdd={onAdd}
            addLabel={addLabel}
          />
        ))}
        {!loading && query.trim() && results.length === 0 && (
          <p className="text-white/25 text-sm text-center py-8">No results for "{query}"</p>
        )}
        {!query.trim() && (
          <p className="text-white/20 text-sm text-center py-8">Start typing to search</p>
        )}
      </div>
    </div>
  );
}
