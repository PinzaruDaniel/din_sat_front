export function createOrdersApi(http) {
  return {
    list: (signal) => http.request('/orders', { signal }),
    create: (input, key) =>
      http.request('/orders', {
        method: 'POST',
        body: input,
        headers: { 'Idempotency-Key': key },
      }),
    update: (id, status) =>
      http.request(`/orders/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: { status },
      }),
  };
}
