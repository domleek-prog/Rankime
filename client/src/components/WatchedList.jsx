import { useState } from 'react';
import api from '../api/client';

function WatchedCard({ entry, onRemove, onPromote, isRanked, confirmingId, setConfirmingId }) {
  const title = entry.titleEnglish || entry.titleRomaji;
  const genres = (entry.genres || []).slice(0, 3);

  return (
    <div className="flex items-center gap-3 bg-[var(--card)] border border-white/8 rounded-xl p-3 group">
      <div className="shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-white/5">
        {entry.coverImageUrl
          ? <img src={entry.coverImageUrl} alt={title} className="w-full h-full object-cover" />
          : <div className="w-full h-full" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{title}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {genres.map(g => (
            <span key={g} className="text-[11px] bg-white/6 text-white/35 px-1.5 py-0.5 rounded-full">{g}</span>
          ))}
        </div>
        {entry.studio && (
          <p className="text-white/25 text-xs mt-1">{entry.studio}</p>
        )}

        {/* Promote button lives inline under the title */}
        <div className="mt-2">
          {isRanked ? (
            <span className="text-[11px] text-violet-400/70 bg-violet-400/8 border border-violet-400/15 px-2 py-1 rounded-lg">
              🏆 On leaderboard
            </span>
          ) : (
            <button
              onClick={() => onPromote(entry)}
              className="text-[11px] font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-2.5 py-1 rounded-lg transition-all"
            >
              🏆 Add to leaderboard
            </button>
          )}
        </div>
      </div>

      {/* Remove */}
      <div className="shrink-0 self-start pt-1">
        {confirmingId === entry.anilistId ? (
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[11px] text-white/40">Remove?</span>
            <div className="flex gap-1.5">
              <button onClick={() => onRemove(entry.anilistId)} className="text-[11px] bg-red-500/20 text-red-400 border border-red-400/25 px-2 py-1 rounded-lg hover:bg-red-500/30 transition-colors">Yes</button>
              <button onClick={() => setConfirmingId(null)} className="text-[11px] text-white/30 hover:text-white px-2 py-1">No</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingId(entry.anilistId)}
            className="text-white/20 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
            aria-label="Remove from watched"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function WatchedList({ list, setList, leaderboardIds, onPromote }) {
  const [confirmingId, setConfirmingId] = useState(null);

  async function handleRemove(anilistId) {
    try {
      await api.delete(`/watched/${anilistId}`);
      setList(prev => prev.filter(e => e.anilistId !== anilistId));
    } catch {
      // silently fail
    }
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-20 text-white/20">
        <p className="text-5xl mb-4">📺</p>
        <p className="text-base text-white/40 font-medium">Nothing watched yet</p>
        <p className="text-sm mt-2">Search for anime and add them to your watched list</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map(entry => (
        <WatchedCard
          key={entry.anilistId}
          entry={entry}
          onRemove={handleRemove}
          onPromote={onPromote}
          isRanked={leaderboardIds?.has(entry.anilistId)}
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
        />
      ))}
    </div>
  );
}
