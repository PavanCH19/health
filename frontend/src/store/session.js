import { errorMessage, statusOf, tokenStore } from '../api/client';
import { sessionFromToken } from '../api/auth';
import { getDonorProfile, getHospitalProfile } from '../api/profile';
import { profileFailed, profileLoaded, profileLoading, profileMissing, signedIn, signedOut } from './authSlice';

/** Loads the role-specific profile. A 404 means the user still has to onboard. */
export const loadProfile = () => async (dispatch, getState) => {
  const { role } = getState().auth;
  if (role === 'ADMIN') {
    dispatch(profileLoaded({}));
    return;
  }
  dispatch(profileLoading());
  try {
    const profile = role === 'HOSPITAL' ? await getHospitalProfile() : await getDonorProfile();
    dispatch(profileLoaded(profile));
  } catch (err) {
    if (statusOf(err) === 404) dispatch(profileMissing());
    else if (statusOf(err) !== 401) dispatch(profileFailed(errorMessage(err)));
  }
};

export const startSession = (token) => async (dispatch) => {
  const session = sessionFromToken(token);
  if (!session) throw new Error('The server returned an invalid session token.');
  tokenStore.set(token);
  dispatch(signedIn(session));
  await dispatch(loadProfile());
};

export const endSession = () => (dispatch) => {
  tokenStore.clear();
  dispatch(signedOut());
};
