import axios from 'axios';

const TOKEN_KEY = 'bc_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 20000,
});

client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    // An expired/invalid token on a protected call ends the session.
    if (err.response?.status === 401 && !url.startsWith('/auth/')) {
      tokenStore.clear();
      onUnauthorized();
    }
    return Promise.reject(err);
  },
);

/** Backend wraps every success as { status, success, message, data }. */
export const unwrap = (res) => res.data?.data;

/** Readable message from the backend's error shapes (fieldErrors / message). */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length) {
    return Object.values(data.fieldErrors).join('. ');
  }
  if (data?.message) return data.message;
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Make sure the backend is running on port 8080.';
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond.';
  return err?.message || fallback;
}

export const statusOf = (err) => err?.response?.status;

export default client;
