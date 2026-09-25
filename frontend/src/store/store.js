import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import { setUnauthorizedHandler } from '../api/client';
import { signedOut } from './authSlice';

const store = configureStore({ reducer: { auth: authReducer, ui: uiReducer } });

// An expired token on any request signs the user out everywhere.
setUnauthorizedHandler(() => store.dispatch(signedOut()));

export default store;
