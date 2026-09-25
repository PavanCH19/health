import client, { unwrap } from './client';

export const getDonorDashboard = async () => unwrap(await client.get('/dashboard/donor'));
export const getHospitalDashboard = async () => unwrap(await client.get('/dashboard/hospital'));
