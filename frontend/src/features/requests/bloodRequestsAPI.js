import api, { mapBloodGroupForDisplay } from '../auth/authAPI';

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export function mapBloodGroupForApi(bloodGroup) {
  const value = String(bloodGroup || '')
    .replace(/\u2212/g, '-')
    .replace(/âˆ’/g, '-')
    .trim()
    .toUpperCase();

  const bloodGroups = {
    'A+': 'A_POS',
    'A-': 'A_NEG',
    'B+': 'B_POS',
    'B-': 'B_NEG',
    'AB+': 'AB_POS',
    'AB-': 'AB_NEG',
    'O+': 'O_POS',
    'O-': 'O_NEG',
  };

  return bloodGroups[value] || bloodGroup || undefined;
}

export function mapUrgencyForApi(urgency) {
  const urgencyMap = {
    Normal: 'LOW',
    Medium: 'MEDIUM',
    Urgent: 'HIGH',
    Critical: 'CRITICAL',
  };

  return urgencyMap[urgency] || String(urgency || 'LOW').toUpperCase();
}

function formatUrgency(urgency) {
  const value = String(urgency || '').toUpperCase();
  if (value === 'CRITICAL') return 'Critical';
  if (value === 'HIGH') return 'Urgent';
  if (value === 'MEDIUM') return 'Medium';
  if (value === 'NORMAL' || value === 'LOW') return 'Normal';
  return urgency || 'Normal';
}

function formatDistance(distanceKm) {
  const distance = Number(distanceKm);
  if (Number.isNaN(distance)) return '-';
  return `${distance.toFixed(1)} km`;
}

function formatStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'OPEN' || value === 'PENDING') return 'Pending';
  if (value === 'MATCHING') return 'Matching';
  if (value === 'FULFILLED' || value === 'COMPLETED') return 'Fulfilled';
  if (value === 'CANCELLED' || value === 'CANCELED') return 'Cancelled';
  return status || 'Pending';
}

function formatTimeAgo(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function mapNearbyRequest(item) {
  const units = item.units ?? item.unitsRequired;
  const id = item.id ?? item.requestId ?? item.request_id ?? item.requestID ?? item._id;
  const requestId = item.requestId ?? item.id ?? item.request_id ?? item.requestID ?? item._id;

  return {
    id,
    requestId,
    bloodType: mapBloodGroupForDisplay(item.bloodGroup),
    bloodGroup: mapBloodGroupForDisplay(item.bloodGroup),
    hospital: item.hospitalName,
    hospitalName: item.hospitalName,
    location: item.city || item.district || item.state || '-',
    city: item.city,
    district: item.district,
    state: item.state,
    urgency: formatUrgency(item.urgency),
    status: formatStatus(item.status),
    rawStatus: item.status,
    units,
    qty: units,
    recipientName: item.recipientName || item.patientName,
    time: formatTimeAgo(item.createdAt),
    date: formatTimeAgo(item.createdAt),
    distance: formatDistance(item.distanceKm),
    distanceKm: item.distanceKm,
    lat: item.lat,
    lng: item.lng ?? item.lon ?? item.longitude,
    createdAt: item.createdAt,
    requiredBefore: item.requiredBefore,
    notes: item.notes,
  };
}

export function mapNearbyDonor(item) {
  const city = item.city || item.village || '';

  return {
    id: item.id,
    name: item.name || item.fullName || 'Unknown donor',
    bloodGroup: mapBloodGroupForDisplay(item.bloodGroup),
    blood: mapBloodGroupForDisplay(item.bloodGroup),
    city,
    village: city,
    district: item.district,
    state: item.state,
    location: [city, item.district, item.state].filter(Boolean).join(', ') || '-',
    distance: formatDistance(item.distanceKm).replace(' km', ''),
    distanceLabel: formatDistance(item.distanceKm),
    distanceKm: item.distanceKm,
    available: item.available ?? true,
    lastDonated: item.lastDonated || item.lastDonation || '-',
    phone: item.phone,
    lat: item.lat ?? item.latitude,
    lng: item.lng ?? item.lon ?? item.longitude,
  };
}

export async function getNearbyBloodRequests(radiusKm = 10, token = localStorage.getItem('token')) {
  const response = await api.get('/requestBlood/nearby-requests', {
    headers: authHeaders(token),
    params: { radiusKm },
  });
  const requests = response?.data?.data || [];

  return {
    ...response,
    data: {
      ...response.data,
      data: requests.map(mapNearbyRequest),
    },
  };
}

export async function getNearbyDonors(filters = {}, token = localStorage.getItem('token')) {
  const params = {
    ...filters,
    bloodGroup: mapBloodGroupForApi(filters.bloodGroup),
  };

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined || params[key] === null || params[key] === '') {
      delete params[key];
    }
  });

  const response = await api.get('/donors/search', {
    headers: authHeaders(token),
    params,
  });
  const donors = response?.data?.data || [];

  return {
    ...response,
    data: {
      ...response.data,
      data: donors.map(mapNearbyDonor),
    },
  };
}

export async function getNearbyDonorsForBloodRequest({ radiusKm, bloodReqId } = {}, token = localStorage.getItem('token')) {
  const params = { radiusKm, bloodReqId };

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined || params[key] === null || params[key] === '') {
      delete params[key];
    }
  });

  const response = await api.get('/requestBlood/nearby', {
    headers: authHeaders(token),
    params,
  });
  const donors = response?.data?.data || [];

  return {
    ...response,
    data: {
      ...response.data,
      data: donors.map(mapNearbyDonor),
    },
  };
}

export async function createBloodRequest(payload, token = localStorage.getItem('token')) {
  const response = await api.post('/requestBlood', payload, {
    headers: authHeaders(token),
  });

  return response;
}

export async function getMyBloodRequests(token = localStorage.getItem('token')) {
  const response = await api.get('/requestBlood/my', {
    headers: authHeaders(token),
  });
  const requests = response?.data?.data || [];

  return {
    ...response,
    data: {
      ...response.data,
      data: requests.map(mapNearbyRequest),
    },
  };
}

export async function updateBloodRequestStatus(id, status, token = localStorage.getItem('token')) {
  const headers = authHeaders(token);

  let url = null;
  let params = null;

  // If id is a numeric id (number or numeric string) call existing endpoint
  if (id && (typeof id === 'number' || /^\d+$/.test(String(id)))) {
    url = `/requestBlood/${id}/status`;
    params = { status };
  } else if (id && typeof id === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(id)) {
    // If id looks like an ISO timestamp (createdAt), call a fallback endpoint
    // Backend should implement this endpoint: PATCH /requestBlood/status-by-createdAt?createdAt=...&status=...
    url = `/requestBlood/status-by-createdAt`;
    params = { createdAt: id, status };
  }

  if (!url) {
    console.error('updateBloodRequestStatus: invalid identifier', { id, status });
    throw new Error('Invalid request identifier for status update');
  }

  // Log full URL and payload for debugging (shows actual request sent)
  try {
    const base = String(api.defaults.baseURL || '');
    const fullUrl = base ? `${base.replace(/\/$/, '')}${url}` : url;
    console.info('Sending PATCH request', { method: 'PATCH', url: fullUrl, params, headers });
  } catch (e) {
    console.info('Sending PATCH (unable to build fullUrl)', { url, params });
  }

  return api.patch(url, null, { headers, params });
}

export default {
  getNearbyBloodRequests,
  getNearbyDonors,
  getNearbyDonorsForBloodRequest,
  createBloodRequest,
  getMyBloodRequests,
  updateBloodRequestStatus,
};
