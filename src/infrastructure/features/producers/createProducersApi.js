export function createProducersApi(http) {
  return {
    list: (signal) => http.request('/producers', { signal }),
    details: (id, signal) =>
      http.request(`/producers/${encodeURIComponent(id)}`, { signal }),
    own: (signal) => http.request('/producer/profile', { signal }),
    update: (input) =>
      http.request('/producer/profile', { method: 'PUT', body: input }),
  };
}
