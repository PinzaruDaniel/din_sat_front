import { afterEach, expect, it, vi } from 'vitest';
import { createHttpClient } from '../../src/infrastructure/http/createHttpClient.js';
afterEach(() => vi.unstubAllGlobals());
it('bootstraps CSRF and sends credentialed mutations with the current token', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ user: null, csrfToken: 'session-token' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ csrfToken: 'rotated-token', user: { id: 'a' } }),
    })
    .mockResolvedValueOnce({ ok: true, status: 204 });
  vi.stubGlobal('fetch', fetch);
  const http = createHttpClient({ baseUrl: '/api/v1' });
  await http.request('/auth/login', {
    method: 'POST',
    body: { email: 'a@example.md' },
  });
  expect(fetch.mock.calls[1][1]).toMatchObject({
    credentials: 'include',
    headers: { 'X-CSRF-Token': 'session-token' },
  });
  await http.request('/auth/logout', { method: 'POST' });
  expect(fetch.mock.calls[2][1].headers['X-CSRF-Token']).toBe('rotated-token');
});
it('returns a readable network error and retains AbortError for cancelled searches', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError')),
  );
  const http = createHttpClient({ baseUrl: '/api/v1' });
  await expect(http.request('/products')).rejects.toMatchObject({
    code: 'NETWORK_ERROR',
  });
  await expect(http.request('/products')).rejects.toMatchObject({
    name: 'AbortError',
  });
});
