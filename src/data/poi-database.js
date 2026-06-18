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
  // Clear old database data to ensure we re-seed with the updated Delhi POI catalog
  await db.pois.clear();

  const demoPOIs = [
    // Hospitals
    { name: 'City General Hospital', category: 'hospital', lat: 28.6139, lng: 77.2090, description: 'Major trauma center' },
    { name: 'AIIMS Delhi', category: 'hospital', lat: 28.5672, lng: 77.2100, description: 'Premier medical institute' },
    { name: 'Safdarjung Hospital', category: 'hospital', lat: 28.5674, lng: 77.2050, description: 'Emergency medical services' },
    { name: 'Lok Nayak Hospital', category: 'hospital', lat: 28.6360, lng: 77.2370, description: 'General hospital with trauma care' },

    // Clinics & Pharmacies
    { name: 'Community Pharmacy', category: 'pharmacy', lat: 28.6200, lng: 77.2150, description: 'Basic medical supplies and drugs' },
    { name: 'Connaught Place Clinic', category: 'clinic', lat: 28.6300, lng: 77.2210, description: 'Outpatient clinic' },

    // Shelters & Rally Points
    { name: 'Red Cross Shelter', category: 'shelter', lat: 28.6280, lng: 77.2195, description: 'Emergency shelter, 200 capacity' },
    { name: 'Bangla Sahib Shelter', category: 'shelter', lat: 28.6263, lng: 77.2091, description: 'Community shelter, meals served' },
    { name: 'Sacred Heart Shelter', category: 'shelter', lat: 28.6288, lng: 77.2062, description: 'Crisis housing' },
    { name: 'India Gate Rally Point', category: 'rally', lat: 28.6129, lng: 77.2295, description: 'Open area, easily visible landmark' },

    // Water Sources
    { name: 'Yamuna Water Point', category: 'water', lat: 28.6508, lng: 77.2405, description: 'Raw water station' },
    { name: 'Nehru Park Water Fountain', category: 'water', lat: 28.5910, lng: 77.1970, description: 'Public drinking water point' },
    { name: 'Lodhi Gardens Water Point', category: 'water', lat: 28.5930, lng: 77.2185, description: 'Filtered public water station' },

    // Food Distribution
    { name: 'Central Food Bank', category: 'food', lat: 28.6353, lng: 77.2249, description: 'Dry rations available' },
    { name: 'CP Soup Kitchen', category: 'food', lat: 28.6335, lng: 77.2190, description: 'Hot meals served daily' },
    { name: 'Sarojini Nagar Food Depot', category: 'food', lat: 28.5770, lng: 77.1980, description: 'Emergency food supplies' },

    // Police Stations
    { name: 'Delhi Police Headquarters', category: 'police', lat: 28.6276, lng: 77.2282, description: 'Central Police Command' },
    { name: 'Parliament House Police Station', category: 'police', lat: 28.6201, lng: 77.2098, description: 'Local security and police station' },
    { name: 'Connaught Place Police Station', category: 'police', lat: 28.6310, lng: 77.2180, description: 'CP police precinct' },

    // Fire Stations
    { name: 'Connaught Place Fire Station', category: 'fire', lat: 28.6304, lng: 77.2245, description: 'Central New Delhi Fire Station' },
    { name: 'Chanakyapuri Fire Station', category: 'fire', lat: 28.5982, lng: 77.1950, description: 'Emergency fire rescue squad' },

    // Danger Zones
    { name: 'Connaught Place Danger Zone', category: 'danger', lat: 28.6315, lng: 77.2167, description: 'Structural damage reported' }
  ];

  for (const poi of demoPOIs) {
    await addPOI(poi);
  }
}

export { db };
