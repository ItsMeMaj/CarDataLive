const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Build a connection pool. Prefer DATABASE_URL (Railway sets this for its MySQL
// add-on); otherwise fall back to individual MYSQL_* environment variables.
function buildPoolConfig() {
  const base = {
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    // Keep DATETIME(3) values as strings out of MySQL so we control formatting,
    // and return decimals as numbers for clean JSON.
    dateStrings: true,
    decimalNumbers: true,
  };

  if (process.env.DATABASE_URL) {
    // mysql2 accepts the connection string via the `uri` option alongside others.
    return { uri: process.env.DATABASE_URL, ...base };
  }

  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'obd2logger',
    ...base,
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
