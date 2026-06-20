/* App shell: tab navigation, lifecycle hooks for each view, logout. */

(function () {
  const tabs = document.querySelectorAll('.tab');
  const panels = {
    live: document.getElementById('tab-live'),
    trips: document.getElementById('tab-trips'),
    stats: document.getElementById('tab-stats'),
  };

  function activate(name) {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    Object.entries(panels).forEach(([k, el]) =>
      el.classList.toggle('active', k === name)
    );

    // Live polling only runs while its tab is visible.
    if (name === 'live') {
      LiveView.start();
    } else {
      LiveView.stop();
    }

    if (name === 'trips') TripsView.ensureLoaded();
    if (name === 'stats') StatsView.load(); // reload each visit for fresh aggregates
  }

  tabs.forEach((t) => t.addEventListener('click', () => activate(t.dataset.tab)));

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await fetch('/auth/logout', { method: 'POST' }); } catch (e) {}
    window.location.href = '/login.html';
  });

  // Default tab.
  activate('live');
})();
