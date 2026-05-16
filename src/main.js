/**
 * ╔══════════════════════════════════════════════════╗
 * ║         ATLAS ALIVE — Main Entry Point          ║
 * ║     Survival Navigation System v1.0.0-alpha     ║
 * ║  "When everything fails, ATLAS ALIVE works."    ║
 * ╚══════════════════════════════════════════════════╝
 */

// Styles
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/map-themes.css';
import './styles/app-layout.css';
import './styles/wiki.css';

// Modules
import { initMap, updateUserPosition } from './map/map-engine.js';
import { onGPS, startTracking } from './gps/gps-tracker.js';
import { buildAppShell, updateGPSDisplay, updateNetworkStatus } from './ui/app-shell.js';
import { showToast } from './ui/toast.js';

// ─── Boot Sequence ───

async function boot() {
  console.log('%c ATLAS ALIVE ', 'background: #06b6d4; color: #050810; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
  console.log('Survival Navigation System v1.0.0-alpha');
  console.log('─────────────────────────────────────');

  // 1. Build UI shell
  buildAppShell();

  // 2. Initialize map
  try {
    initMap('map-container');
  } catch (e) {
    console.error('[ATLAS] Map init failed:', e);
    showToast('Map engine failed to initialize', 'error');
  }

  // 3. Wire up GPS → Map updates
  onGPS((event, data) => {
    if (event === 'position') {
      updateUserPosition(data.lng, data.lat, data.accuracy, data.heading);
      updateGPSDisplay(data);
    }
    if (event === 'error') {
      showToast(data.message, 'warning');
    }
  });

  // 4. Network status monitoring
  updateNetworkStatus();
  window.addEventListener('online', () => {
    updateNetworkStatus();
    showToast('Network connection restored', 'success');
  });
  window.addEventListener('offline', () => {
    updateNetworkStatus();
    showToast('You are now OFFLINE — ATLAS continues to work', 'warning');
  });

  // 5. Register PWA
  if ('serviceWorker' in navigator) {
    try {
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({
        onOfflineReady() {
          showToast('ATLAS ALIVE is ready for offline use', 'success');
        },
        onNeedRefresh() {
          showToast('New version available. Refresh to update.', 'info');
        }
      });
    } catch (e) {
      // PWA registration only works in production build
      console.log('[ATLAS] PWA registration skipped (dev mode)');
    }
  }

  console.log('[ATLAS] Boot complete ✓');
}

// Start
boot().catch(console.error);
