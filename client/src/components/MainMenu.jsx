import { useState } from 'react';
import api from '../api/client';

function MenuRow({ icon, label, count, max, onClick, onDelete, subtle }) {
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
      {onDelete && (
        <span
          role="button"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-white/15 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0"
          aria-label="Delete category"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11"/>
          </svg>
        </span>
      )}
      <svg className="text-white/15 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4l4 4-4 4"/>
      </svg>
    </button>
  );
}

export default function MainMenu({ leaderboardCount, watchedCount, categories, onNavigate, onCategoriesChange }) {
  const [newCatName, setNewCatName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreating(true);
    try {
      await api.post('/categories', { name: newCatName.trim() });
      setNewCatName('');
      setShowInput(false);
      onCategoriesChange();
    } catch (err) {
      // duplicate name etc — silently ignore, server returns 409
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/categories/${id}`);
    setDeleteConfirm(null);
    onCategoriesChange();
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Intro */}
      <p className="text-white/35 text-sm leading-relaxed px-1">
        <span className="font-bold italic text-white">Rankime</span> allows you to show off your Anime world - Keep track of shows you've watched and create your own ranked list in <span className="text-white/55">My Leaderboard</span>.
      </p>

      {/* My Leaderboard */}
      <section className="flex flex-col gap-2">
        <MenuRow
          icon="🏆"
          label="My Leaderboard"
          count={leaderboardCount}
          max={50}
          onClick={() => onNavigate({ screen: 'leaderboard' })}
        />
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em', fontSize: '0.85rem' }} className="text-white/30 uppercase">Categories</p>

          <button
            onClick={() => setShowInput(v => !v)}
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '0.85rem' }}
            className="text-white/30 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1 transition-colors"
          >
            + New
          </button>
        </div>

        {showInput && (
          <form onSubmit={handleCreate} className="flex gap-2 mb-2">
            <input
              autoFocus
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Category name…"
              maxLength={40}
              className="flex-1 bg-[#0d1424] border border-white/10 focus:border-violet-500/60 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={creating || !newCatName.trim()}
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg disabled:opacity-40 transition-opacity shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              Add
            </button>
          </form>
        )}

        <div className="flex flex-col gap-2">
          {categories.length === 0 && !showInput && (
            <p className="text-sm text-white/20 text-center py-4">No categories yet — create one above</p>
          )}
          {categories.map(cat => (
            deleteConfirm === cat.id ? (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-400/20 bg-[#0d1424]">
                <span className="text-sm text-white/50 flex-1">Delete "{cat.name}"?</span>
                <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-400 border border-red-400/30 bg-red-400/10 px-3 py-1.5 rounded-lg hover:bg-red-400/20 transition-colors">Delete</button>
                <button onClick={() => setDeleteConfirm(null)} className="text-xs text-white/30 hover:text-white px-2 py-1.5">Cancel</button>
              </div>
            ) : (
              <MenuRow
                key={cat.id}
                icon="📋"
                label={cat.name}
                count={cat.entry_count}
                max={50}
                onClick={() => onNavigate({ screen: 'category', categoryId: cat.id, categoryName: cat.name })}
                onDelete={() => setDeleteConfirm(cat.id)}
              />
            )
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
