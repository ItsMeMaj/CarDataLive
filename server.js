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

const SCHEMA_INIT_RETRIES = 10;
const SCHEMA_INIT_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function start() {
  // Railway's MySQL internal hostname can take a few seconds to resolve after the
  // process starts. Retry schema init a handful of times before giving up.
  for (let attempt = 1; attempt <= SCHEMA_INIT_RETRIES; attempt++) {
    try {
      await initSchema();
      console.log('[db] schema ready');
      break;
    } catch (err) {
      // Don't crash: log loudly and start anyway so /health stays green and the
      // table may already exist. Queries will surface errors per-request.
      // Log code/errno/sqlMessage too — some driver errors have an empty message.
      console.error(`[db] schema init failed (attempt ${attempt}/${SCHEMA_INIT_RETRIES}):`, {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        address: err.address,
        port: err.port,
      });
      if (attempt < SCHEMA_INIT_RETRIES) {
        await sleep(SCHEMA_INIT_DELAY_MS);
      } else {
        console.error('[db] schema init giving up after all retries; starting server anyway');
      }
    }
  }

  app.listen(PORT, () => {
    console.log(`OBD2 server listening on port ${PORT}`);
  });
}

start();
