const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, displayName: user.display_name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function setCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // secure: true  — enable when serving over HTTPS
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
  setCookie(res, token);
  res.status(201).json({ user: { id: user.id, email: user.email, displayName: user.display_name } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signToken(user);
  setCookie(res, token);
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name } });
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
  setCookie(res, newToken);
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: { id: payload.id, email: payload.email, displayName: payload.displayName } });
  } catch {
    res.json({ user: null });
  }
});

module.exports = router;
