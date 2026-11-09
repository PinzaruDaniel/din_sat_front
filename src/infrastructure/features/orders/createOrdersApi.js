export function createOrdersApi(http) {
  return {
    list: ({ page, pickupSlotId }, signal) => {
      const query = new URLSearchParams({ page });
      if (pickupSlotId) query.set('pickupSlotId', pickupSlotId);
      return http.request(`/orders?${query}`, { signal });
    },
    details: (id, signal) =>
      http.request(`/orders/${encodeURIComponent(id)}`, { signal }),
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
    cancel: (id) =>
      http.request(`/orders/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
      }),
  };
}
