require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const animeRoutes = require('./routes/anime');
const categoryRoutes = require('./routes/categories');
const watchedRoutes = require('./routes/watched');
const adminRoutes = require('./routes/admin');
const { authLimiter, searchLimiter, apiLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the Railway/Cloudflare proxies so req.ip and rate-limit keying work.
app.set('trust proxy', true);

// Allowed browser origins. In dev, requests are same-origin or from the Vite
// dev server; in prod everything is served from the same origin. Extra origins
// can be supplied via ALLOWED_ORIGINS (comma-separated).
const DEFAULT_ORIGINS = [
  'https://rankime.app',
  'https://www.rankime.app',
  'https://rankime.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3001',
];
const allowedOrigins = new Set([
  ...DEFAULT_ORIGINS,
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
]);

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser / same-origin requests (no Origin header) and known origins.
    if (!origin || allowedOrigins.has(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Broad safety net, then tighter limits on the sensitive endpoints.
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/search', searchLimiter);

app.use('/api/auth', authRoutes);
app.use('/api', animeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/watched', watchedRoutes);
app.use('/api/admin', adminRoutes);

// Serve built React app in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Rankime server running on http://localhost:${PORT}`));
