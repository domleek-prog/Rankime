const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { isAdmin, requireAuth } = require('../middleware/auth');

// Shape a user record for the client, including the admin flag.
function publicUser(u) {
  const email = u.email;
  return {
    id: u.id,
    email,
    displayName: u.display_name ?? u.displayName,
    isAdmin: isAdmin(email),
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, displayName: user.display_name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function setCookie(req, res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    // Secure over HTTPS (Railway/custom domain via trust proxy), but not over
    // plain http://localhost in dev — otherwise the cookie is never stored.
    secure: req.secure,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

router.post('/signup', async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'email, password, and displayName are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)'
  ).run(email.toLowerCase(), hash, displayName.trim());

  const user = { id: result.lastInsertRowid, email: email.toLowerCase(), display_name: displayName.trim() };
  const token = signToken(user);
  setCookie(req, res, token);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signToken(user);
  setCookie(req, res, token);
  res.json({ user: publicUser(user) });
});

router.patch('/profile', async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).json({ error: 'Invalid token' }); }

  const { displayName } = req.body;
  if (!displayName || !displayName.trim()) return res.status(400).json({ error: 'displayName is required' });

  db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName.trim(), payload.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
  const newToken = signToken(user);
  setCookie(req, res, newToken);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// DELETE /api/auth/account — erase the account and all its data (GDPR erasure).
// ON DELETE CASCADE removes the user's ranked/category/watched entries.
router.delete('/account', requireAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: publicUser(payload) });
  } catch {
    res.json({ user: null });
  }
});

module.exports = router;
