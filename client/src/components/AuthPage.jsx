import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LegalContent from './LegalContent';

export default function AuthPage() {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null); // 'privacy' | 'terms' | null

  if (legalDoc) {
    return (
      <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
        <header className="sticky top-0 z-10 backdrop-blur-md border-b border-white/8 px-4 py-3 flex items-center gap-3" style={{ background: 'var(--header)' }}>
          <button onClick={() => setLegalDoc(null)} className="text-white/40 hover:text-white transition-colors p-1 -ml-1" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l-6 6 6 6"/></svg>
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.04em' }} className="text-white">
            {legalDoc === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </h1>
        </header>
        <main className="flex-1 p-4"><LegalContent doc={legalDoc} /></main>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(email.trim(), password, displayName.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/image-1781693654917.webp" alt="Rankime logo" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', letterSpacing: '0.05em', lineHeight: 1 }}>
              <span className="text-white">RANK</span><span style={{ display: 'inline-block', background: 'linear-gradient(90deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>IME</span>
            </h1>
          </div>
          <p className="text-white/30 text-sm">Your personal anime leaderboard</p>
        </div>

        <div className="rounded-2xl p-6 border border-white/8" style={{ background: 'var(--card)' }}>
          {/* Tabs */}
          <div className="flex mb-6 rounded-lg p-1" style={{ background: 'var(--input)' }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === m
                    ? 'text-white'
                    : 'text-white/30 hover:text-white/60'
                }`}
                style={mode === m ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  placeholder="Anime Fan"
                  className="w-full border border-white/8 rounded-lg px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 transition-colors"
                  style={{ background: 'var(--input)' }}
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[var(--input)] border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full bg-[var(--input)] border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-center text-xs text-white/30 mt-4 leading-relaxed">
              By creating an account you agree to our{' '}
              <button type="button" onClick={() => setLegalDoc('terms')} className="text-violet-300/80 hover:text-violet-300 underline">Terms</button>{' '}
              and{' '}
              <button type="button" onClick={() => setLegalDoc('privacy')} className="text-violet-300/80 hover:text-violet-300 underline">Privacy Policy</button>.
            </p>
          )}

          <p className="text-center text-xs text-gray-600 mt-4">
            Known gaps: email verification and password reset not yet implemented.
          </p>
        </div>

        {/* Footer legal links */}
        <div className="flex items-center justify-center gap-4 text-xs mt-6">
          <button onClick={() => setLegalDoc('privacy')} className="text-white/25 hover:text-white/50 transition-colors">Privacy Policy</button>
          <span className="text-white/15">·</span>
          <button onClick={() => setLegalDoc('terms')} className="text-white/25 hover:text-white/50 transition-colors">Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
