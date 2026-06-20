const express = require('express');
const crypto = require('crypto');
const { COOKIE_NAME, pinHash } = require('../middleware/auth');

const router = express.Router();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// POST /auth/login  { pin: "7429" }
// On a correct PIN, set the auth cookie. Returns JSON for the login page to act on.
router.post('/auth/login', (req, res) => {
  const submitted = req.body && req.body.pin;
  const expected = process.env.DASHBOARD_PIN || '';

  if (!submitted) {
    return res.status(400).json({ error: 'PIN required' });
  }

  // Constant-time compare of the submitted PIN against the configured one.
  const a = Buffer.from(String(submitted));
  const b = Buffer.from(String(expected));
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!ok) {
    return res.status(401).json({ error: 'Incorrect PIN' });
  }

  res.cookie(COOKIE_NAME, pinHash(expected), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS_MS,
  });
  return res.json({ ok: true });
});

// POST /auth/logout — clear the cookie.
router.post('/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
});

module.exports = router;
