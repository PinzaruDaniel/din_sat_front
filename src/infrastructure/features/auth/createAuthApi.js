export function createAuthApi(http) {
  return {
    async session() {
      try {
        return await http.request('/auth/me');
      } catch (error) {
        if (error.status === 401) return { user: null };
        throw error;
      }
    },
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
