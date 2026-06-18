/**
 * ATLAS ALIVE — Map Engine
 * Offline-first mapping powered by MapLibre GL JS + PMTiles
 */

import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

let map = null;
let protocol = null;
let currentTheme = 'dark';
let userMarker = null;
let accuracyCircle = null;

// Default center (will be overridden by GPS)
const DEFAULT_CENTER = [78.9629, 20.5937]; // India center
const DEFAULT_ZOOM = 4;

/**
 * Map style definitions
 */
const MAP_STYLES = {
  dark: {
    version: 8,
    name: 'ATLAS ALIVE Dark',
    sources: {
      'protomaps': {
        type: 'vector',
        url: 'pmtiles://https://build.protomaps.com/20260615.pmtiles',
        attribution: '© OpenStreetMap contributors'
      }
    },
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    layers: createDarkLayers()
  }
};

/**
 * Create dark theme map layers for Protomaps basemap
 */
function createDarkLayers() {
  return [
    // Background
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#05080e' }
    },
    // Earth / Land
    {
      id: 'earth',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'earth',
      paint: {
        'fill-color': '#0e121a'
      }
    },
    // Landuse (parks, forests, etc.)
    {
      id: 'landuse_park',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landuse',
      filter: ['in', 'pmap:kind', 'park', 'forest', 'wood', 'nature_reserve'],
      paint: {
        'fill-color': '#041c0e',
        'fill-opacity': 0.7
      }
    },
    // Water
    {
      id: 'water',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'water',
      paint: {
        'fill-color': '#0a1c33',
        'fill-opacity': 0.9
      }
    },
    // Water outline for high contrast
    {
      id: 'water_outline',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'water',
      paint: {
        'line-color': '#0055a5',
        'line-width': 1.2,
        'line-opacity': 0.6
      }
    },
    // Buildings
    {
      id: 'buildings',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'buildings',
      minzoom: 13,
      paint: {
        'fill-color': '#162135',
        'fill-opacity': 0.85
      }
    },
    // Roads - Highway Casing
    {
      id: 'roads_highway_casing',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['in', 'pmap:kind', 'highway', 'motorway'],
      paint: {
        'line-color': '#001633',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 12, 6, 18, 16]
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    },
    // Roads - Highway Fill
    {
      id: 'roads_highway',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['in', 'pmap:kind', 'highway', 'motorway'],
      paint: {
        'line-color': '#00b4ff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 12, 3.5, 18, 11]
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    },
    // Roads - Major Casing
    {
      id: 'roads_major_casing',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['in', 'pmap:kind', 'major_road', 'trunk', 'primary', 'secondary'],
      paint: {
        'line-color': '#050e1b',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 5, 18, 11]
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    },
    // Roads - Major Fill
    {
      id: 'roads_major',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['in', 'pmap:kind', 'major_road', 'trunk', 'primary', 'secondary'],
      paint: {
        'line-color': '#1a70c0',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.3, 14, 2.5, 18, 7]
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    },
    // Roads - Minor
    {
      id: 'roads_minor',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['in', 'pmap:kind', 'minor_road', 'tertiary', 'residential', 'service'],
      minzoom: 12,
      paint: {
        'line-color': '#172336',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 18, 4.5]
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    },
    // Boundaries (Country Borders)
    {
      id: 'boundaries',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'boundaries',
      paint: {
        'line-color': '#00f0ff',
        'line-width': 1.5,
        'line-dasharray': [4, 3],
        'line-opacity': 0.85
      }
    },
    // Place labels - Countries
    {
      id: 'places_country',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'places',
      filter: ['==', 'pmap:kind', 'country'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 6, 15],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
        'text-max-width': 8
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#05080e',
        'text-halo-width': 2.5
      }
    },
    // Place labels - Cities
    {
      id: 'places_city',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'places',
      filter: ['in', 'pmap:kind', 'city', 'town'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 14, 15],
        'text-max-width': 6
      },
      paint: {
        'text-color': '#e6f0ff',
        'text-halo-color': '#05080e',
        'text-halo-width': 2.2
      }
    },
    // Road labels
    {
      id: 'roads_labels',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'roads',
      minzoom: 14,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'symbol-placement': 'line',
        'text-max-angle': 30
      },
      paint: {
        'text-color': '#5c708a',
        'text-halo-color': '#05080e',
        'text-halo-width': 1.5
      }
    }
  ];
}

/**
 * Initialize the map engine
 */
export function initMap(containerId = 'map-container') {
  // Register PMTiles protocol
  protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);

  // Create map
  map = new maplibregl.Map({
    container: containerId,
    style: MAP_STYLES.dark,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    maxZoom: 18,
    minZoom: 1,
    attributionControl: false,
    antialias: true,
    fadeDuration: 300,
    pitchWithRotate: false
  });

  // Add navigation controls
  map.addControl(
    new maplibregl.NavigationControl({ showCompass: false }),
    'bottom-right'
  );

  // Add scale bar
  map.addControl(
    new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
    'bottom-left'
  );

  // Wait for map load
  map.on('load', () => {
    console.log('[ATLAS] Map engine initialized');
    document.dispatchEvent(new CustomEvent('atlas:map:ready'));
  });

  map.on('error', (e) => {
    console.warn('[ATLAS] Map error:', e.error?.message || e.message);
    // Don't crash — the map might not have tiles yet
  });

  return map;
}

/**
 * Set the map theme
 */
export function setMapTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? '' : theme);
}

/**
 * Fly to a location
 */
export function flyTo(lng, lat, zoom = 15) {
  if (!map) return;
  map.flyTo({
    center: [lng, lat],
    zoom,
    duration: 1500,
    essential: true
  });
}

/**
 * Update user position on map
 */
export function updateUserPosition(lng, lat, accuracy, heading) {
  if (!map) return;

  const lngLat = [lng, lat];

  // Create or update user marker
  if (!userMarker) {
    const el = document.createElement('div');
    el.className = 'gps-dot';

    const headingEl = document.createElement('div');
    headingEl.className = 'gps-heading';
    el.appendChild(headingEl);

    userMarker = new maplibregl.Marker({ element: el })
      .setLngLat(lngLat)
      .addTo(map);
  } else {
    userMarker.setLngLat(lngLat);
  }

  // Update heading
  if (heading !== null && heading !== undefined) {
    const headingEl = userMarker.getElement().querySelector('.gps-heading');
    if (headingEl) {
      headingEl.style.transform = `translateX(-50%) rotate(${heading}deg)`;
    }
  }

  // Update accuracy circle (simplified — MapLibre doesn't have built-in circle)
  // We'd need to add a GeoJSON source for true accuracy rings
  // For now, the CSS pulse ring on the dot serves the purpose
}

/**
 * Center map on user position
 */
export function centerOnUser(lng, lat) {
  if (!map) return;
  map.easeTo({
    center: [lng, lat],
    zoom: Math.max(map.getZoom(), 14),
    duration: 800
  });
}

/**
 * Add a POI marker to the map
 */
export function addPOIMarker(poi) {
  if (!map) return null;

  const el = document.createElement('div');
  el.className = 'poi-marker';
  el.innerHTML = getCategoryEmoji(poi.category);
  el.style.cssText = `
    width: 2rem; height: 2rem;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.125rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  `;

  const marker = new maplibregl.Marker({ element: el })
    .setLngLat([poi.lng, poi.lat])
    .addTo(map);

  el.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('atlas:poi:select', { detail: poi }));
  });

  return marker;
}

/**
 * Get emoji for POI category
 */
function getCategoryEmoji(category) {
  const emojis = {
    hospital: '🏥',
    clinic: '⚕️',
    pharmacy: '💊',
    water: '💧',
    shelter: '🏠',
    food: '🍲',
    police: '🚔',
    fire: '🚒',
    embassy: '🏛️',
    rally: '📍',
    danger: '⚠️',
    general: '📌'
  };
  return emojis[category] || '📌';
}

/**
 * Get the map instance
 */
export function getMap() {
  return map;
}

/**
 * Get current map center
 */
export function getCenter() {
  if (!map) return DEFAULT_CENTER;
  const c = map.getCenter();
  return [c.lng, c.lat];
}

/**
 * Get current zoom
 */
export function getZoom() {
  return map ? map.getZoom() : DEFAULT_ZOOM;
}

/**
 * Cleanup
 */
export function destroyMap() {
  if (protocol) {
    maplibregl.removeProtocol('pmtiles');
  }
  if (map) {
    map.remove();
    map = null;
  }
}

export function drawRouteLine(coordinates) {
  if (!map || !coordinates || coordinates.length < 2) return;

  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  };

  if (map.getSource('route')) {
    map.getSource('route').setData(geojson);
  } else {
    map.addSource('route', {
      type: 'geojson',
      data: geojson
    });

    // Casing layer for contrast
    map.addLayer({
      id: 'route-casing',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#001a33',
        'line-width': 9
      }
    });

    // Core neon route line
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#00a2ff',
        'line-width': 5
      }
    });
  }
}

export function clearRouteLine() {
  if (!map) return;
  if (map.getLayer('route')) map.removeLayer('route');
  if (map.getLayer('route-casing')) map.removeLayer('route-casing');
  if (map.getSource('route')) map.removeSource('route');
}

export function fitRouteBounds(fromLngLat, toLngLat) {
  if (!map) return;
  map.fitBounds([fromLngLat, toLngLat], {
    padding: { top: 180, bottom: 120, left: 60, right: 60 },
    maxZoom: 16,
    duration: 1200
  });
}


