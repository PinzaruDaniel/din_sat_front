export function createDashboardApi(http) {
  return {
    read(period, signal) {
      const path = '/producer/dashboard';
      const query = period ? `?${new URLSearchParams(period)}` : '';
      return http.request(`${path}${query}`, { signal });
    },
  };
}
