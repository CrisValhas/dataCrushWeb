const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) { accessToken = token; }

export async function apiFetch<T = any>(path: string, opts?: { method?: string; body?: any; headers?: Record<string, string> }): Promise<{ data: T }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts?.headers || {}),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(API_URL + path, {
    method: opts?.method || 'GET',
    headers,
    credentials: 'include',
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401) {
    // try refresh
    const r = await fetch(API_URL + '/auth/refresh', { method: 'POST', credentials: 'include' });
    if (r.ok) {
      const { data } = await r.json();
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        return apiFetch(path, opts);
      }
    }
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}
