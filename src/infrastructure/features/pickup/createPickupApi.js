export function createPickupApi(http) {
  return {
    list: (producerId, signal) =>
      http.request(
        `/producers/${encodeURIComponent(producerId)}/pickup-slots`,
        {
          signal,
        },
      ),
    listOwned: (signal) => http.request('/pickup-slots/mine', { signal }),
    listPoints: (signal) => http.request('/pickup-points', { signal }),
    createPoint: (input) =>
      http.request('/pickup-points', { method: 'POST', body: input }),
    updatePoint: (id, input) =>
      http.request(`/pickup-points/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      }),
    create: (input) =>
      http.request('/pickup-slots', { method: 'POST', body: input }),
    updateCapacity: (id, capacity) =>
      http.request(`/pickup-slots/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: { capacity },
      }),
  };
}
