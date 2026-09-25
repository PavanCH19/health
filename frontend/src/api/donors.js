import client, { unwrap } from './client';

/**
 * Hospital donor search (read-only, no notifications).
 * params: { lat, lon, radiusKm, forRecipient, bloodGroup, city, available }
 */
export async function searchDonors(params) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
  return unwrap(await client.get('/donors/search', { params: clean })) || [];
}

export const getAllDonors = async () => unwrap(await client.get('/donors/all')) || [];
export const getDistrictCounts = async () => unwrap(await client.get('/donors/district-count')) || [];
