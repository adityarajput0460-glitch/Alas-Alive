/**
 * ATLAS ALIVE — App Shell
 * Builds the complete UI overlay on top of the map
 */

import { ICONS } from './icons.js';
import { showToast } from './toast.js';
import { WIKI_CATEGORIES, WIKI_ARTICLES } from '../data/wiki-data.js';
import { POI_CATEGORIES, getAllPOIs, seedDemoPOIs } from '../data/poi-database.js';
import {
  getCurrentPosition, formatCoords, formatDistance,
  calculateDistance, isGPSTracking, startTracking, stopTracking
} from '../gps/gps-tracker.js';
import { setMapTheme, centerOnUser, flyTo, addPOIMarker } from '../map/map-engine.js';

let activePanel = null;
let activeNav = 'map';
let currentTheme = 'dark';
let wikiView = null;
let currentWikiCategory = null;
let currentWikiArticle = null;

/**
 * Build the entire app UI
 */
export function buildAppShell() {
  const app = document.getElementById('app');

  // Map container
  app.innerHTML = `
    <div id="map-container"></div>
    ${buildSplashScreen()}
    ${buildStatusBar()}
    ${buildSOSButton()}
    ${buildFABGroup()}
    ${buildCoordDisplay()}
    ${buildNavBar()}
    ${buildOverlayBackdrop()}
    ${buildDownloadPanel()}
    ${buildPOIPanel()}
    ${buildSettingsPanel()}
    ${buildWikiView()}
  `;

  // Bind events
  bindNavigation();
  bindFABs();
  bindPanels();
  bindSettings();
  bindWiki();
  bindSOS();

  // Dismiss splash after map loads (or timeout)
  document.addEventListener('atlas:map:ready', () => {
    setTimeout(dismissSplash, 1200);
  });
  setTimeout(dismissSplash, 4000); // Fallback

  // Load POIs
  loadPOIs();
}

function buildSplashScreen() {
  return `
    <div class="splash-screen" id="splash-screen">
      <div class="splash-screen__logo">${ICONS.logo}</div>
      <div class="splash-screen__title">ATLAS ALIVE</div>
      <div class="splash-screen__subtitle">Survival Navigation System</div>
      <div class="splash-screen__loader">
        <div class="progress">
          <div class="progress__bar" style="width: 0%" id="splash-progress"></div>
        </div>
      </div>
    </div>
  `;
}

function dismissSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  const bar = document.getElementById('splash-progress');
  if (bar) bar.style.width = '100%';
  setTimeout(() => splash.classList.add('is-hidden'), 500);
}

function buildStatusBar() {
  return `
    <header class="status-bar" id="status-bar">
      <div class="status-bar__left">
        <div class="status-bar__logo">
          <span class="status-bar__logo-icon">${ICONS.logo}</span>
          ATLAS
        </div>
      </div>
      <div class="status-bar__right">
        <div class="status-indicator" id="gps-status">
          <span class="status-indicator__dot status-indicator__dot--off" id="gps-dot"></span>
          <span id="gps-status-text">GPS OFF</span>
        </div>
        <div class="status-indicator" id="network-status">
          <span class="status-indicator__dot" id="network-dot"></span>
          <span id="network-status-text">ONLINE</span>
        </div>
      </div>
    </header>
  `;
}

function buildSOSButton() {
  return `<button class="sos-button" id="sos-btn" title="SOS Emergency">SOS</button>`;
}

function buildFABGroup() {
  return `
    <div class="fab-group" id="fab-group">
      <button class="fab fab--locate glass-panel" id="fab-locate" title="My Location">
        ${ICONS.crosshair}
      </button>
      <button class="fab fab--compass glass-panel" id="fab-compass" title="Compass">
        ${ICONS.compass}
      </button>
    </div>
  `;
}

function buildCoordDisplay() {
  return `
    <div class="coord-display glass-panel" id="coord-display" style="display:none">
      <div><span class="coord-display__value" id="coord-lat">--</span></div>
      <div><span class="coord-display__value" id="coord-lng">--</span></div>
      <div>±<span id="coord-accuracy">--</span>m</div>
    </div>
  `;
}

function buildNavBar() {
  const items = [
    { id: 'map', icon: ICONS.map, label: 'Map' },
    { id: 'pois', icon: ICONS.crosshair, label: 'POIs' },
    { id: 'downloads', icon: ICONS.download, label: 'Maps' },
    { id: 'wiki', icon: ICONS.book, label: 'Wiki' },
    { id: 'settings', icon: ICONS.settings, label: 'Settings' }
  ];

  return `
    <nav class="nav-bar glass-panel" id="nav-bar">
      ${items.map(item => `
        <button class="nav-bar__item ${item.id === 'map' ? 'is-active' : ''}"
                data-nav="${item.id}" id="nav-${item.id}">
          <span class="nav-bar__icon">${item.icon}</span>
          ${item.label}
        </button>
      `).join('')}
    </nav>
  `;
}

function buildOverlayBackdrop() {
  return `<div class="overlay-backdrop" id="overlay-backdrop"></div>`;
}

function buildDownloadPanel() {
  return `
    <div class="slide-panel glass-panel" id="panel-downloads">
      <div class="slide-panel__handle"></div>
      <div class="slide-panel__header">
        <h2 class="slide-panel__title">Map Downloads</h2>
        <button class="btn btn--ghost btn--sm" id="close-downloads">${ICONS.x}</button>
      </div>
      <div class="slide-panel__body">
        <div class="download-item" style="margin-bottom: var(--space-3)">
          <div class="download-item__header">
            <span class="download-item__name">🌍 Global Overview</span>
            <span class="badge badge--safe">Included</span>
          </div>
          <div class="download-item__meta">
            <span>Zoom 0–6 • ~5MB • Always available</span>
          </div>
        </div>

        <div class="divider"></div>
        <h3 style="font-size: var(--text-sm); color: var(--color-mist); margin-bottom: var(--space-3);">Available Regional Packs</h3>

        <div class="download-item" style="margin-bottom: var(--space-3)">
          <div class="download-item__header">
            <span class="download-item__name">🇮🇳 Delhi NCR</span>
            <span class="download-item__size">~45 MB</span>
          </div>
          <div class="download-item__meta">
            <span>Zoom 0–14 • High detail</span>
          </div>
          <div style="margin-top: var(--space-3)">
            <button class="btn btn--primary btn--sm" onclick="document.dispatchEvent(new CustomEvent('atlas:toast', {detail:{msg:'Regional downloads require PMTiles extract. See documentation.', type:'info'}}))">
              ${ICONS.download} Download
            </button>
          </div>
        </div>

        <div class="download-item" style="margin-bottom: var(--space-3)">
          <div class="download-item__header">
            <span class="download-item__name">🇮🇳 Mumbai Metro</span>
            <span class="download-item__size">~38 MB</span>
          </div>
          <div class="download-item__meta"><span>Zoom 0–14 • High detail</span></div>
          <div style="margin-top: var(--space-3)">
            <button class="btn btn--primary btn--sm">
              ${ICONS.download} Download
            </button>
          </div>
        </div>

        <div class="download-item">
          <div class="download-item__header">
            <span class="download-item__name">🇮🇳 Kolkata</span>
            <span class="download-item__size">~32 MB</span>
          </div>
          <div class="download-item__meta"><span>Zoom 0–14 • High detail</span></div>
          <div style="margin-top: var(--space-3)">
            <button class="btn btn--primary btn--sm">
              ${ICONS.download} Download
            </button>
          </div>
        </div>

        <div style="margin-top: var(--space-6); padding: var(--space-4); border-radius: var(--radius-md); background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.15);">
          <p style="font-size: var(--text-xs); color: var(--color-atlas);">
            💡 <strong>Pro Tip:</strong> Download your region's map pack while you have internet. These maps work completely offline via GPS.
          </p>
        </div>
      </div>
    </div>
  `;
}

function buildPOIPanel() {
  return `
    <div class="slide-panel glass-panel" id="panel-pois">
      <div class="slide-panel__handle"></div>
      <div class="slide-panel__header">
        <h2 class="slide-panel__title">Points of Interest</h2>
        <button class="btn btn--ghost btn--sm" id="close-pois">${ICONS.x}</button>
      </div>
      <div class="slide-panel__body">
        <div style="display:flex; gap:var(--space-2); flex-wrap:wrap; margin-bottom:var(--space-4)" id="poi-filters">
          <button class="chip is-active" data-filter="all">All</button>
          ${POI_CATEGORIES.slice(0, 8).map(c => `
            <button class="chip" data-filter="${c.id}">${c.emoji} ${c.name}</button>
          `).join('')}
        </div>
        <div class="poi-list" id="poi-list">
          <div class="empty-state">
            <div class="spinner"></div>
            <div class="empty-state__desc">Loading POIs...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildSettingsPanel() {
  return `
    <div class="slide-panel glass-panel" id="panel-settings">
      <div class="slide-panel__handle"></div>
      <div class="slide-panel__header">
        <h2 class="slide-panel__title">Settings</h2>
        <button class="btn btn--ghost btn--sm" id="close-settings">${ICONS.x}</button>
      </div>
      <div class="slide-panel__body">
        <div class="settings-group">
          <div class="settings-group__title">Display Theme</div>
          <div class="theme-grid" id="theme-grid">
            <button class="theme-option is-active" data-theme="dark">
              <div class="theme-option__preview" style="background: linear-gradient(135deg, #0a0e1a, #1e293b)"></div>
              <span class="theme-option__label">Standard Dark</span>
            </button>
            <button class="theme-option" data-theme="night">
              <div class="theme-option__preview" style="background: linear-gradient(135deg, #1a0505, #3d0a0a)"></div>
              <span class="theme-option__label">🔴 Night Ops</span>
            </button>
            <button class="theme-option" data-theme="ultra-power">
              <div class="theme-option__preview" style="background: linear-gradient(135deg, #000, #333)"></div>
              <span class="theme-option__label">🔋 Ultra Power</span>
            </button>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group__title">GPS Configuration</div>
          <div class="settings-row">
            <div>
              <div class="settings-row__label">GPS Tracking</div>
              <div class="settings-row__desc">Enable burst-mode position tracking</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="setting-gps-toggle">
              <span class="switch__track"></span>
              <span class="switch__thumb"></span>
            </label>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-row__label">Burst Interval</div>
              <div class="settings-row__desc">Frequency of GPS position fixes</div>
            </div>
            <select id="setting-gps-interval" style="background:var(--color-slate);padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);color:var(--color-frost);font-size:var(--text-sm)">
              <option value="normal">5 sec (Normal)</option>
              <option value="power-save">30 sec (Power Save)</option>
              <option value="ultra-power">60 sec (Ultra)</option>
            </select>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group__title">About</div>
          <div class="settings-row">
            <div class="settings-row__label">Version</div>
            <div class="settings-row__value">1.0.0-alpha</div>
          </div>
          <div class="settings-row">
            <div class="settings-row__label">Data Source</div>
            <div class="settings-row__value">OpenStreetMap</div>
          </div>
          <div class="settings-row">
            <div class="settings-row__label">Engine</div>
            <div class="settings-row__value">MapLibre GL JS</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildWikiView() {
  return `
    <div class="wiki-view" id="wiki-view">
      <div class="wiki-header">
        <button class="wiki-header__back" id="wiki-back">${ICONS.arrowLeft}</button>
        <h2 class="wiki-header__title" id="wiki-title">Survival Wiki</h2>
      </div>
      <div class="wiki-search">
        <div class="search-input">
          <span class="search-input__icon">${ICONS.search}</span>
          <input type="text" placeholder="Search survival guides..." id="wiki-search-input">
        </div>
      </div>
      <div class="wiki-body" id="wiki-body">
        ${buildWikiCategoriesHTML()}
      </div>
    </div>
  `;
}

function buildWikiCategoriesHTML() {
  return `
    <div class="wiki-categories">
      ${WIKI_CATEGORIES.map(cat => `
        <div class="wiki-category" data-wiki-cat="${cat.id}">
          <span class="wiki-category__icon">${cat.emoji}</span>
          <span class="wiki-category__name">${cat.name}</span>
          <span class="wiki-category__count">${cat.articleCount} articles</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Event Binding ───

function bindNavigation() {
  document.querySelectorAll('.nav-bar__item').forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = btn.dataset.nav;
      document.querySelectorAll('.nav-bar__item').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      closeAllPanels();

      if (nav === 'downloads') openPanel('panel-downloads');
      else if (nav === 'pois') { openPanel('panel-pois'); refreshPOIList(); }
      else if (nav === 'settings') openPanel('panel-settings');
      else if (nav === 'wiki') document.getElementById('wiki-view').classList.add('is-open');
      activeNav = nav;
    });
  });
}

function bindFABs() {
  document.getElementById('fab-locate')?.addEventListener('click', () => {
    const pos = getCurrentPosition();
    if (pos) {
      centerOnUser(pos.lng, pos.lat);
      showToast('Centered on your location', 'success');
    } else {
      showToast('No GPS fix yet. Enable GPS in Settings.', 'warning');
    }
  });
}

function bindPanels() {
  document.getElementById('close-downloads')?.addEventListener('click', () => closeAllPanels());
  document.getElementById('close-pois')?.addEventListener('click', () => closeAllPanels());
  document.getElementById('close-settings')?.addEventListener('click', () => closeAllPanels());
  document.getElementById('overlay-backdrop')?.addEventListener('click', () => closeAllPanels());

  // POI filter chips
  document.getElementById('poi-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#poi-filters .chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    refreshPOIList(chip.dataset.filter);
  });

  // Toast event listener
  document.addEventListener('atlas:toast', (e) => {
    showToast(e.detail.msg, e.detail.type || 'info');
  });
}

function bindSettings() {
  // Theme selection
  document.getElementById('theme-grid')?.addEventListener('click', (e) => {
    const option = e.target.closest('.theme-option');
    if (!option) return;
    const theme = option.dataset.theme;
    document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('is-active'));
    option.classList.add('is-active');
    currentTheme = theme;
    setMapTheme(theme);
    showToast(`Theme: ${theme === 'night' ? 'Night Ops (Red)' : theme === 'ultra-power' ? 'Ultra Power (B&W)' : 'Standard Dark'}`, 'info');
  });

  // GPS toggle
  document.getElementById('setting-gps-toggle')?.addEventListener('change', (e) => {
    if (e.target.checked) {
      const interval = document.getElementById('setting-gps-interval')?.value || 'normal';
      startTracking(interval);
      showToast('GPS tracking enabled', 'success');
    } else {
      stopTracking();
      showToast('GPS tracking disabled', 'info');
    }
  });
}

function bindWiki() {
  // Back button
  document.getElementById('wiki-back')?.addEventListener('click', () => {
    if (currentWikiArticle) {
      showWikiArticleList(currentWikiCategory);
      currentWikiArticle = null;
    } else if (currentWikiCategory) {
      showWikiCategories();
      currentWikiCategory = null;
    } else {
      document.getElementById('wiki-view').classList.remove('is-open');
      document.querySelectorAll('.nav-bar__item').forEach(b => b.classList.remove('is-active'));
      document.getElementById('nav-map')?.classList.add('is-active');
    }
  });

  // Category clicks
  document.getElementById('wiki-body')?.addEventListener('click', (e) => {
    const cat = e.target.closest('[data-wiki-cat]');
    if (cat) {
      currentWikiCategory = cat.dataset.wikiCat;
      showWikiArticleList(currentWikiCategory);
      return;
    }

    const article = e.target.closest('[data-wiki-article]');
    if (article) {
      currentWikiArticle = article.dataset.wikiArticle;
      showWikiArticle(currentWikiCategory, currentWikiArticle);
    }
  });

  // Search
  document.getElementById('wiki-search-input')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) { showWikiCategories(); currentWikiCategory = null; currentWikiArticle = null; return; }

    const results = [];
    Object.entries(WIKI_ARTICLES).forEach(([catId, articles]) => {
      articles.forEach(a => {
        if (a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query)) {
          results.push({ ...a, catId });
        }
      });
    });

    const body = document.getElementById('wiki-body');
    if (results.length === 0) {
      body.innerHTML = `<div class="empty-state"><div class="empty-state__title">No results</div><div class="empty-state__desc">Try different search terms</div></div>`;
    } else {
      body.innerHTML = `
        <div class="wiki-articles">
          ${results.map(r => `
            <div class="wiki-article-item" data-wiki-cat="${r.catId}" data-wiki-article="${r.id}" onclick="
              this.closest('.wiki-body') || true;
            ">
              <span class="wiki-article-item__title">${r.title}</span>
              <span class="wiki-article-item__arrow">${ICONS.chevronRight}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
  });
}

function bindSOS() {
  let pressTimer = null;
  const btn = document.getElementById('sos-btn');
  if (!btn) return;

  btn.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => {
      showToast('🆘 SOS ACTIVATED — Broadcasting distress signal to nearby ATLAS users', 'error', 5000);
    }, 2000);
  });

  btn.addEventListener('mouseup', () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  });

  btn.addEventListener('click', () => {
    showToast('Hold SOS button for 2 seconds to activate distress signal', 'warning');
  });
}

// ─── Panels ───

function openPanel(id) {
  closeAllPanels();
  const panel = document.getElementById(id);
  const backdrop = document.getElementById('overlay-backdrop');
  if (panel) panel.classList.add('is-open');
  if (backdrop) backdrop.classList.add('is-visible');
  activePanel = id;
}

function closeAllPanels() {
  document.querySelectorAll('.slide-panel').forEach(p => p.classList.remove('is-open'));
  document.getElementById('overlay-backdrop')?.classList.remove('is-visible');
  activePanel = null;
}

// ─── Wiki Navigation ───

function showWikiCategories() {
  const body = document.getElementById('wiki-body');
  const title = document.getElementById('wiki-title');
  body.innerHTML = buildWikiCategoriesHTML();
  title.textContent = 'Survival Wiki';
}

function showWikiArticleList(catId) {
  const body = document.getElementById('wiki-body');
  const title = document.getElementById('wiki-title');
  const cat = WIKI_CATEGORIES.find(c => c.id === catId);
  const articles = WIKI_ARTICLES[catId] || [];

  title.textContent = cat?.name || 'Articles';
  body.innerHTML = `
    <div class="wiki-articles">
      ${articles.map(a => `
        <div class="wiki-article-item" data-wiki-article="${a.id}">
          <span class="wiki-article-item__title">${a.title}</span>
          <span class="wiki-article-item__arrow">${ICONS.chevronRight}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function showWikiArticle(catId, articleId) {
  const body = document.getElementById('wiki-body');
  const title = document.getElementById('wiki-title');
  const articles = WIKI_ARTICLES[catId] || [];
  const article = articles.find(a => a.id === articleId);

  if (!article) return;
  title.textContent = article.title;
  body.innerHTML = `<div class="wiki-content">${article.content}</div>`;
}

// ─── POI List ───

async function loadPOIs() {
  await seedDemoPOIs();
  const pois = await getAllPOIs();
  pois.forEach(poi => addPOIMarker(poi));
}

async function refreshPOIList(filter = 'all') {
  const list = document.getElementById('poi-list');
  if (!list) return;

  const allPOIs = await getAllPOIs();
  const pos = getCurrentPosition();
  let filtered = filter === 'all' ? allPOIs : allPOIs.filter(p => p.category === filter);

  // Sort by distance if we have GPS
  if (pos) {
    filtered = filtered.map(p => ({
      ...p,
      dist: calculateDistance(pos.lat, pos.lng, p.lat, p.lng)
    })).sort((a, b) => a.dist - b.dist);
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state__title">No POIs found</div></div>`;
    return;
  }

  const catMap = {};
  POI_CATEGORIES.forEach(c => catMap[c.id] = c);

  list.innerHTML = filtered.map(poi => {
    const cat = catMap[poi.category] || catMap.general;
    const distText = poi.dist ? formatDistance(poi.dist) : '';
    return `
      <div class="poi-item" data-poi-id="${poi.id}">
        <div class="poi-item__icon poi-item__icon--${poi.category || 'general'}">${cat.emoji}</div>
        <div class="poi-item__info">
          <div class="poi-item__name">${poi.name}</div>
          <div class="poi-item__detail">${poi.description || cat.name}</div>
        </div>
        ${distText ? `<div class="poi-item__distance">${distText}</div>` : ''}
      </div>
    `;
  }).join('');

  // Click to fly to POI
  list.querySelectorAll('.poi-item').forEach(item => {
    item.addEventListener('click', () => {
      const poi = filtered.find(p => p.id === parseInt(item.dataset.poiId));
      if (poi) {
        flyTo(poi.lng, poi.lat, 16);
        closeAllPanels();
        showToast(`📍 ${poi.name}`, 'info');
      }
    });
  });
}

/**
 * Update GPS display elements
 */
export function updateGPSDisplay(pos) {
  if (!pos) return;

  const coords = formatCoords(pos.lat, pos.lng);
  const coordDisplay = document.getElementById('coord-display');
  if (coordDisplay) {
    coordDisplay.style.display = '';
    document.getElementById('coord-lat').textContent = coords.lat;
    document.getElementById('coord-lng').textContent = coords.lng;
    document.getElementById('coord-accuracy').textContent = Math.round(pos.accuracy);
  }

  // Update status bar
  const gpsDot = document.getElementById('gps-dot');
  const gpsText = document.getElementById('gps-status-text');
  if (gpsDot) {
    gpsDot.className = 'status-indicator__dot';
    if (pos.accuracy <= 10) gpsDot.classList.add(''); // green (default)
    else if (pos.accuracy <= 50) gpsDot.className = 'status-indicator__dot status-indicator__dot--warning';
    else gpsDot.className = 'status-indicator__dot status-indicator__dot--danger';
  }
  if (gpsText) gpsText.textContent = `±${Math.round(pos.accuracy)}m`;

  // Update locate FAB
  const fab = document.getElementById('fab-locate');
  if (fab) fab.classList.add('is-tracking');
}

/**
 * Update network status display
 */
export function updateNetworkStatus() {
  const online = navigator.onLine;
  const dot = document.getElementById('network-dot');
  const text = document.getElementById('network-status-text');
  if (dot) {
    dot.className = online
      ? 'status-indicator__dot'
      : 'status-indicator__dot status-indicator__dot--danger';
  }
  if (text) text.textContent = online ? 'ONLINE' : 'OFFLINE';
}
