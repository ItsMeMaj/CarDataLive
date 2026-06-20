const express = require('express');
const { getPool } = require('../db/connection');
const { isValidColumn } = require('../utils/columnWhitelist');

const router = express.Router();

// Strip keys whose value is null/undefined from a row object (keeps `timestamp`).
function stripNulls(row, keep = ['timestamp']) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (keep.includes(k) || (v !== null && v !== undefined)) {
      out[k] = v;
    }
  }
  return out;
}

// GET /api/trips — all trips, newest first, with aggregate stats.
router.get('/trips', async (req, res) => {
  try {
    const [rows] = await getPool().query(
      `SELECT
         trip_id,
         MIN(timestamp) AS start_time,
         MAX(timestamp) AS end_time,
         TIMESTAMPDIFF(SECOND, MIN(timestamp), MAX(timestamp)) AS duration_seconds,
         COUNT(*) AS reading_count,
         ROUND(AVG(speed_kmh), 1) AS avg_speed_kmh,
         MAX(speed_kmh) AS max_speed_kmh,
         ROUND(AVG(rpm), 1) AS avg_rpm,
         ROUND(AVG(fuel_rate_lph), 2) AS avg_fuel_rate_lph,
         ROUND(SUM(speed_kmh) / 3600, 2) AS distance_km
       FROM readings
       GROUP BY trip_id
       ORDER BY start_time DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[GET /api/trips] error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/trips/:tripId — full time-series for one trip.
// Optional ?fields=rpm,speed_kmh limits the returned columns.
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const fieldsParam = req.query.fields;

    let selectCols;
    let explicitFields = false;
    if (fieldsParam) {
      const requested = String(fieldsParam)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== 'timestamp' && isValidColumn(s));
      selectCols = ['timestamp', ...requested];
      explicitFields = true;
    } else {
      selectCols = ['*'];
    }

    const colList = selectCols.map((c) => (c === '*' ? '*' : `\`${c}\``)).join(', ');
    const [rows] = await getPool().query(
      `SELECT ${colList} FROM readings WHERE trip_id = ? ORDER BY timestamp ASC`,
      [tripId]
    );

    // When no explicit field list, drop null-only keys per row to keep payload lean.
    const readings = explicitFields ? rows : rows.map((r) => stripNulls(r));

    return res.json({ trip_id: tripId, readings });
  } catch (err) {
    console.error('[GET /api/trips/:tripId] error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/live — most recent reading + liveness flag.
router.get('/live', async (req, res) => {
  try {
    const [rows] = await getPool().query(
      `SELECT * FROM readings ORDER BY timestamp DESC, id DESC LIMIT 1`
    );
    if (rows.length === 0) {
      return res.json({ is_live: false, reading: null });
    }
    const reading = stripNulls(rows[0], ['timestamp', 'trip_id']);
    // Stored as UTC "YYYY-MM-DD HH:MM:SS.mmm"; normalise to ISO for Date parsing.
    const isoTs = String(rows[0].timestamp).replace(' ', 'T') + 'Z';
    const ageMs = Date.now() - new Date(isoTs).getTime();
    return res.json({ is_live: ageMs < 10000, reading });
  } catch (err) {
    console.error('[GET /api/live] error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/stats — overall statistics across all trips.
router.get('/stats', async (req, res) => {
  try {
    const [[overall]] = await getPool().query(
      `SELECT
         COUNT(*) AS total_readings,
         COUNT(DISTINCT trip_id) AS total_trips,
         ROUND(AVG(fuel_rate_lph), 2) AS avg_fuel_rate_lph,
         ROUND(AVG(speed_kmh), 1) AS avg_speed_kmh,
         MIN(timestamp) AS first_reading,
         MAX(timestamp) AS last_reading,
         ROUND(SUM(speed_kmh) / 3600, 1) AS total_distance_km
       FROM readings`
    );

    // Driving time = sum of per-trip (max - min) durations.
    const [[{ total_driving_seconds }]] = await getPool().query(
      `SELECT COALESCE(SUM(dur), 0) AS total_driving_seconds FROM (
         SELECT TIMESTAMPDIFF(SECOND, MIN(timestamp), MAX(timestamp)) AS dur
         FROM readings GROUP BY trip_id
       ) t`
    );

    return res.json({
      total_trips: overall.total_trips || 0,
      total_readings: overall.total_readings || 0,
      total_driving_time_hours: Math.round((total_driving_seconds / 3600) * 10) / 10,
      total_distance_km: overall.total_distance_km || 0,
      avg_fuel_rate_lph: overall.avg_fuel_rate_lph,
      avg_speed_kmh: overall.avg_speed_kmh,
      first_reading: overall.first_reading,
      last_reading: overall.last_reading,
    });
  } catch (err) {
    console.error('[GET /api/stats] error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
