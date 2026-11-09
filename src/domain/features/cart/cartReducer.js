export const initialCart = [];
export function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const product = action.product;
      if (state.length && state[0].product.producerId !== product.producerId)
        return state;
      if (product.availableQuantity < 1) return state;
      const existing = state.find((item) => item.product.id === product.id);
      if (existing)
        return state.map((item) =>
          item.product.id === product.id
            ? {
                product,
                quantity: Math.min(
                  item.quantity + 1,
                  product.availableQuantity,
                  1000,
                ),
              }
            : item,
        );
      return state.length < 50 ? [...state, { product, quantity: 1 }] : state;
    }
    case 'quantity':
      return state.map((item) =>
        item.product.id === action.id
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(
                  Math.floor(action.quantity) || 1,
                  item.product.availableQuantity,
                  1000,
                ),
              ),
            }
          : item,
      );
    case 'remove':
      return state.filter((item) => item.product.id !== action.id);
    case 'clear':
      return [];
    case 'replace': {
      const { items } = action;
      const producerId = items[0]?.product.producerId;
      if (
        items.length > 50 ||
        new Set(items.map(({ product }) => product.id)).size !== items.length ||
        items.some(
          ({ product, quantity }) =>
            product.producerId !== producerId ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > Math.min(1000, product.availableQuantity),
        )
      )
        return state;
      return items;
    }
    default:
      return state;
  }
}
export function cartTotal(items) {
  return (
    items.reduce(
      (sum, item) =>
        sum + Number(item.product.priceAmount.replace('.', '')) * item.quantity,
      0,
    ) / 100
  );
}
