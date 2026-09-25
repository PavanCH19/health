import api, { mapBloodGroupForDisplay } from '../auth/authAPI';

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

function formatDonationDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatStatus(status) {
  if (!status) return '-';

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function mapDonationHistoryItem(item) {
  return {
    id: item.id,
    requestId: item.requestId,
    recipientName: item.recipientName,
    hospital: item.hospitalName,
    units: item.units,
    date: formatDonationDate(item.donationDate),
    donationDate: item.donationDate,
    bloodGroup: mapBloodGroupForDisplay(item.bloodGroup),
    status: formatStatus(item.status),
    certificate: Boolean(item.certificateAvailable),
    certificateUrl: item.certificateUrl,
  };
}

export async function getMyDonations(token = localStorage.getItem('token')) {
  const response = await api.get('/donations/my', { headers: authHeaders(token) });
  const donations = response?.data?.data || [];

  return {
    ...response,
    data: {
      ...response.data,
      data: donations.map(mapDonationHistoryItem),
    },
  };
}

export async function createDonation(payload, token = localStorage.getItem('token')) {
  return api.post('/donations', payload, { headers: authHeaders(token) });
}

export default { getMyDonations, createDonation };
