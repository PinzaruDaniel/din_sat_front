export function createCatalogApi(http) {
  return {
    list: (filters, signal) =>
      http.request(
        `/products?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null))}`,
        { signal },
      ),
    details: (id, signal) =>
      http.request(`/products/${encodeURIComponent(id)}`, { signal }),
    owned: (signal) => http.request('/producer/products', { signal }),
    create: (input) =>
      http.request('/producer/products', { method: 'POST', body: input }),
    update: (id, input) =>
      http.request(`/producer/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      }),
    archive: (id) =>
      http.request(`/producer/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    upload: (file) =>
      http.request('/producer/uploads', { method: 'POST', body: file }),
  };
}
