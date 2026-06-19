export default function AnimeCard({ anime, onAdd, status, addLabel = '+ Add' }) {
  const title = anime.titleEnglish || anime.titleRomaji;
  const genres = (anime.genres || []).slice(0, 3);

  return (
    <div className="flex gap-3 rounded-xl p-3 border border-white/8 bg-[var(--card)] hover:border-white/15 transition-colors">
      <div className="shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-white/5">
        {anime.coverImageUrl
          ? <img src={anime.coverImageUrl} alt={title} className="w-full h-full object-cover" />
          : <div className="w-full h-full" />}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{title}</p>
          {anime.titleEnglish && anime.titleRomaji !== anime.titleEnglish && (
            <p className="text-white/25 text-xs mt-0.5 truncate">{anime.titleRomaji}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {genres.map(g => (
              <span key={g} className="text-[11px] bg-white/6 text-white/40 px-1.5 py-0.5 rounded-full">{g}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="shrink-0 flex items-center">
        {status === 'on-list' ? (
          <span className="text-xs text-green-400/80 bg-green-400/10 border border-green-400/20 px-2.5 py-1.5 rounded-lg font-medium">✓ Added</span>
        ) : (
          <button
            onClick={() => onAdd(anime)}
            className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}
