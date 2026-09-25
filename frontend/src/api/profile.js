import client, { unwrap } from './client';

// ---- donor ----
export const getDonorProfile = async () => unwrap(await client.get('/Profile/me'));
export const createDonorProfile = async (payload) => client.post('/Profile/CompleteProfile', payload);
export const updateDonorProfile = async (payload) => client.patch('/Profile/updateProfile', payload);
export const deleteDonorProfile = async () => client.delete('/Profile/deleteProfile');

// ---- hospital ----
export const getHospitalProfile = async () => unwrap(await client.get('/hospital/me'));
export const createHospitalProfile = async (payload) => client.post('/hospital/completeHospitalDetails', payload);
export const updateHospitalProfile = async (payload) => client.patch('/hospital/update', payload);
export const deleteHospitalProfile = async () => client.delete('/hospital/delete');
