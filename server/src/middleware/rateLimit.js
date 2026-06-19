const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Behind Cloudflare + Railway, req.ip is a proxy address. Cloudflare sets the
// real client IP in CF-Connecting-IP (and strips any client-supplied copy),
// so it's a trustworthy key. Fall back to req.ip for local/dev requests.
// ipKeyGenerator normalizes IPv6 addresses so v6 clients can't dodge limits.
const clientKey = (req /*, res */) => ipKeyGenerator(req.headers['cf-connecting-ip'] || req.ip);

const common = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
};

// Strict limit for auth: blunts password brute-forcing / signup spam.
const authLimiter = rateLimit({
  ...common,
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

// Protects our AniList proxy so we don't get the server IP rate-limited/banned.
const searchLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Searching too fast — please slow down a moment.' },
});

// Broad safety net for everything else.
const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  message: { error: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, searchLimiter, apiLimiter };
