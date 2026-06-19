import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import MainMenu from './MainMenu';
import RankedList from './RankedList';
import WatchedList from './WatchedList';
import SearchPanel from './SearchPanel';
import ProfilePage from './ProfilePage';
import AdminPage from './AdminPage';
import Toast from './Toast';

const MAX_LIST = 50;
const MAX_CATEGORY = 25;

export default function MainApp() {
  const { user } = useAuth();

  // nav: { screen: 'menu'|'leaderboard'|'category'|'watched'|'search', categoryId?, categoryName?, searchFrom? }
  const [nav, setNav] = useState({ screen: 'menu' });

  const [leaderboard, setLeaderboard] = useState([]);
  const [watched, setWatched] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryList, setCategoryList] = useState([]); // entries for active category
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = msg => setToast(msg);

  const loadLeaderboard = useCallback(() =>
    api.get('/list').then(r => setLeaderboard(r.data.list)), []);

  const loadWatched = useCallback(() =>
    api.get('/watched').then(r => setWatched(r.data.list)), []);

  const loadCategories = useCallback(() =>
    api.get('/categories').then(r => setCategories(r.data.categories)), []);

  const loadCategoryEntries = useCallback((id) =>
    api.get(`/categories/${id}/entries`).then(r => setCategoryList(r.data.list)), []);

  // Initial load
  useEffect(() => {
    Promise.all([loadLeaderboard(), loadWatched(), loadCategories()])
      .finally(() => setLoading(false));
  }, [loadLeaderboard, loadWatched, loadCategories]);

  // Load category entries when navigating into a category
  useEffect(() => {
    if (nav.screen === 'category' && nav.categoryId) {
      setCategoryList([]);
      loadCategoryEntries(nav.categoryId);
    }
  }, [nav, loadCategoryEntries]);

  const leaderboardIds = new Set(leaderboard.map(e => e.anilistId));
  const watchedIds = new Set(watched.map(e => e.anilistId));
  const categoryIds = new Set(categoryList.map(e => e.anilistId));

  // Determine which IDs are "on list" for current search context
  function getSearchMode() {
    if (nav.searchFrom === 'watched') return 'watched';
    if (nav.searchFrom === 'category') return 'category';
    return 'leaderboard';
  }

  async function handleAddToLeaderboard(anime) {
    try {
      const r = await api.post('/list/add', { anilistId: anime.anilistId });
      if (r.data.removedShow) {
        showToast(`Added "${r.data.addedTitle}" — removed "${r.data.removedShow.title}" (${MAX_LIST} max).`);
      }
      loadLeaderboard();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add anime');
    }
  }

  async function handleAddToWatched(anime) {
    try {
      await api.post('/watched/add', { anilistId: anime.anilistId });
      loadWatched();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add to watched');
    }
  }

  async function handleAddToCategory(anime) {
    if (!nav.categoryId) return;
    try {
      const r = await api.post(`/categories/${nav.categoryId}/add`, { anilistId: anime.anilistId });
      if (r.data.removedShow) {
        showToast(`Added "${r.data.addedTitle}" — removed "${r.data.removedShow.title}" (${MAX_CATEGORY} max).`);
      }
      loadCategoryEntries(nav.categoryId);
      loadCategories();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add anime');
    }
  }

  async function handleRemoveFromLeaderboard(anilistId) {
    await api.delete(`/list/${anilistId}`);
    setLeaderboard(prev => prev.filter(e => e.anilistId !== anilistId).map((e, i) => ({ ...e, rankPosition: i + 1 })));
    loadCategories();
  }

  async function handleRemoveFromCategory(anilistId) {
    await api.delete(`/categories/${nav.categoryId}/entries/${anilistId}`);
    setCategoryList(prev => prev.filter(e => e.anilistId !== anilistId).map((e, i) => ({ ...e, rankPosition: i + 1 })));
    loadCategories();
  }

  function getTitle() {
    if (nav.screen === 'menu') return null;
    if (nav.screen === 'leaderboard') return 'My Rankime Leaderboard';
    if (nav.screen === 'watched') return 'My Watched List';
    if (nav.screen === 'category') return nav.categoryName;
    if (nav.screen === 'profile') return 'Profile';
    if (nav.screen === 'admin') return 'Admin';
    if (nav.screen === 'search') {
      if (nav.searchFrom === 'watched') return 'Mark as Watched';
      if (nav.searchFrom === 'category') return `Add to ${nav.categoryName}`;
      return 'Rank Anime';
    }
    return null;
  }

  function getSearchAddHandler() {
    if (nav.searchFrom === 'watched') return handleAddToWatched;
    if (nav.searchFrom === 'category') return handleAddToCategory;
    return handleAddToLeaderboard;
  }

  function handleNavigate(target) {
    // Called from MainMenu — handles both screen nav and direct search entry points
    if (target.screen === 'search') {
      setNav({ ...target, prev: { screen: 'menu' } });
    } else {
      setNav(target);
    }
  }

  function handleSearchOpen() {
    const screen = nav.screen;
    if (screen === 'watched') setNav({ ...nav, prev: nav, screen: 'search', searchFrom: 'watched' });
    else if (screen === 'category') setNav({ ...nav, prev: nav, screen: 'search', searchFrom: 'category' });
    else setNav({ ...nav, prev: nav, screen: 'search', searchFrom: 'leaderboard' });
  }

  function handleBack() {
    if (nav.screen === 'search') {
      setNav(nav.prev || { screen: 'menu' });
    } else {
      setNav({ screen: 'menu' });
    }
  }

  const isMenu = nav.screen === 'menu';

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#080d1a' }}>
        <div className="text-white/20 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto" style={{ background: '#080d1a' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md border-b border-white/8 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(8,13,26,0.92)' }}>
        {!isMenu && (
          <button onClick={handleBack} className="text-white/40 hover:text-white transition-colors p-1 -ml-1 shrink-0" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4l-6 6 6 6"/>
            </svg>
          </button>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isMenu && <img src="/image-1781693654917.webp" alt="Rankime logo" className="shrink-0 rounded-md" style={{ width: 32, height: 32, objectFit: 'cover' }} />}
          {isMenu ? (
            <div className="flex flex-col justify-center">
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', letterSpacing: '0.05em', lineHeight: 1, margin: 0 }}>
                <span className="text-white">RANK</span><span style={{ display: 'inline-block', background: 'linear-gradient(90deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>IME</span>
              </h1>
              <p className="text-white/30 text-[11px] tracking-widest mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>Build. Rank. Share.</p>
            </div>
          ) : (
            <h1 className="text-lg font-bold tracking-tight truncate">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.04em', lineHeight: 1 }} className="text-white">{getTitle()}</span>
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Add button on list/category screens */}
          {(nav.screen === 'leaderboard' || nav.screen === 'category' || nav.screen === 'watched') && (
            <button
              onClick={handleSearchOpen}
              className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              + Add
            </button>
          )}
          {/* Avatar — always visible, opens profile */}
          {nav.screen !== 'profile' && (
            <button
              onClick={() => setNav({ screen: 'profile' })}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs border border-violet-500/30 hover:border-violet-500/60 transition-colors shrink-0"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em', background: 'linear-gradient(135deg,#4c1d95,#312e81)' }}
              aria-label="Profile"
            >
              {(user?.displayName || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        {nav.screen === 'menu' && (
          <MainMenu
            leaderboardCount={leaderboard.length}
            watchedCount={watched.length}
            categories={categories}
            onNavigate={handleNavigate}
          />
        )}

        {nav.screen === 'leaderboard' && (
          <RankedList
            list={leaderboard}
            setList={setLeaderboard}
            onRemove={handleRemoveFromLeaderboard}
          />
        )}

        {nav.screen === 'category' && (
          <RankedList
            list={categoryList}
            setList={setCategoryList}
            onRemove={handleRemoveFromCategory}
            reorderEndpoint={`/categories/${nav.categoryId}/reorder`}
          />
        )}

        {nav.screen === 'watched' && (
          <WatchedList
            list={watched}
            setList={setWatched}
            leaderboardIds={leaderboardIds}
            onPromote={async (anime) => {
              try {
                const r = await api.post('/list/add', { anilistId: anime.anilistId });
                if (r.data.removedShow) {
                  showToast(`Added "${r.data.addedTitle}" — removed "${r.data.removedShow.title}" (${MAX_LIST} max).`);
                } else {
                  showToast(`"${r.data.addedTitle}" added to your leaderboard.`);
                }
                loadLeaderboard();
              } catch (err) {
                showToast(err.response?.data?.error || 'Failed to add to leaderboard');
              }
            }}
          />
        )}

        {nav.screen === 'search' && (
          <SearchPanel
            mode={getSearchMode()}
            leaderboardIds={leaderboardIds}
            watchedIds={watchedIds}
            categoryIds={categoryIds}
            onAdd={getSearchAddHandler()}
          />
        )}

        {nav.screen === 'profile' && (
          <ProfilePage onBack={handleBack} onOpenAdmin={() => setNav({ screen: 'admin' })} />
        )}

        {nav.screen === 'admin' && <AdminPage />}
      </main>

      <Toast message={toast} onDismiss={() => setToast('')} />
    </div>
  );
}
