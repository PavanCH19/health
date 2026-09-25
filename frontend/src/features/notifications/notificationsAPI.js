import api from '../auth/authAPI';

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

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

function mapNotificationType(type) {
  const value = String(type || '').toUpperCase();
  if (value === 'URGENT_REQUEST') return 'urgent';
  if (value === 'REQUEST_ACCEPTED') return 'success';
  if (value === 'DONATION_REMINDER') return 'info';
  return 'info';
}

export function mapNotification(item) {
  return {
    id: item.id,
    type: mapNotificationType(item.type),
    rawType: item.type,
    title: item.title,
    body: item.body,
    read: Boolean(item.read),
    createdAt: item.createdAt,
    time: formatTimeAgo(item.createdAt),
  };
}

export async function getNotifications(token = localStorage.getItem('token')) {
  const response = await api.get('/notifications', { headers: authHeaders(token) });
  const notifications = response?.data?.data || [];

  return {
    ...response,
    data: {
      ...response.data,
      data: notifications.map(mapNotification),
    },
  };
}

export async function markNotificationRead(id, token = localStorage.getItem('token')) {
  return api.patch(`/notifications/${id}/read`, null, { headers: authHeaders(token) });
}

export async function getUnreadNotificationCount(token = localStorage.getItem('token')) {
  return api.get('/notifications/unread-count', { headers: authHeaders(token) });
}

export default { getNotifications, markNotificationRead, getUnreadNotificationCount };
