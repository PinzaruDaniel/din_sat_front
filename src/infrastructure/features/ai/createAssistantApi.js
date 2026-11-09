export function createAssistantApi(http) {
  return {
    chat: (body, signal) =>
      http.request('/ai/chat', { method: 'POST', body, signal }),
    confirm: (id, signal) =>
      http.request(`/ai/cart-proposals/${encodeURIComponent(id)}/confirm`, {
        method: 'POST',
        signal,
      }),
  };
}
