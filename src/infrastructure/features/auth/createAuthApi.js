export function createAuthApi(http) {
  return {
    session: () => http.getSession(),
    login: (input) =>
      http.request('/auth/login', { method: 'POST', body: input }),
    register: (input) =>
      http.request('/auth/register', { method: 'POST', body: input }),
    async logout() {
      await http.request('/auth/logout', { method: 'POST' });
      http.clearSession();
    },
  };
}
