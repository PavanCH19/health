import client, { unwrap } from './client';

export function parseJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
  } catch {
    return null;
  }
}

export function sessionFromToken(token) {
  const p = token ? parseJwt(token) : null;
  if (!p || (p.exp && p.exp * 1000 < Date.now())) return null;
  return { token, email: p.sub, role: String(p.role || '').toUpperCase() || null };
}

export async function login(email, password) {
  const data = unwrap(await client.post('/auth/login', { email, password }));
  return data; // { token, role }
}

export async function register({ email, password, confirmPassword, role }) {
  await client.post('/auth/register', { email, password, confirmPassword, role });
}
