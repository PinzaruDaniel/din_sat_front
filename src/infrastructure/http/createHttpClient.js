export class ApiError extends Error {
  constructor(status, body) {
    super(
      typeof body.message === 'string' && body.message
        ? body.message
        : 'Cererea nu a reușit. Încearcă din nou.',
    );
    Object.assign(this, {
      status,
      code: body.code,
      fieldErrors: body.fieldErrors,
      requestId: body.requestId,
    });
  }
}

function networkError() {
  return new ApiError(0, {
    code: 'NETWORK_ERROR',
    message:
      'Nu putem contacta serverul. Verifică conexiunea și încearcă din nou.',
  });
}

export function createHttpClient({ baseUrl }) {
  let csrfToken;
  let sessionRequest;
  async function request(path, { method = 'GET', body, headers, signal } = {}) {
    if (method !== 'GET' && !csrfToken) await getSession();
    const binaryBody = body instanceof Blob;
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        signal,
        credentials: 'include',
        headers: {
          ...(body
            ? { 'Content-Type': binaryBody ? body.type : 'application/json' }
            : {}),
          ...(method !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}),
          ...headers,
        },
        body: binaryBody ? body : body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw networkError();
    }
    let result = null;
    if (response.status !== 204) {
      try {
        result = await response.json();
      } catch (error) {
        if (error?.name === 'AbortError') throw error;
        if (!(error instanceof SyntaxError)) throw networkError();
      }
    }
    const hasBody =
      result !== null && typeof result === 'object' && !Array.isArray(result);
    if (!response.ok) {
      if (response.status === 401 && !path.startsWith('/auth/')) {
        csrfToken = undefined;
        window.dispatchEvent(new Event('dinsat:session-expired'));
      }
      if (method !== 'GET' && hasBody && result.code === 'CSRF_INVALID') {
        csrfToken = undefined;
        try {
          const session = await getSession();
          window.dispatchEvent(
            session.user
              ? new CustomEvent('dinsat:session-refreshed', {
                  detail: session.user,
                })
              : new Event('dinsat:session-expired'),
          );
        } catch {
          // Preserve the error from the original mutation.
        }
      }
      throw new ApiError(
        response.status,
        hasBody
          ? result
          : {
              code:
                response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'HTTP_ERROR',
              message:
                response.status >= 500
                  ? 'Serverul nu este disponibil momentan. Încearcă din nou.'
                  : 'Cererea nu a reușit. Încearcă din nou.',
            },
      );
    }
    if (response.status !== 204 && !hasBody) {
      throw new ApiError(response.status, {
        code: 'INVALID_RESPONSE',
        message: 'Serverul a trimis un răspuns neașteptat. Încearcă din nou.',
      });
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
