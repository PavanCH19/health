import { createSlice } from '@reduxjs/toolkit';
import { sessionFromToken } from '../api/auth';
import { tokenStore } from '../api/client';

const existing = sessionFromToken(tokenStore.get());
if (!existing) tokenStore.clear();

const initialState = {
  token: existing?.token ?? null,
  email: existing?.email ?? null,
  role: existing?.role ?? null,
  profile: null,
  // idle -> loading -> ready | missing (needs onboarding) | error
  profileStatus: 'idle',
  profileError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn(state, { payload }) {
      Object.assign(state, initialState, payload);
      state.profile = null;
      state.profileStatus = 'idle';
    },
    profileLoading(state) {
      state.profileStatus = 'loading';
      state.profileError = null;
    },
    profileLoaded(state, { payload }) {
      state.profile = payload;
      state.profileStatus = 'ready';
    },
    profileMissing(state) {
      state.profile = null;
      state.profileStatus = 'missing';
    },
    profileFailed(state, { payload }) {
      state.profileStatus = 'error';
      state.profileError = payload;
    },
    profilePatched(state, { payload }) {
      state.profile = { ...state.profile, ...payload };
    },
    signedOut() {
      return { ...initialState, token: null, email: null, role: null };
    },
  },
});

export const { signedIn, profileLoading, profileLoaded, profileMissing, profileFailed, profilePatched, signedOut } =
  authSlice.actions;
export default authSlice.reducer;
