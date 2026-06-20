const crypto = require('crypto');

// Cookie-based PIN authentication. The expected cookie value is the sha256 hex
// of DASHBOARD_PIN. Middleware protects the dashboard page and all /api/* routes.
// POST /data and GET /health are intentionally left unprotected.

const COOKIE_NAME = 'obd2_auth';

function pinHash(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

function expectedHash() {
  const pin = process.env.DASHBOARD_PIN || '';
  return pinHash(pin);
}

// Constant-time-ish comparison of cookie value against the expected hash.
function isAuthed(req) {
  const cookie = req.cookies && req.cookies[COOKIE_NAME];
  if (!cookie) return false;
  const expected = expectedHash();
  const a = Buffer.from(cookie);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Guard for API routes: respond 401 JSON when not authed.
function requireAuthApi(req, res, next) {
  if (isAuthed(req)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Guard for the dashboard page: redirect to the PIN entry screen.
function requireAuthPage(req, res, next) {
  if (isAuthed(req)) return next();
  return res.redirect('/login.html');
}

module.exports = {
  COOKIE_NAME,
  pinHash,
  expectedHash,
  isAuthed,
  requireAuthApi,
  requireAuthPage,
};
