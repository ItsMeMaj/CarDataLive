const express = require('express');
const { getPool } = require('../db/connection');
const { isDataColumn } = require('../utils/columnWhitelist');
const { resolveTripId } = require('../utils/tripManager');

const router = express.Router();

// Convert an ISO timestamp string into MySQL DATETIME(3) format in UTC:
// "YYYY-MM-DD HH:MM:SS.mmm". Returns null if the input is not a valid date.
function toMysqlDatetime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 23).replace('T', ' ');
}

// POST /data — receive one OBD2 reading packet from the Android app.
router.post('/data', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Missing or invalid timestamp' });
    }

    const mysqlTs = toMysqlDatetime(body.timestamp);
    if (!body.timestamp || mysqlTs === null) {
      return res.status(400).json({ error: 'Missing or invalid timestamp' });
    }

    const tripId = resolveTripId(new Date(body.timestamp).getTime());

    // Build the dynamic column list from whitelisted keys only.
    const columns = ['timestamp', 'trip_id'];
    const values = [mysqlTs, tripId];

    for (const key of Object.keys(body)) {
      if (key === 'timestamp' || key === 'trip_id') continue;
      if (!isDataColumn(key)) continue; // ignore unknown keys
      let val = body[key];
      if (val === undefined) continue;
      // Empty string -> NULL so we don't fail numeric column inserts.
      if (val === '') val = null;
      columns.push(key);
      values.push(val);
    }

    const placeholders = columns.map(() => '?').join(', ');
    const colList = columns.map((c) => `\`${c}\``).join(', ');
    const sql = `INSERT INTO readings (${colList}) VALUES (${placeholders})`;

    await getPool().execute(sql, values);

    return res.json({ received: true });
  } catch (err) {
    console.error('[POST /data] error:', err.message);
    return res.status(400).json({ error: 'Failed to store reading' });
  }
});

module.exports = router;
