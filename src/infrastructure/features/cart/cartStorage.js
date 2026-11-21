const cartStorageKey = 'dinsat.cart';

export function readStoredCart(ownerId, fallback) {
  try {
    const raw = window.sessionStorage.getItem(cartStorageKey);
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved?.items)) return fallback;
    if (saved.ownerId && saved.ownerId !== ownerId) return fallback;
    return saved.items;
  } catch {
    return fallback;
  }
}

export function writeStoredCart(ownerId, items) {
  try {
    if (!items.length) window.sessionStorage.removeItem(cartStorageKey);
    else
      window.sessionStorage.setItem(
        cartStorageKey,
        JSON.stringify({ ownerId, items }),
      );
  } catch {
    // Ignore storage errors in restricted browsing modes.
  }
}

export function clearStoredCart() {
  try {
    window.sessionStorage.removeItem(cartStorageKey);
  } catch {
    // Ignore storage errors in restricted browsing modes.
  }
}
