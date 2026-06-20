const { v4: uuidv4 } = require('uuid');

// Trip detection. The Android app does not send a trip_id — the server assigns
// one. A gap of more than GAP_MS between consecutive POSTs starts a new trip.
// State lives in memory only: a server restart creates a natural gap, which is
// the desired behaviour (a restart ends the trip).

const GAP_MS = 120 * 1000; // 120 seconds

let currentTripId = null;
let lastReceivedAt = 0; // epoch ms of the previous accepted reading

// Returns the trip_id this reading belongs to, given the reading's own time.
// `readingTimeMs` is the epoch-ms of the incoming reading's timestamp.
function resolveTripId(readingTimeMs = Date.now()) {
  const now = readingTimeMs;
  if (currentTripId === null || now - lastReceivedAt > GAP_MS) {
    currentTripId = uuidv4();
  }
  lastReceivedAt = now;
  return currentTripId;
}

function getCurrentTripId() {
  return currentTripId;
}

module.exports = { resolveTripId, getCurrentTripId, GAP_MS };
