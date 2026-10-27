export function createPickupApi(http) {
  return {
    list: (producerId, signal) =>
      http.request(`/pickup-slots?${new URLSearchParams({ producerId })}`, {
        signal,
      }),
    create: (input) =>
      http.request('/pickup-slots', { method: 'POST', body: input }),
  };
}
