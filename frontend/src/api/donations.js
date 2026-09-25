import client, { unwrap } from './client';

export const getMyDonations = async () => unwrap(await client.get('/donations/my')) || [];
export const createDonation = async (payload) => unwrap(await client.post('/donations', payload));
