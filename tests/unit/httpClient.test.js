import { afterEach, expect, it, vi } from 'vitest';
import {
  ApiError,
  createHttpClient,
} from '../../src/infrastructure/http/createHttpClient.js';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
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

it.each([502, 503, 504])(
  'turns a proxy %s HTML response into a readable API error',
  async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON');
        },
      }),
    );
    const http = createHttpClient({ baseUrl: '/api/v1' });
    const error = await http.request('/products').catch((error) => error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Serverul nu este disponibil momentan. Încearcă din nou.',
    });
  },
);

it.each([null, 'not an API response', []])(
  'rejects an unexpected successful JSON payload: %j',
  async (body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => body,
      }),
    );
    const http = createHttpClient({ baseUrl: '/api/v1' });
    await expect(http.request('/products')).rejects.toMatchObject({
      status: 200,
      code: 'INVALID_RESPONSE',
    });
  },
);

it('rejects an invalid successful response without exposing its parse error', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    }),
  );
  const http = createHttpClient({ baseUrl: '/api/v1' });
  await expect(http.request('/products')).rejects.toMatchObject({
    code: 'INVALID_RESPONSE',
    message: 'Serverul a trimis un răspuns neașteptat. Încearcă din nou.',
  });
});

it('preserves structured API validation errors', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        code: 'INVALID_INPUT',
        message: 'Date invalide.',
        fieldErrors: { title: 'Titlul este obligatoriu.' },
        requestId: 'request-example',
      }),
    }),
  );
  const http = createHttpClient({ baseUrl: '/api/v1' });
  await expect(http.request('/products')).rejects.toMatchObject({
    status: 400,
    code: 'INVALID_INPUT',
    message: 'Date invalide.',
    fieldErrors: { title: 'Titlul este obligatoriu.' },
    requestId: 'request-example',
  });
});

it('expires the session even when a 401 response does not contain JSON', async () => {
  const dispatch = vi.spyOn(window, 'dispatchEvent');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input');
      },
    }),
  );
  const http = createHttpClient({ baseUrl: '/api/v1' });
  await expect(http.request('/orders')).rejects.toMatchObject({
    status: 401,
    code: 'HTTP_ERROR',
  });
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'dinsat:session-expired' }),
  );
});

it('handles a disconnected response body as a network error', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new TypeError('Terminated');
      },
    }),
  );
  const http = createHttpClient({ baseUrl: '/api/v1' });
  await expect(http.request('/products')).rejects.toMatchObject({
    status: 0,
    code: 'NETWORK_ERROR',
  });
});

it('retains AbortError when a response body is cancelled', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new DOMException('Cancelled', 'AbortError');
      },
    }),
  );
  const http = createHttpClient({ baseUrl: '/api/v1' });
  await expect(http.request('/products')).rejects.toMatchObject({
    name: 'AbortError',
  });
});
