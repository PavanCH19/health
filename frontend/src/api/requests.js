import client, { unwrap } from './client';

/** Hospital: create a request. Returns the new request id. */
export async function createRequest(payload) {
  const data = unwrap(await client.post('/requestBlood', payload));
  return data?.requestId;
}

/** Hospital: my requests, newest first. */
export const getMyRequests = async () => (unwrap(await client.get('/requestBlood/my')) || []);

/** Hospital: change status (OPEN, MATCHING, FULFILLED, CANCELLED). */
export const updateRequestStatus = (id, status) =>
  client.patch(`/requestBlood/${id}/status`, null, { params: { status } });

/**
 * Hospital: find compatible, available, eligible donors around the request and
 * notify them. Note: this has side effects (creates matches + notifications).
 */
export const notifyDonorsForRequest = async (bloodReqId, radiusKm) =>
  (unwrap(await client.get('/requestBlood/nearby', { params: { bloodReqId, radiusKm } })) || []);

/** Donor: open requests near me that my blood group can serve. */
export const getNearbyRequests = async (radiusKm) =>
  (unwrap(await client.get('/requestBlood/nearby-requests', { params: { radiusKm } })) || []);
