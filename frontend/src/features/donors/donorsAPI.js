import api, { generateAvatar, mapBloodGroupForDisplay } from '../auth/authAPI';

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

function splitLocation(location) {
  const parts = String(location || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts[0] || '',
    state: parts[parts.length - 1] || '',
  };
}

export function mapDistrictDonorCount(item) {
  return {
    district: item.district || '-',
    donors: Number(item.donorCount ?? item.donors ?? 0),
  };
}

export function mapDonor(item, index = 0) {
  const { city, state } = splitLocation(item.location);
  const name = item.fullName || item.name || 'Unknown donor';

  return {
    id: item.id ?? item.donorId ?? `${name}-${index}`,
    initials: item.initials || generateAvatar(name),
    name,
    fullName: name,
    blood: mapBloodGroupForDisplay(item.bloodGroup),
    bloodGroup: mapBloodGroupForDisplay(item.bloodGroup),
    location: item.location || [city, state].filter(Boolean).join(', ') || '-',
    village: city || '-',
    city,
    state,
    available: item.available ?? true,
    lastDonated: item.lastDonated || item.lastDonation || '-',
    phone: item.phone,
  };
}

export async function getDistrictDonorCount(token = localStorage.getItem('token')) {
  const response = await api.get('/donors/district-count', {
    headers: authHeaders(token),
  });
  const counts = response?.data?.data || [];

  return {
    ...response,
    data: {
      ...response.data,
      data: counts.map(mapDistrictDonorCount),
    },
  };
}

export async function getAllDonors(token = localStorage.getItem('token')) {
  const response = await api.get('/donors/all', {
    headers: authHeaders(token),
  });
  const donors = response?.data?.data || [];

  return {
    ...response,
    data: {
      ...response.data,
      data: donors.map(mapDonor),
    },
  };
}

export default { getDistrictDonorCount, getAllDonors };
