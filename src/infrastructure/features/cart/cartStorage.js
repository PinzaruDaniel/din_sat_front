const cartStorageKey = 'dinsat.cart';

function readStoredCartEntry() {
  try {
    const raw = window.localStorage.getItem(cartStorageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved?.items)) return null;
    return {
      ownerId: typeof saved.ownerId === 'string' ? saved.ownerId : null,
      items: saved.items,
    };
  } catch {
    return null;
  }
}

export function readStoredCartOwner() {
  return readStoredCartEntry()?.ownerId ?? null;
}

export function readStoredCart(ownerId, fallback, authLoading = false) {
  const saved = readStoredCartEntry();
  if (!saved) return fallback;
  if (authLoading) return saved.items;
  if (saved.ownerId && saved.ownerId !== ownerId) return fallback;
  return saved.items;
}

export function writeStoredCart(ownerId, items, authLoading = false) {
  try {
    if (!items.length) {
      window.localStorage.removeItem(cartStorageKey);
      return;
    }
    const effectiveOwner = authLoading
      ? (readStoredCartEntry()?.ownerId ?? ownerId)
      : ownerId;
    window.localStorage.setItem(
      cartStorageKey,
      JSON.stringify({ ownerId: effectiveOwner, items }),
    );
  } catch {
    // Ignore storage errors in restricted browsing modes.
  }
}

export function clearStoredCart() {
  try {
    window.localStorage.removeItem(cartStorageKey);
  } catch {
    // Ignore storage errors in restricted browsing modes.
  }
}
