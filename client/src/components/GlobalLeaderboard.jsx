import { useState, useEffect } from 'react';
import api from '../api/client';

const MEDAL = {
  1: { label: '🥇', border: 'border-yellow-400/60', glow: 'shadow-yellow-500/10' },
  2: { label: '🥈', border: 'border-slate-400/50', glow: 'shadow-slate-400/10' },
  3: { label: '🥉', border: 'border-orange-400/50', glow: 'shadow-orange-400/10' },
};

function rankAccent(pos) {
  // violet (#8b5cf6) at #1 → indigo (#6366f1) at #30
  const t = Math.min((pos - 1) / 29, 1);
  const r = Math.round(139 + (99 - 139) * t);
  const g = Math.round(92 + (102 - 92) * t);
  const b = Math.round(246 + (241 - 246) * t);
  return `rgb(${r},${g},${b})`;
}

function Row({ entry }) {
  const pos = entry.rankPosition;
  const medal = MEDAL[pos];
  const title = entry.titleEnglish || entry.titleRomaji;
  const accent = rankAccent(pos);

  return (
    <div className={`relative flex items-center gap-0 rounded-xl overflow-hidden border ${medal ? `${medal.border} shadow-lg ${medal.glow}` : 'border-white/8'} bg-[var(--card)] select-none`}>
      <div className="shrink-0 w-1 self-stretch" style={{ background: accent }} />

      <div className="shrink-0 w-9 flex flex-col items-center justify-center py-4 gap-0.5">
        {medal ? (
          <>
            <span className="text-lg leading-none">{medal.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)' }}>#{pos}</span>
          </>
        ) : (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.05em', color: accent }}>{pos}</span>
        )}
      </div>

      <div className="shrink-0 w-14 h-20 overflow-hidden bg-white/5 rounded-lg my-3">
        {entry.coverImageUrl
          ? <img src={entry.coverImageUrl} alt={title} className="w-full h-full object-cover" />
          : <div className="w-full h-full" />}
      </div>

      <div className="flex-1 min-w-0 px-3 py-3">
        <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{title}</p>
        {entry.studio && <p className="text-white/25 text-xs mt-1">{entry.studio}</p>}
        <p className="text-white/30 text-[11px] mt-1">On {entry.listCount} {entry.listCount === 1 ? 'list' : 'lists'}</p>
      </div>

      <div className="shrink-0 pr-4 flex flex-col items-end">
        <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', color: accent }} className="text-lg leading-none">{entry.points.toLocaleString()}</span>
        <span className="text-white/25 text-[10px] uppercase tracking-wider mt-0.5">pts</span>
      </div>
    </div>
  );
}

export default function GlobalLeaderboard() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/global/top')
      .then(r => setList(r.data.list))
      .catch(() => setError('Could not load the leaderboard.'));
  }, []);

  if (error) return <p className="text-red-400 text-sm text-center py-12">{error}</p>;
  if (!list) return <p className="text-white/20 text-sm text-center py-12 animate-pulse">Loading…</p>;

  if (list.length === 0) {
    return (
      <div className="text-center py-20 text-white/20">
        <p className="text-5xl mb-4">🌐</p>
        <p className="text-base text-white/40 font-medium">No rankings yet</p>
        <p className="text-sm mt-2">As people build their leaderboards, the Top 30 fills in here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-white/35 text-xs leading-relaxed px-1 mb-1">
        The community's favourites — every Rankime leaderboard contributes points by ranking position. Seasons are counted separately.
      </p>
      {list.map(entry => <Row key={entry.anilistId} entry={entry} />)}
    </div>
  );
}
