export function createCatalogApi(http) {
  return {
    list: (filters, signal) =>
      http.request(
        `/products?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null))}`,
        { signal },
      ),
    details: (id, signal) =>
      http.request(`/products/${encodeURIComponent(id)}`, { signal }),
    producers: (signal) => http.request('/producers', { signal }),
    create: (input) =>
      http.request('/products', { method: 'POST', body: input }),
  };
}
