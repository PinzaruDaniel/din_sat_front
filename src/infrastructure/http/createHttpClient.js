export class ApiError extends Error {
  constructor(status, body) {
    super(body.message || 'Cererea nu a reușit. Încearcă din nou.');
    Object.assign(this, {
      status,
      code: body.code,
      fieldErrors: body.fieldErrors,
      requestId: body.requestId,
    });
  }
}

export function createHttpClient({ baseUrl }) {
  let csrfToken;
  let sessionRequest;
  async function request(path, { method = 'GET', body, headers, signal } = {}) {
    if (method !== 'GET' && !csrfToken) await getSession();
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        signal,
        credentials: 'include',
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(method !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError(0, {
        code: 'NETWORK_ERROR',
        message:
          'Nu putem contacta serverul. Verifică conexiunea și încearcă din nou.',
      });
    }
    const result = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      if (response.status === 401 && !path.startsWith('/auth/'))
        window.dispatchEvent(new Event('dinsat:session-expired'));
      if (result.code === 'CSRF_INVALID') csrfToken = undefined;
      throw new ApiError(response.status, result);
    }
    if (result?.csrfToken) csrfToken = result.csrfToken;
    return result;
  }
  function getSession() {
    sessionRequest ??= request('/auth/session').finally(() => {
      sessionRequest = undefined;
    });
    return sessionRequest;
  }
  return {
    request,
    getSession,
    clearSession: () => {
      csrfToken = undefined;
    },
  };
}
