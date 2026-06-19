function MenuRow({ icon, label, count, max, onClick, subtle }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/8 bg-[#0d1424] hover:border-white/15 hover:bg-[#111b30] transition-all group text-left"
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '1.05rem', lineHeight: 1.2 }} className={subtle ? 'text-white/60' : 'text-white'}>{label}</p>
      </div>
      {count !== undefined && (
        <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '0.85rem' }} className="text-white/30 shrink-0">
          {count}{max ? `/${max}` : ''}
        </span>
      )}
      <svg className="text-white/15 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4l4 4-4 4"/>
      </svg>
    </button>
  );
}

export default function MainMenu({ leaderboardCount, watchedCount, categories, onNavigate }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Intro */}
      <p className="text-white/35 text-sm leading-relaxed px-1">
        <span className="font-bold italic text-white">Rankime</span> allows you to show off your Anime world - Keep track of shows you've watched and create your own ranked list in <span className="text-white/55">My Rankime Leaderboard</span>.
      </p>

      {/* My Leaderboard */}
      <section className="flex flex-col gap-2">
        <MenuRow
          icon="🏆"
          label="My Rankime Leaderboard"
          count={leaderboardCount}
          max={50}
          onClick={() => onNavigate({ screen: 'leaderboard' })}
        />
      </section>

      {/* Categories — fixed set, each its own ranked list */}
      <section>
        <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em', fontSize: '0.85rem' }} className="text-white/30 uppercase px-1 mb-2">Categories</p>
        <div className="flex flex-col gap-2">
          {categories.map(cat => (
            <MenuRow
              key={cat.id}
              icon="📋"
              label={cat.name}
              count={cat.entry_count}
              max={25}
              onClick={() => onNavigate({ screen: 'category', categoryId: cat.id, categoryName: cat.name })}
            />
          ))}
        </div>
      </section>

      {/* Watched List */}
      <section>
        <div className="flex flex-col gap-2">
          <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em', fontSize: '0.85rem' }} className="text-white/30 uppercase px-1 mb-0">Watched</p>
          <MenuRow
            icon="📺"
            label="My Watched List"
            count={watchedCount}
            onClick={() => onNavigate({ screen: 'watched' })}
          />
        </div>
      </section>

      {/* Search entry points */}
      <section className="flex flex-col gap-2">
        <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em', fontSize: '0.85rem' }} className="text-white/30 uppercase px-1">Search</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate({ screen: 'search', searchFrom: 'leaderboard' })}
            className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-white/8 bg-[#0d1424] hover:border-violet-500/30 hover:bg-[#111b30] transition-all text-sm"
          >
            <span className="text-xl">🏆</span>
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '0.95rem' }} className="text-white/50">Rank anime</span>
          </button>
          <button
            onClick={() => onNavigate({ screen: 'search', searchFrom: 'watched' })}
            className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-white/8 bg-[#0d1424] hover:border-violet-500/30 hover:bg-[#111b30] transition-all text-sm"
          >
            <span className="text-xl">📺</span>
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '0.95rem' }} className="text-white/50">Mark as watched</span>
          </button>
        </div>
      </section>
    </div>
  );
}
