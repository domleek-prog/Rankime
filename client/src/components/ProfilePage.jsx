import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function ProfilePage({ onBack, onOpenAdmin }) {
  const { user, logout, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.delete('/auth/account');
      setUser(null); // logs out — back to the auth screen
    } catch {
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const initials = (user?.displayName || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  async function handleSave(e) {
    e.preventDefault();
    if (displayName.trim() === user?.displayName) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const r = await api.patch('/auth/profile', { displayName: displayName.trim() });
      setUser(r.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-2 border-violet-500/40"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', background: 'linear-gradient(135deg,#4c1d95,#312e81)' }}
        >
          {initials}
        </div>
        <p className="text-white/40 text-sm">{user?.email}</p>
      </div>

      {/* Edit display name */}
      <div className="bg-[#0d1424] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
        <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '1rem' }} className="text-white/50 uppercase">Display name</p>
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <input
            type="text"
            value={displayName}
            onChange={e => { setDisplayName(e.target.value); setSaved(false); }}
            maxLength={32}
            className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/60 transition-colors"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving || displayName.trim() === user?.displayName || !displayName.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-[#0d1424] border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
        <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '1rem' }} className="text-white/50 uppercase">Account</p>
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/30">Email</span>
          <span className="text-white/60">{user?.email}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/30">Password reset</span>
          <span className="text-white/20 text-xs">Not yet available</span>
        </div>
      </div>

      {/* Admin — only visible to the admin account */}
      {user?.isAdmin && (
        <button
          onClick={onOpenAdmin}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <span className="text-base">🛠️</span>
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }} className="text-violet-200 text-sm">Admin panel</span>
          </span>
          <svg className="text-violet-300/40" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4l4 4-4 4"/>
          </svg>
        </button>
      )}

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-xl text-sm font-semibold text-red-400 border border-red-400/20 hover:bg-red-400/8 transition-colors"
      >
        Log out
      </button>

      {/* Danger zone — delete account */}
      <div className="mt-2 pt-5 border-t border-white/5 flex flex-col gap-3">
        <p style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: '0.8rem' }} className="text-white/25 uppercase">Danger zone</p>
        {confirmDelete ? (
          <div className="flex flex-col gap-3 bg-red-500/5 border border-red-400/20 rounded-2xl p-4">
            <p className="text-sm text-white/60">
              This permanently deletes your account and all your lists, categories, and watched shows. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete everything'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setError(''); setConfirmDelete(true); }}
            className="w-full py-3 rounded-xl text-sm font-medium text-white/40 border border-white/8 hover:border-red-400/30 hover:text-red-400 transition-colors"
          >
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}
