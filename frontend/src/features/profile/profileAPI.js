import api, { extractRoleFromToken, normalizeRole } from '../auth/authAPI';

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export async function getProfile(token) {
  console.log('Fetching profile with token:', token);
  return api.get('/Profile/me', { headers: authHeaders(token) });
}

export async function getHospitalProfile(token) {
  return api.get('/hospital/me', { headers: authHeaders(token) });
}

export async function updateProfile(payload, token) {
  console.log("Updating donor profile:", payload);

  return api.patch('/Profile/updateProfile', payload, { headers: authHeaders(token), });
}

export async function fetchProfile() {
  const token = localStorage.getItem('token');
  const role = extractRoleFromToken(token) || normalizeRole(localStorage.getItem('role'));
  console.log('Extracted role:', role);
  if (role) {
    localStorage.setItem('role', role);
  }

  if (role === 'DONOR') {
    return getProfile(token);
  }

  if (role === 'HOSPITAL') {
    return getHospitalProfile(token);
  }

  throw new Error('Unknown user role');
}

export async function completeProfile(payload, token) {
  return api.post('/Profile/CompleteProfile', payload, { headers: authHeaders(token) });
}

export async function completeHospitalProfile(payload, token) {
  return api.post('/hospital/completeHospitalDetails', payload, { headers: authHeaders(token) });
}

export async function updateHospitalProfile(payload, token) {
  return api.patch('/hospital/update', payload, { headers: authHeaders(token) });
}

export async function deleteProfile(token = localStorage.getItem('token')) {
  return api.delete('/Profile/deleteProfile', { headers: authHeaders(token) });
}

export async function deleteHospitalProfile(token = localStorage.getItem('token')) {
  return api.delete('/hospital/delete', { headers: authHeaders(token) });
}

export default {
  getProfile,
  getHospitalProfile,
  fetchProfile,
  updateProfile,
  updateHospitalProfile,
  completeProfile,
  completeHospitalProfile,
  deleteProfile,
  deleteHospitalProfile,
};
