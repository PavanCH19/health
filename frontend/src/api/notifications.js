import client, { unwrap } from './client';

export const getNotifications = async () => unwrap(await client.get('/notifications')) || [];
export const markNotificationRead = (id) => client.patch(`/notifications/${id}/read`);
export const getUnreadCount = async () => (unwrap(await client.get('/notifications/unread-count')) || {}).count || 0;
