export function createAuthActions(api) {
  const normalize = (input) => ({
    ...input,
    email: input.email.trim().toLowerCase(),
    ...(input.name ? { name: input.name.trim() } : {}),
  });
  return {
    session: api.session,
    login: (input) => api.login(normalize(input)),
    register: (input) => api.register(normalize(input)),
    logout: api.logout,
  };
}
