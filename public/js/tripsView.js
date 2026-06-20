/* Trips tab: list of trips + a detail view with a multi-PID Chart.js line chart. */

const TripsView = (() => {
  const { metaFor, fmtValue, parseTs, SERIES_COLORS, darkLineOptions } = window.OBD;

  const listView = document.getElementById('trips-list-view');
  const detailView = document.getElementById('trip-detail-view');
  const tbody = document.getElementById('trips-tbody');
  const emptyMsg = document.getElementById('trips-empty');
  const backBtn = document.getElementById('trip-back');
  const detailTitle = document.getElementById('trip-detail-title');
  const pickerEl = document.getElementById('field-picker');
  const summaryEl = document.getElementById('trip-summary');
  const canvas = document.getElementById('trip-chart');

  let tripsById = {};
  let chart = null;
  let currentReadings = [];
  let selectedFields = new Set();
  let loaded = false;

  function fmtDuration(sec) {
    if (sec == null) return '–';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}h ${m}m` : (m > 0 ? `${m}m ${s}s` : `${s}s`);
  }

  function showList() {
    detailView.hidden = true;
    listView.hidden = false;
  }
  function showDetail() {
    listView.hidden = true;
    detailView.hidden = false;
  }

  async function load() {
    try {
      const res = await fetch('/api/trips');
      if (res.status === 401) { window.location.href = '/login.html'; return; }
      const trips = await res.json();
      tripsById = {};
      tbody.innerHTML = '';

      if (!trips.length) {
        emptyMsg.hidden = false;
        return;
      }
      emptyMsg.hidden = true;

      for (const t of trips) {
        tripsById[t.trip_id] = t;
        const start = parseTs(t.start_time);
        const tr = document.createElement('tr');
        tr.innerHTML =
          `<td>${start ? start.toLocaleDateString() : '–'}</td>` +
          `<td>${start ? start.toLocaleTimeString() : '–'}</td>` +
          `<td>${fmtDuration(t.duration_seconds)}</td>` +
          `<td>${t.distance_km != null ? fmtValue(t.distance_km) + ' km' : '–'}</td>` +
          `<td>${t.avg_speed_kmh != null ? fmtValue(t.avg_speed_kmh) : '–'}</td>` +
          `<td>${t.max_speed_kmh != null ? fmtValue(t.max_speed_kmh) : '–'}</td>` +
          `<td>${t.avg_rpm != null ? fmtValue(t.avg_rpm) : '–'}</td>` +
          `<td>${t.reading_count}</td>`;
        tr.addEventListener('click', () => openDetail(t.trip_id));
        tbody.appendChild(tr);
      }
      loaded = true;
    } catch (err) {
      emptyMsg.hidden = false;
      emptyMsg.textContent = 'Failed to load trips.';
    }
  }

  async function openDetail(tripId) {
    const trip = tripsById[tripId];
    detailTitle.textContent = trip
      ? `Trip — ${parseTs(trip.start_time).toLocaleString()}`
      : 'Trip detail';
    showDetail();

    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`);
      if (res.status === 401) { window.location.href = '/login.html'; return; }
      const data = await res.json();
      currentReadings = data.readings || [];
      buildPicker(currentReadings);
      renderSummary(trip);
      drawChart();
    } catch (err) {
      detailTitle.textContent = 'Failed to load trip';
    }
  }

  // Find numeric columns present in the readings.
  function numericFields(readings) {
    const set = new Set();
    for (const r of readings) {
      for (const [k, v] of Object.entries(r)) {
        if (k === 'timestamp' || k === 'trip_id') continue;
        if (typeof v === 'number') set.add(k);
      }
    }
    return [...set];
  }

  function buildPicker(readings) {
    const fields = numericFields(readings);
    selectedFields = new Set();
    if (fields.includes('speed_kmh')) selectedFields.add('speed_kmh');
    if (fields.includes('rpm')) selectedFields.add('rpm');
    if (selectedFields.size === 0 && fields.length) selectedFields.add(fields[0]);

    pickerEl.innerHTML = '';
    for (const f of fields) {
      const m = metaFor(f);
      const label = document.createElement('label');
      label.className = 'field-chip' + (selectedFields.has(f) ? ' on' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedFields.has(f);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedFields.add(f); else selectedFields.delete(f);
        label.classList.toggle('on', cb.checked);
        drawChart();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(m.label));
      pickerEl.appendChild(label);
    }
  }

  function drawChart() {
    const labels = currentReadings.map((r) => {
      const d = parseTs(r.timestamp);
      return d ? d.toLocaleTimeString() : '';
    });

    // One Y axis per distinct unit; alternate left/right positions.
    const fields = [...selectedFields];
    const unitAxis = {};
    const scales = darkLineOptions().scales;
    let axisIdx = 0;
    for (const f of fields) {
      const unit = metaFor(f).unit || '';
      if (!(unit in unitAxis)) {
        const id = `y${axisIdx}`;
        unitAxis[unit] = id;
        scales[id] = {
          position: axisIdx % 2 === 0 ? 'left' : 'right',
          title: { display: !!unit, text: unit, color: '#9a9ac0' },
          grid: { drawOnChartArea: axisIdx === 0, color: 'rgba(50,50,90,0.4)' },
          ticks: { color: '#9a9ac0' },
        };
        axisIdx++;
      }
    }

    const datasets = fields.map((f, i) => {
      const color = SERIES_COLORS[i % SERIES_COLORS.length];
      return {
        label: metaFor(f).label,
        data: currentReadings.map((r) => (typeof r[f] === 'number' ? r[f] : null)),
        borderColor: color,
        backgroundColor: color,
        yAxisID: unitAxis[metaFor(f).unit || ''],
        borderWidth: 1.6,
        pointRadius: 0,
        tension: 0.25,
        spanGaps: true,
      };
    });

    const options = darkLineOptions();
    options.scales = scales;

    if (chart) chart.destroy();
    chart = new Chart(canvas, { type: 'line', data: { labels, datasets }, options });
  }

  function renderSummary(trip) {
    if (!trip) { summaryEl.innerHTML = ''; return; }
    const cards = [
      ['Duration', fmtDuration(trip.duration_seconds), ''],
      ['Distance', trip.distance_km != null ? fmtValue(trip.distance_km) : '–', 'km'],
      ['Avg Speed', fmtValue(trip.avg_speed_kmh), 'km/h'],
      ['Max Speed', fmtValue(trip.max_speed_kmh), 'km/h'],
      ['Avg RPM', fmtValue(trip.avg_rpm), 'rpm'],
      ['Readings', String(trip.reading_count), ''],
    ];
    summaryEl.innerHTML = cards.map(([label, val, unit]) =>
      `<div class="metric-card"><div class="label">${label}</div>` +
      `<div class="value">${val}${unit ? `<span class="unit">${unit}</span>` : ''}</div></div>`
    ).join('');
  }

  function ensureLoaded() {
    if (!loaded) load();
  }

  backBtn.addEventListener('click', showList);

  return { load, ensureLoaded };
})();
