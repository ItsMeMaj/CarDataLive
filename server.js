const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const { initSchema } = require('./db/connection');
const { requireAuthApi, requireAuthPage } = require('./middleware/auth');

const dataRoutes = require('./routes/data');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

// Never let a stray error take the process down — the logger must keep running.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

const PUBLIC_DIR = path.join(__dirname, 'public');

// --- Unprotected endpoints -------------------------------------------------

// Health check (Android "Test & Connect" button + Railway health checks).
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Ingestion from the Android app (no cookie — not PIN-protected).
app.use('/', dataRoutes);

// Auth (login/logout). The login PAGE itself is a static file served below.
app.use('/', authRoutes);

// Login page + its assets must be reachable without auth.
app.get('/login.html', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'login.html')));

// --- Protected endpoints ---------------------------------------------------

// All API reads require the PIN cookie.
app.use('/api', requireAuthApi, apiRoutes);

// Dashboard entry points require auth, then fall through to static assets.
app.get(['/', '/index.html', '/dashboard'], requireAuthPage, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Static assets (css/js, login page). CSS/JS are not sensitive; the data behind
// them is protected at the API layer.
app.use(express.static(PUBLIC_DIR));

// --- Boot ------------------------------------------------------------------

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initSchema();
    console.log('[db] schema ready');
  } catch (err) {
    // Don't crash: log loudly and start anyway so /health stays green and the
    // table may already exist. Queries will surface errors per-request.
    console.error('[db] schema init failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`OBD2 server listening on port ${PORT}`);
  });
}

start();
