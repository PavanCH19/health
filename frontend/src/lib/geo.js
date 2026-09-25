// Place search, reverse geocoding and distance helpers (OpenStreetMap Nominatim).
// Nominatim's usage policy: max 1 request/second, no keystroke autocomplete.
// So searches run on submit, are queued 1.1s apart, and results are cached.

const NOMINATIM = 'https://nominatim.openstreetmap.org';

// Rough bounding box of Karnataka (lon1,lat1,lon2,lat2) - used to bias, not restrict, results
const KARNATAKA_VIEWBOX = '74.05,18.45,78.6,11.5';

export const KARNATAKA_CENTER = { lat: 14.6, lng: 75.9 };

const cache = new Map();
let queue = Promise.resolve();
let lastCall = 0;

function throttled(fn) {
  const run = queue.then(async () => {
    const wait = Math.max(0, lastCall + 1100 - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => {});
  return run;
}

async function getJson(path, params) {
  const url = `${NOMINATIM}${path}?${new URLSearchParams({ format: 'jsonv2', addressdetails: '1', 'accept-language': 'en', ...params })}`;
  if (cache.has(url)) return cache.get(url);
  const data = await throttled(async () => {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Place search is unavailable right now. Try again in a moment.');
    return res.json();
  });
  cache.set(url, data);
  return data;
}

/** Map a Nominatim address to the fields the backend stores. */
export function parseAddress(a = {}) {
  const village = a.village || a.hamlet || '';
  const city = a.city || a.town || a.municipality || a.suburb || a.village || a.county || a.state_district || '';
  const district = a.state_district || a.county || a.district || '';
  return { village, city, district, state: a.state || '' };
}

function toPlace(item) {
  return {
    lat: Number(item.lat),
    lon: Number(item.lon),
    label: item.display_name,
    ...parseAddress(item.address),
  };
}

/** Free-text search, biased to Karnataka but not limited to it. */
export async function searchPlaces(query, limit = 5) {
  const q = query.trim();
  if (q.length < 3) return [];
  const data = await getJson('/search', {
    q, limit: String(limit), countrycodes: 'in', viewbox: KARNATAKA_VIEWBOX, bounded: '0',
  });
  return data.map(toPlace);
}

export async function reversePlace(lat, lon) {
  const item = await getJson('/reverse', { lat: String(lat), lon: String(lon), zoom: '14' });
  if (!item || item.error) return { lat, lon, label: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, village: '', city: '', district: '', state: '' };
  return { ...toPlace(item), lat, lon };
}

/**
 * Geocode a Karnataka village/taluk/district selection, falling back from the
 * most specific to the least specific. `precision` tells the UI how exact it is.
 */
export async function geocodeKarnataka({ village, taluk, district }) {
  const attempts = [];
  if (village) attempts.push({ q: `${village}, ${taluk}, ${district}, Karnataka, India`, precision: 'village' });
  if (taluk) attempts.push({ q: `${taluk}, ${district}, Karnataka, India`, precision: 'taluk' });
  if (district) attempts.push({ q: `${district} district, Karnataka, India`, precision: 'district' });

  for (const { q, precision } of attempts) {
    const data = await getJson('/search', { q, limit: '1', countrycodes: 'in' });
    if (data[0]) {
      const place = toPlace(data[0]);
      return {
        ...place,
        village: village || place.village,
        city: taluk || place.city,
        district: district || place.district,
        state: 'Karnataka',
        precision,
      };
    }
  }
  return null;
}

export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('This browser cannot share your location.'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? 'Location permission was denied. Search for a place instead.' : 'Could not read your location.')),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const hasCoords = (o) => o && Number.isFinite(Number(o.lat)) && Number.isFinite(Number(o.lon ?? o.lng));
