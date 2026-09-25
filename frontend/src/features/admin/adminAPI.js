import api from '../auth/authAPI';

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export async function getAdminUsers(token = localStorage.getItem('token')) {
  return api.get('/admin/users', { headers: authHeaders(token) });
}

export async function getPendingHospitals(token = localStorage.getItem('token')) {
  return api.get('/admin/hospitals/pending', { headers: authHeaders(token) });
}

export async function verifyHospital(id, token = localStorage.getItem('token')) {
  return api.patch(`/admin/hospitals/${id}/verify`, null, { headers: authHeaders(token) });
}

export async function blockUser(id, token = localStorage.getItem('token')) {
  return api.patch(`/admin/users/${id}/block`, null, { headers: authHeaders(token) });
}

export async function unblockUser(id, token = localStorage.getItem('token')) {
  return api.patch(`/admin/users/${id}/unblock`, null, { headers: authHeaders(token) });
}

export default { getAdminUsers, getPendingHospitals, verifyHospital, blockUser, unblockUser };
