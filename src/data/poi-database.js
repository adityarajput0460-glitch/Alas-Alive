/**
 * ATLAS ALIVE — POI Database
 * Local IndexedDB storage via Dexie.js
 */
import Dexie from 'dexie';

const db = new Dexie('AtlasAliveDB');

db.version(1).stores({
  pois: '++id, name, category, lat, lng, status, lastVerified',
  regions: '++id, name, downloadDate, fileSize',
  breadcrumbs: '++id, lat, lng, timestamp',
  userMarkers: '++id, lat, lng, type, timestamp'
});

export const POI_CATEGORIES = [
  { id: 'hospital', name: 'Hospital', emoji: '🏥', color: '#ef4444' },
  { id: 'clinic', name: 'Clinic', emoji: '⚕️', color: '#f87171' },
  { id: 'pharmacy', name: 'Pharmacy', emoji: '💊', color: '#fb923c' },
  { id: 'water', name: 'Water Source', emoji: '💧', color: '#3b82f6' },
  { id: 'shelter', name: 'Shelter', emoji: '🏠', color: '#f59e0b' },
  { id: 'food', name: 'Food Distribution', emoji: '🍲', color: '#10b981' },
  { id: 'police', name: 'Police Station', emoji: '🚔', color: '#6366f1' },
  { id: 'fire', name: 'Fire Station', emoji: '🚒', color: '#ef4444' },
  { id: 'embassy', name: 'Embassy', emoji: '🏛️', color: '#8b5cf6' },
  { id: 'rally', name: 'Rally Point', emoji: '📍', color: '#06b6d4' },
  { id: 'danger', name: 'Danger Zone', emoji: '⚠️', color: '#ef4444' },
  { id: 'general', name: 'General', emoji: '📌', color: '#94a3b8' }
];

export async function addPOI(poi) {
  return db.pois.add({ ...poi, lastVerified: Date.now(), status: 'active' });
}

export async function getAllPOIs() { return db.pois.toArray(); }

export async function getPOIsByCategory(category) {
  return db.pois.where('category').equals(category).toArray();
}

export async function updatePOIStatus(id, status) {
  return db.pois.update(id, { status, lastVerified: Date.now() });
}

export async function deletePOI(id) { return db.pois.delete(id); }

export async function addBreadcrumb(lat, lng, altitude) {
  return db.breadcrumbs.add({ lat, lng, altitude, timestamp: Date.now() });
}

export async function addUserMarker(lat, lng, type, note) {
  return db.userMarkers.add({ lat, lng, type, note, timestamp: Date.now() });
}

export async function getUserMarkers() { return db.userMarkers.toArray(); }

export async function addRegion(region) { return db.regions.add(region); }
export async function getRegions() { return db.regions.toArray(); }
export async function deleteRegion(id) { return db.regions.delete(id); }

export async function seedDemoPOIs() {
  const count = await db.pois.count();
  if (count > 0) return;

  const demoPOIs = [
    { name: 'City General Hospital', category: 'hospital', lat: 28.6139, lng: 77.2090, description: 'Major trauma center' },
    { name: 'AIIMS Delhi', category: 'hospital', lat: 28.5672, lng: 77.2100, description: 'Premier medical institute' },
    { name: 'Red Cross Shelter', category: 'shelter', lat: 28.6280, lng: 77.2195, description: 'Emergency shelter, 200 capacity' },
    { name: 'Yamuna Water Point', category: 'water', lat: 28.6508, lng: 77.2405, description: 'Purification station needed' },
    { name: 'India Gate Rally Point', category: 'rally', lat: 28.6129, lng: 77.2295, description: 'Open area, easily visible landmark' },
    { name: 'Central Food Bank', category: 'food', lat: 28.6353, lng: 77.2249, description: 'Dry rations available' },
    { name: 'Community Pharmacy', category: 'pharmacy', lat: 28.6200, lng: 77.2150, description: 'Basic medical supplies' },
    { name: 'Connaught Place Danger Zone', category: 'danger', lat: 28.6315, lng: 77.2167, description: 'Structural damage reported' }
  ];

  for (const poi of demoPOIs) {
    await addPOI(poi);
  }
}

export { db };
