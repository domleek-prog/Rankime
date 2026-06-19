import { useState, useEffect } from 'react';
import api from '../api/client';

function StatCard({ label, value }) {
  return (
    <div className="bg-[#0d1424] border border-white/8 rounded-2xl p-4 flex flex-col gap-1">
      <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }} className="text-2xl text-white">
        {value}
      </span>
      <span className="text-white/35 text-xs uppercase tracking-wider">{label}</span>
    </div>
  );
}

function timeAgo(unixSeconds) {
  const s = Math.floor(Date.now() / 1000) - unixSeconds;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load stats'));
  }, []);

  if (error) {
    return <p className="text-red-400 text-sm text-center py-12">{error}</p>;
  }

  if (!data) {
    return <p className="text-white/20 text-sm text-center py-12 animate-pulse">Loading…</p>;
  }

  const { totals, recentUsers, topAnime } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Registered users" value={totals.users} />
        <StatCard label="Users with a list" value={totals.usersWithList} />
        <StatCard label="Ranked entries" value={totals.rankedEntries} />
        <StatCard label="Watched entries" value={totals.watchedEntries} />
        <StatCard label="Categories" value={totals.categories} />
        <StatCard label="Cached anime" value={totals.cachedAnime} />
      </div>

      {/* Recent signups */}
      <section className="flex flex-col gap-2">
        <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em', fontSize: '0.85rem' }} className="text-white/30 uppercase px-1">Recent signups</p>
        <div className="bg-[#0d1424] border border-white/8 rounded-2xl divide-y divide-white/5">
          {recentUsers.length === 0 && <p className="text-white/20 text-sm text-center py-6">No users yet</p>}
          {recentUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-white text-sm truncate">{u.displayName}</p>
                <p className="text-white/30 text-xs truncate">{u.email}</p>
              </div>
              <span className="text-white/25 text-xs shrink-0">{timeAgo(u.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Most-ranked anime */}
      <section className="flex flex-col gap-2">
        <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.12em', fontSize: '0.85rem' }} className="text-white/30 uppercase px-1">Most-ranked anime</p>
        <div className="bg-[#0d1424] border border-white/8 rounded-2xl divide-y divide-white/5">
          {topAnime.length === 0 && <p className="text-white/20 text-sm text-center py-6">No data yet</p>}
          {topAnime.map((a, i) => (
            <div key={a.anilistId} className="flex items-center gap-3 px-4 py-2.5">
              <span style={{ fontFamily: 'var(--font-display)' }} className="text-white/30 text-sm w-5 shrink-0">{i + 1}</span>
              <div className="w-8 h-11 rounded overflow-hidden bg-white/5 shrink-0">
                {a.coverImageUrl && <img src={a.coverImageUrl} alt={a.title} className="w-full h-full object-cover" />}
              </div>
              <p className="text-white/80 text-sm flex-1 min-w-0 truncate">{a.title}</p>
              <span className="text-violet-300 text-xs shrink-0">{a.listCount} {a.listCount === 1 ? 'list' : 'lists'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
