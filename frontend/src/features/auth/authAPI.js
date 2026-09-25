import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function login(payload) {
  return api.post('/auth/login', payload);
}

export async function register(payload) {
  return api.post('/auth/register', payload);
}

export async function completeProfile(payload) {
  return api.post('/auth/profile', payload);
}

export function normalizeRole(role) {
  if (Array.isArray(role)) {
    return normalizeRole(role[0]);
  }

  if (role && typeof role === 'object') {
    return normalizeRole(role.role || role.authority || role.name);
  }

  const value = String(role || '').toUpperCase();
  if (value.includes('HOSPITAL')) return 'HOSPITAL';
  if (value.includes('DONOR')) return 'DONOR';
  return null;
}

export function extractRoleFromToken(token) {
  if (!token || typeof token !== 'string') return null;

  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decodedPayload = JSON.parse(atob(normalizedPayload));

    const role =
      decodedPayload.role ||
      decodedPayload.Role ||
      decodedPayload.roles ||
      decodedPayload.authorities ||
      decodedPayload.authority ||
      decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      null;

    return normalizeRole(role);
  } catch {
    return null;
  }
}

export function mapBloodGroupForDisplay(bloodGroup) {
  const bloodGroups = {
    A_POS: 'A+',
    A_NEG: 'A-',
    A_POSITIVE: 'A+',
    A_NEGATIVE: 'A-',
    B_POS: 'B+',
    B_NEG: 'B-',
    B_POSITIVE: 'B+',
    B_NEGATIVE: 'B-',
    AB_POS: 'AB+',
    AB_NEG: 'AB-',
    AB_POSITIVE: 'AB+',
    AB_NEGATIVE: 'AB-',
    O_POS: 'O+',
    O_NEG: 'O-',
    O_POSITIVE: 'O+',
    O_NEGATIVE: 'O-',
  };

  return bloodGroups[bloodGroup] || bloodGroup || null;
}

export function generateAvatar(name) {
  return (
    name
      ?.split(' ')
      ?.filter(Boolean)
      ?.map((word) => word[0])
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || ''
  );
}

export function mapProfileToDashboardUser(profile, token = localStorage.getItem('token')) {
  const data = profile || {};
  const role = extractRoleFromToken(token) || normalizeRole(localStorage.getItem('role'));
  const name = data.name || data.hospitalName || data.hospital || '';
  const village = data.village || '';

  return {
    id: data.id,
    name,
    role,
    hospital: data.hospital || data.hospitalName,
    hospitalName: data.hospitalName || data.hospital,
    licenseNumber: data.licenseNumber,
    emergencyContact: data.emergencyContact,
    website: data.website,
    bloodGroup: mapBloodGroupForDisplay(data.bloodGroup),
    location: [data.district, data.state].filter(Boolean).join(', '),
    city: village,
    village,
    district: data.district,
    state: data.state,
    email: data.email,
    phone: data.phone,
    lastDonation: null,
    totalDonations: 0,
    available: true,
    avatar: generateAvatar(name),
    createdAt: data.createdAt,
    lat: data.lat,
    lng: data.lng ?? data.lon,
  };
}

export default api;
