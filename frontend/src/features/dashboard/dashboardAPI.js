import api from '../auth/authAPI';

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export async function getDonorDashboard(token = localStorage.getItem('token')) {
  return api.get('/dashboard/donor', { headers: authHeaders(token) });
}

export async function getHospitalDashboard(token = localStorage.getItem('token')) {
  return api.get('/dashboard/hospital', { headers: authHeaders(token) });
}

export default { getDonorDashboard, getHospitalDashboard };
