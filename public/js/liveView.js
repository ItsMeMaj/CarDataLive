/* Live tab: polls /api/live every 2s, renders hero + grouped metric cards. */

const LiveView = (() => {
  const { GROUP_ORDER, metaFor, fmtValue, parseTs } = window.OBD;

  const dot = document.getElementById('live-dot');
  const speedEl = document.getElementById('live-speed');
  const rpmEl = document.getElementById('live-rpm');
  const statusEl = document.getElementById('live-status');
  const cardsEl = document.getElementById('live-cards');

  let timer = null;
  let lastReading = null;

  function setLive(isLive) {
    dot.classList.toggle('live', isLive);
    document.body.classList.toggle('offline', !isLive);
  }

  // Build grouped cards for every non-null field except hero/identity fields.
  function renderCards(reading) {
    const skip = new Set(['timestamp', 'trip_id', 'speed_kmh', 'rpm']);
    const groups = {};
    for (const [col, val] of Object.entries(reading)) {
      if (skip.has(col)) continue;
      if (val === null || val === undefined) continue;
      const m = metaFor(col);
      (groups[m.group] = groups[m.group] || []).push({ col, val, m });
    }

    const frag = document.createDocumentFragment();
    for (const group of GROUP_ORDER) {
      const items = groups[group];
      if (!items || !items.length) continue;
      const h = document.createElement('div');
      h.className = 'group-heading';
      h.textContent = group;
      frag.appendChild(h);
      for (const { val, m } of items) {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML =
          `<div class="label">${m.label}</div>` +
          `<div class="value">${fmtValue(val)}` +
          (m.unit ? `<span class="unit">${m.unit}</span>` : '') +
          `</div>`;
        frag.appendChild(card);
      }
    }
    cardsEl.innerHTML = '';
    cardsEl.appendChild(frag);
  }

  function renderAgeText(reading, isLive) {
    const ts = parseTs(reading.timestamp);
    if (!ts) { statusEl.textContent = ''; return; }
    const ageSec = Math.max(0, Math.round((Date.now() - ts.getTime()) / 1000));
    if (isLive) {
      statusEl.textContent = `Last update: ${ageSec}s ago`;
    } else {
      statusEl.textContent = `Vehicle offline — last seen ${ageSec}s ago`;
    }
  }

  async function refresh() {
    try {
      const res = await fetch('/api/live');
      if (res.status === 401) { window.location.href = '/login.html'; return; }
      const data = await res.json();

      if (!data.reading) {
        setLive(false);
        speedEl.textContent = '--';
        rpmEl.textContent = '--';
        statusEl.textContent = 'No data yet.';
        cardsEl.innerHTML = '';
        return;
      }

      lastReading = data.reading;
      setLive(data.is_live);
      speedEl.textContent = data.reading.speed_kmh != null ? fmtValue(data.reading.speed_kmh) : '--';
      rpmEl.textContent = data.reading.rpm != null ? fmtValue(data.reading.rpm) : '--';
      renderCards(data.reading);
      renderAgeText(data.reading, data.is_live);
    } catch (err) {
      setLive(false);
      statusEl.textContent = 'Connection error';
    }
  }

  function start() {
    refresh();
    if (timer) clearInterval(timer);
    timer = setInterval(refresh, 2000);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return { start, stop, refresh };
})();
