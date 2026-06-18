/**
 * ATLAS ALIVE — GPS Tracker
 * Burst-mode GPS with battery optimization
 */

let currentPosition = null;
let positionHistory = [];
let callbacks = [];
let burstInterval = 5000;
let burstTimer = null;
let isTracking = false;

const BURST_INTERVALS = {
  normal: 5000,
  'power-save': 30000,
  'ultra-power': 60000
};

export function startTracking(mode = 'normal') {
  if (isTracking) return;
  burstInterval = BURST_INTERVALS[mode] || 5000;
  isTracking = true;
  requestPosition();
  burstTimer = setInterval(requestPosition, burstInterval);
  notifyListeners('tracking:start', { mode, interval: burstInterval });
}

export function stopTracking() {
  if (burstTimer) { clearInterval(burstTimer); burstTimer = null; }
  isTracking = false;
  notifyListeners('tracking:stop');
}

function requestPosition() {
  if (!navigator.geolocation) {
    notifyListeners('error', { message: 'Geolocation not supported' });
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      };
      currentPosition = pos;
      positionHistory.push({ lat: pos.lat, lng: pos.lng, timestamp: pos.timestamp });
      if (positionHistory.length > 500) positionHistory = positionHistory.slice(-500);
      notifyListeners('position', pos);
    },
    (error) => {
      const msgs = { 1: 'Location access denied', 2: 'Position unavailable', 3: 'GPS timed out' };
      notifyListeners('error', { code: error.code, message: msgs[error.code] || error.message });
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: burstInterval }
  );
}

export function setBurstMode(mode) {
  burstInterval = BURST_INTERVALS[mode] || 5000;
  if (isTracking) { clearInterval(burstTimer); burstTimer = setInterval(requestPosition, burstInterval); }
}

export function getCurrentPosition() { return currentPosition; }
export function getPositionHistory() { return [...positionHistory]; }
export function isGPSTracking() { return isTracking; }

export function onGPS(callback) {
  callbacks.push(callback);
  return () => { callbacks = callbacks.filter(cb => cb !== callback); };
}

function notifyListeners(event, data) {
  callbacks.forEach(cb => { try { cb(event, data); } catch(e) {} });
}

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2-lng1)*Math.PI/180;
  const y = Math.sin(dLng)*Math.cos(lat2*Math.PI/180);
  const x = Math.cos(lat1*Math.PI/180)*Math.sin(lat2*Math.PI/180) - Math.sin(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.cos(dLng);
  return (Math.atan2(y,x)*180/Math.PI + 360) % 360;
}

export function formatDistance(m) { return m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`; }

export function formatCoords(lat, lng) {
  return {
    lat: `${Math.abs(lat).toFixed(5)}°${lat >= 0 ? 'N' : 'S'}`,
    lng: `${Math.abs(lng).toFixed(5)}°${lng >= 0 ? 'E' : 'W'}`
  };
}

export function getCardinalDirection(bearing) {
  const directions = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

let deviceHeading = null;

if (typeof window !== 'undefined') {
  window.addEventListener('deviceorientationabsolute', (e) => {
    if (e.alpha !== null) {
      deviceHeading = 360 - e.alpha;
    }
  }, true);

  window.addEventListener('deviceorientation', (e) => {
    if (e.webkitCompassHeading !== undefined) {
      deviceHeading = e.webkitCompassHeading;
    } else if (e.alpha !== null && deviceHeading === null) {
      deviceHeading = 360 - e.alpha;
    }
  }, true);
}

export function getDeviceHeading() {
  return deviceHeading;
}


