/* Stats tab: summary cards + avg-speed-per-trip bar chart + fuel-rate trend line. */

const StatsView = (() => {
  const { fmtValue, parseTs, darkLineOptions } = window.OBD;

  const cardsEl = document.getElementById('stats-cards');
  const speedCanvas = document.getElementById('stats-speed-chart');
  const fuelCanvas = document.getElementById('stats-fuel-chart');

  let speedChart = null;
  let fuelChart = null;
  let loaded = false;

  function card(label, val, unit) {
    return `<div class="metric-card"><div class="label">${label}</div>` +
      `<div class="value">${val}${unit ? `<span class="unit">${unit}</span>` : ''}</div></div>`;
  }

  async function load() {
    try {
      const [statsRes, tripsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/trips'),
      ]);
      if (statsRes.status === 401 || tripsRes.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      const stats = await statsRes.json();
      const trips = await tripsRes.json();

      renderCards(stats);
      renderSpeedChart(trips);
      renderFuelChart(trips);
      loaded = true;
    } catch (err) {
      cardsEl.innerHTML = '<div class="empty-msg">Failed to load stats.</div>';
    }
  }

  function renderCards(s) {
    cardsEl.innerHTML = [
      card('Total Trips', s.total_trips ?? 0, ''),
      card('Total Readings', (s.total_readings ?? 0).toLocaleString(), ''),
      card('Driving Time', fmtValue(s.total_driving_time_hours ?? 0), 'h'),
      card('Total Distance', fmtValue(s.total_distance_km ?? 0), 'km'),
      card('Avg Speed', s.avg_speed_kmh != null ? fmtValue(s.avg_speed_kmh) : '–', 'km/h'),
      card('Avg Fuel Rate', s.avg_fuel_rate_lph != null ? fmtValue(s.avg_fuel_rate_lph) : '–', 'L/h'),
    ].join('');
  }

  // Bar chart: average speed for the last 20 trips (chronological).
  function renderSpeedChart(trips) {
    const recent = trips.slice(0, 20).reverse(); // trips come newest-first
    const labels = recent.map((t) => {
      const d = parseTs(t.start_time);
      return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
    });
    const data = recent.map((t) => t.avg_speed_kmh);

    const options = darkLineOptions();
    options.plugins.legend.display = false;
    options.scales.y = {
      beginAtZero: true,
      title: { display: true, text: 'km/h', color: '#9a9ac0' },
      grid: { color: 'rgba(50,50,90,0.4)' },
    };

    if (speedChart) speedChart.destroy();
    speedChart = new Chart(speedCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Avg Speed', data, backgroundColor: '#4cc9f0' }],
      },
      options,
    });
  }

  // Line chart: avg fuel rate per trip over time (skip if no fuel data anywhere).
  function renderFuelChart(trips) {
    const withFuel = trips.slice().reverse().filter((t) => t.avg_fuel_rate_lph != null);
    if (!withFuel.length) {
      if (fuelChart) { fuelChart.destroy(); fuelChart = null; }
      fuelCanvas.parentElement.style.display = 'none';
      return;
    }
    fuelCanvas.parentElement.style.display = '';

    const labels = withFuel.map((t) => {
      const d = parseTs(t.start_time);
      return d ? d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    });
    const data = withFuel.map((t) => t.avg_fuel_rate_lph);

    const options = darkLineOptions();
    options.plugins.legend.display = false;
    options.scales.y = {
      beginAtZero: true,
      title: { display: true, text: 'L/h', color: '#9a9ac0' },
      grid: { color: 'rgba(50,50,90,0.4)' },
    };

    if (fuelChart) fuelChart.destroy();
    fuelChart = new Chart(fuelCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Avg Fuel Rate', data,
          borderColor: '#f72585', backgroundColor: '#f72585',
          borderWidth: 1.8, pointRadius: 2, tension: 0.25, spanGaps: true,
        }],
      },
      options,
    });
  }

  function ensureLoaded() { if (!loaded) load(); }

  return { load, ensureLoaded };
})();
