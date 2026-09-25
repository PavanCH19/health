import client, { unwrap } from './client';

export const getUsers = async () => unwrap(await client.get('/admin/users')) || [];
export const getPendingHospitals = async () => unwrap(await client.get('/admin/hospitals/pending')) || [];
export const verifyHospital = (id) => client.patch(`/admin/hospitals/${id}/verify`);
export const blockUser = (id) => client.patch(`/admin/users/${id}/block`);
export const unblockUser = (id) => client.patch(`/admin/users/${id}/unblock`);
