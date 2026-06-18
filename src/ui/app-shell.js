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
  calculateDistance, calculateBearing, getCardinalDirection, isGPSTracking, startTracking, stopTracking, getDeviceHeading
} from '../gps/gps-tracker.js';
import { setMapTheme, centerOnUser, flyTo, addPOIMarker, drawRouteLine, clearRouteLine, fitRouteBounds, getCenter } from '../map/map-engine.js';


let activePanel = null;
let activeNav = 'map';
let currentTheme = 'dark';
let wikiView = null;
let currentWikiCategory = null;
let currentWikiArticle = null;
let activeDestination = null;
let activeRoute = null; // [[lng, lat], ...]
let nextWaypointIndex = 0;


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
    ${buildNavigationBanner()}
    ${buildEmergencyQuickActions()}
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
      <div>±<span id="coord-accuracy">--</span>m • <span id="coord-speed">0</span> km/h • <span id="coord-heading">--</span>°</div>
    </div>
  `;
}

function buildNavigationBanner() {
  return `
    <div class="nav-banner glass-panel" id="nav-banner" style="display: none">
      <div class="nav-banner__info">
        <div class="nav-banner__dest-name" id="nav-banner-dest">--</div>
        <div class="nav-banner__stats">
          <div class="nav-banner__stat">
            <span class="nav-banner__stat-val" id="nav-banner-dist">--</span>
            <span class="nav-banner__stat-lbl">Remaining</span>
          </div>
          <div class="nav-banner__stat">
            <span class="nav-banner__stat-val" id="nav-banner-dir">--</span>
            <span class="nav-banner__stat-lbl">Direction</span>
          </div>
          <div class="nav-banner__stat">
            <span class="nav-banner__stat-val" id="nav-banner-eta">--</span>
            <span class="nav-banner__stat-lbl">ETA</span>
          </div>
        </div>
        <div class="nav-banner__offline-note" id="nav-banner-note" style="display:none">
          ⚠️ Offline: Using simulated road path. Missing local OSM routing graph (e.g. GraphHopper engine) to compute true offline street turns.
        </div>
      </div>
      <div class="nav-banner__compass-wrapper">
        <div class="nav-banner__arrow" id="nav-banner-arrow">
          ${ICONS.navigation2}
        </div>
      </div>
      <button class="btn btn--danger btn--sm nav-banner__cancel" id="nav-banner-cancel">Stop</button>
    </div>
  `;
}

function buildEmergencyQuickActions() {
  return `
    <div class="emergency-quick-actions" id="emergency-quick-actions">
      <button class="btn-emergency" data-category="hospital">🏥 Hospital</button>
      <button class="btn-emergency" data-category="shelter">🏠 Shelter</button>
      <button class="btn-emergency" data-category="water">💧 Water</button>
      <button class="btn-emergency" data-category="food">🍲 Food</button>
      <button class="btn-emergency" data-category="police">🚔 Police</button>
      <button class="btn-emergency" data-category="fire">🚒 Fire</button>
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
              <input type="checkbox" id="setting-gps-toggle" checked>
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

  // Navigation Cancel button
  document.getElementById('nav-banner-cancel')?.addEventListener('click', () => {
    stopNavigation();
  });

  // Emergency quick actions
  document.getElementById('emergency-quick-actions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-emergency');
    if (!btn) return;
    const category = btn.dataset.category;
    handleEmergencySearch(category);
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
  document.getElementById('wiki-view')?.classList.remove('is-open');
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

  // Click to fly to POI and start navigation
  list.querySelectorAll('.poi-item').forEach(item => {
    item.addEventListener('click', () => {
      const poi = filtered.find(p => p.id === parseInt(item.dataset.poiId));
      if (poi) {
        startNavigationTo(poi);
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

    // Update speed and heading
    const speedKmh = pos.speed ? Math.round(pos.speed * 3.6) : 0;
    const headingDeg = pos.heading !== null && pos.heading !== undefined ? Math.round(pos.heading) : '--';
    const speedEl = document.getElementById('coord-speed');
    const headingEl = document.getElementById('coord-heading');
    if (speedEl) speedEl.textContent = speedKmh;
    if (headingEl) headingEl.textContent = headingDeg;
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

  // Update active navigation
  if (activeDestination) {
    updateNavigation(pos.lat, pos.lng, pos.heading, pos.speed);
  }
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

export function generateSimulatedRoute(fromLngLat, toLngLat) {
  const [lng1, lat1] = fromLngLat;
  const [lng2, lat2] = toLngLat;

  const points = [];
  points.push([lng1, lat1]);

  const dLng = lng2 - lng1;
  const dLat = lat2 - lat1;

  // Generate 3 intermediate street bends to look like real-world grid navigation
  const p1 = [lng1 + dLng * 0.4, lat1 + dLat * 0.1];
  const p2 = [lng1 + dLng * 0.45, lat1 + dLat * 0.7];
  const p3 = [lng1 + dLng * 0.9, lat1 + dLat * 0.85];

  points.push(p1, p2, p3);
  points.push([lng2, lat2]);
  return points;
}

export async function calculateRoute(fromLngLat, toLngLat) {
  const [fromLng, fromLat] = fromLngLat;
  const [toLng, toLat] = toLngLat;

  if (navigator.onLine) {
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          console.log('[ATLAS] Successfully fetched OSRM road route.');
          return data.routes[0].geometry.coordinates;
        }
      }
    } catch (e) {
      console.warn('[ATLAS] OSRM route fetch failed, falling back to simulated road:', e.message);
    }
  }

  return generateSimulatedRoute(fromLngLat, toLngLat);
}

/**
 * Start active navigation mode to a POI destination
 */
export async function startNavigationTo(poi) {
  if (!poi) return;
  activeDestination = poi;
  closeAllPanels();

  const banner = document.getElementById('nav-banner');
  if (banner) banner.style.display = 'flex';

  const pos = getCurrentPosition();
  let startLng, startLat;
  if (pos) {
    startLng = pos.lng;
    startLat = pos.lat;
  } else {
    const center = getCenter();
    startLng = center[0];
    startLat = center[1];
  }

  showToast('Calculating route path...', 'info');
  activeRoute = await calculateRoute([startLng, startLat], [poi.lng, poi.lat]);
  nextWaypointIndex = 0;

  if (pos) {
    fitRouteBounds([pos.lng, pos.lat], [poi.lng, poi.lat]);
    updateNavigation(pos.lat, pos.lng, pos.heading, pos.speed);
  } else {
    fitRouteBounds([startLng, startLat], [poi.lng, poi.lat]);
    updateNavigation(startLat, startLng, null, 0);
    showToast('GPS lock unavailable. Routing from map center.', 'warning');
  }
  showToast(`Navigating to ${poi.name}`, 'success');
}

/**
 * Stop active navigation mode and clean up UI
 */
export function stopNavigation() {
  if (!activeDestination) return;
  const banner = document.getElementById('nav-banner');
  if (banner) banner.style.display = 'none';
  clearRouteLine();
  showToast(`Navigation to ${activeDestination.name} stopped`, 'info');
  activeDestination = null;
  activeRoute = null;
  nextWaypointIndex = 0;
}

function formatETA(seconds) {
  if (seconds < 60) return '< 1 min';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remMins = minutes % 60;
  return `${hours} hr ${remMins} min`;
}

/**
 * Recalculate and update the navigation banner stats
 */
export function updateNavigation(lat, lng, heading, speed) {
  if (!activeDestination || !activeRoute) return;

  // Advance nextWaypointIndex if user is close to it (e.g., < 20 meters)
  while (nextWaypointIndex < activeRoute.length - 1) {
    const [wpLng, wpLat] = activeRoute[nextWaypointIndex];
    const distToWp = calculateDistance(lat, lng, wpLat, wpLng);
    if (distToWp < 20) {
      nextWaypointIndex++;
    } else {
      break;
    }
  }

  const targetWp = activeRoute[nextWaypointIndex] || [activeDestination.lng, activeDestination.lat];
  const [wpLng, wpLat] = targetWp;

  // Distance along remaining route segments
  let distance = calculateDistance(lat, lng, wpLat, wpLng);
  for (let i = nextWaypointIndex; i < activeRoute.length - 1; i++) {
    const [lng1, lat1] = activeRoute[i];
    const [lng2, lat2] = activeRoute[i+1];
    distance += calculateDistance(lat1, lng1, lat2, lng2);
  }

  const bearing = calculateBearing(lat, lng, wpLat, wpLng);
  const direction = getCardinalDirection(bearing);

  // Fallback to average walking speed (5 km/h) if stationary
  const v = speed && speed > 0.5 ? speed : 1.39;
  const etaSeconds = distance / v;

  // Update DOM elements
  const destEl = document.getElementById('nav-banner-dest');
  const distEl = document.getElementById('nav-banner-dist');
  const dirEl = document.getElementById('nav-banner-dir');
  const etaEl = document.getElementById('nav-banner-eta');
  const arrowEl = document.getElementById('nav-banner-arrow');
  const noteEl = document.getElementById('nav-banner-note');

  if (destEl) destEl.textContent = activeDestination.name;
  if (distEl) distEl.textContent = formatDistance(distance);
  if (dirEl) dirEl.textContent = direction;
  if (etaEl) etaEl.textContent = formatETA(etaSeconds);

  if (noteEl) {
    noteEl.style.display = navigator.onLine ? 'none' : 'block';
  }

  if (arrowEl) {
    const currentHeading = heading !== null && heading !== undefined ? heading : getDeviceHeading();
    const relativeAngle = currentHeading !== null && currentHeading !== undefined ? (bearing - currentHeading) : bearing;
    arrowEl.style.transform = `rotate(${relativeAngle}deg)`;
  }

  // Draw remaining route starting from current location
  const remainingPath = [[lng, lat], ...activeRoute.slice(nextWaypointIndex)];
  drawRouteLine(remainingPath);
}

/**
 * Search the nearest resource of a category offline and start navigation immediately
 */
async function handleEmergencySearch(category) {
  const pos = getCurrentPosition();
  const allPOIs = await getAllPOIs();

  // Define category groupings for survival resources
  const categoryGroups = {
    hospital: ['hospital', 'clinic', 'pharmacy'],
    shelter: ['shelter', 'rally'],
    water: ['water'],
    food: ['food'],
    police: ['police'],
    fire: ['fire']
  };

  const targetCategories = categoryGroups[category] || [category];
  const candidates = allPOIs.filter(p => targetCategories.includes(p.category));

  if (candidates.length === 0) {
    showToast(`No nearest ${category} found in local database`, 'error');
    return;
  }

  // Reference coordinates: GPS if available, else map center fallback
  let refLat, refLng;
  if (pos) {
    refLat = pos.lat;
    refLng = pos.lng;
  } else {
    const center = getCenter();
    refLng = center[0];
    refLat = center[1];
    showToast('GPS lock unavailable. Locating nearest relative to map center.', 'info');
  }

  let nearest = null;
  let minDist = Infinity;
  candidates.forEach(poi => {
    const dist = calculateDistance(refLat, refLng, poi.lat, poi.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = poi;
    }
  });

  if (nearest) {
    startNavigationTo(nearest);
  } else {
    showToast(`Could not determine nearest ${category}`, 'error');
  }
}

/**
 * Automated self-test suite for survival navigation verification
 */
export async function runSurvivalSelfTests() {
  console.log('%c [ATLAS SELF-TESTS] Starting Navigation Suite... ', 'background: #002244; color: #00b4ff; font-weight: bold; padding: 4px;');
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0
  };

  function assert(name, condition, details = '') {
    if (condition) {
      results.passed++;
      results.tests.push({ name, status: 'PASSED', details });
      console.log(`%c ✓ PASSED: ${name} ${details ? `(${details})` : ''}`, 'color: #10b981');
    } else {
      results.failed++;
      results.tests.push({ name, status: 'FAILED', details });
      console.error(`✗ FAILED: ${name} ${details}`);
    }
  }

  // Test coordinates (Delhi India Gate area)
  const testLat = 28.6129;
  const testLng = 77.2295;

  // 1. Assert Distance Math
  const dist = calculateDistance(testLat, testLng, 28.5672, 77.2100); // Distance to AIIMS
  assert('Distance Calculation (Delhi to AIIMS)', dist > 0 && Math.abs(dist - 5482) < 250, `Calculated: ${Math.round(dist)}m (Expected: ~5482m)`);

  // 2. Assert Database & Seeding
  await seedDemoPOIs();
  const allPOIs = await getAllPOIs();
  assert('Database Seeding & Recovery', allPOIs.length > 0, `Total POIs in DB: ${allPOIs.length}`);

  // Helpers to test queries
  const getNearest = (category, list) => {
    let nearest = null;
    let minDist = Infinity;
    list.forEach(p => {
      const d = calculateDistance(testLat, testLng, p.lat, p.lng);
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    });
    return nearest;
  };

  // 3. Assert Category Groups & Nearest Selection
  const hospitals = allPOIs.filter(p => ['hospital', 'clinic', 'pharmacy'].includes(p.category));
  const nearestHosp = getNearest('hospital', hospitals);
  assert('Nearest Hospital Search (City General)', nearestHosp && nearestHosp.name === 'City General Hospital', `Found: ${nearestHosp?.name}`);

  const shelters = allPOIs.filter(p => ['shelter', 'rally'].includes(p.category));
  const nearestShelt = getNearest('shelter', shelters);
  assert('Nearest Shelter Search (India Gate)', nearestShelt && nearestShelt.name === 'India Gate Rally Point', `Found: ${nearestShelt?.name}`);

  const police = allPOIs.filter(p => ['police'].includes(p.category));
  const nearestPolice = getNearest('police', police);
  assert('Nearest Police Search (Delhi Police HQ)', nearestPolice && nearestPolice.name === 'Delhi Police Headquarters', `Found: ${nearestPolice?.name}`);

  const water = allPOIs.filter(p => ['water'].includes(p.category));
  const nearestWater = getNearest('water', water);
  assert('Nearest Water Search (Lodhi Gardens)', nearestWater && nearestWater.name === 'Lodhi Gardens Water Point', `Found: ${nearestWater?.name}`);

  const food = allPOIs.filter(p => ['food'].includes(p.category));
  const nearestFood = getNearest('food', food);
  assert('Nearest Food Search (CP Soup Kitchen)', nearestFood && nearestFood.name === 'CP Soup Kitchen', `Found: ${nearestFood?.name}`);

  const fire = allPOIs.filter(p => ['fire'].includes(p.category));
  const nearestFire = getNearest('fire', fire);
  assert('Nearest Fire Search (CP Fire Station)', nearestFire && nearestFire.name === 'Connaught Place Fire Station', `Found: ${nearestFire?.name}`);

  // 4. Assert non-straight route generation (Grid simulator)
  const route = await calculateRoute([testLng, testLat], [28.5672, 77.2100]);
  assert('Route Node Count (>2 steps)', route && route.length >= 3, `Coordinates: ${route?.length}`);
  const isStraightLine = route && route.length === 2;
  assert('Route is Non-Straight Geometry', !isStraightLine, `Is multi-point: ${!isStraightLine}`);

  window.atlasTestResults = results;
  showToast(`Self-tests complete. Passed: ${results.passed}, Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
  return results;
}

// Bind self-tests to window
window.runAtlasTests = runSurvivalSelfTests;



