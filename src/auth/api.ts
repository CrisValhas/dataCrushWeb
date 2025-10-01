import { apiFetch } from '../lib/api';

export async function login(email: string, password: string) {
  const res = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
  return res.data;
}

export async function register(email: string, password: string, displayName?: string) {
  const res = await apiFetch('/auth/register', { method: 'POST', body: { email, password, displayName } });
  return res.data;
}

export async function refresh() {
  const res = await apiFetch('/auth/refresh', { method: 'POST' });
  return res.data;
}

export async function me() {
  const res = await apiFetch('/me');
  return res.data;
}
