const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Options we always want, regardless of how the connection is configured.
const BASE_OPTS = {
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  // Keep DATETIME(3) values as strings out of MySQL so we control formatting,
  // and return decimals as numbers for clean JSON.
  dateStrings: true,
  decimalNumbers: true,
};

// Parse a mysql:// connection string into an explicit options object. We do NOT
// hand the raw string (or a { uri } object) to mysql2: createPool ignores a
// `uri` key in a config object, which silently falls back to localhost. Parsing
// ourselves lets us merge BASE_OPTS reliably.
function parseConnectionUrl(urlStr) {
  const u = new URL(urlStr);
  return {
    host: decodeURIComponent(u.hostname),
    port: u.port ? parseInt(u.port, 10) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')),
  };
}

// Build a connection pool. Prefer a connection string (Railway's MySQL plugin
// exposes DATABASE_URL / MYSQL_URL); otherwise fall back to individual vars.
// Support both MYSQL_HOST (this app's convention) and MYSQLHOST (Railway's).
function buildPoolConfig() {
  const connStr = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (connStr) {
    return { ...parseConnectionUrl(connStr), ...BASE_OPTS };
  }

  const env = process.env;
  return {
    host: env.MYSQL_HOST || env.MYSQLHOST || 'localhost',
    port: parseInt(env.MYSQL_PORT || env.MYSQLPORT || '3306', 10),
    user: env.MYSQL_USER || env.MYSQLUSER || 'root',
    password: env.MYSQL_PASSWORD || env.MYSQLPASSWORD || '',
    database: env.MYSQL_DATABASE || env.MYSQLDATABASE || 'obd2logger',
    ...BASE_OPTS,
  };
}

const pool = mysql.createPool(buildPoolConfig());

// Run the schema so the table exists on a fresh Railway deploy. No migrations.
async function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  // schema.sql contains a single CREATE TABLE IF NOT EXISTS statement.
  await pool.query(schema);
}

module.exports = { pool, initSchema };
