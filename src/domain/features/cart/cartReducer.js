export const initialCart = [];
export function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const product = action.product;
      if (state.length && state[0].product.producerId !== product.producerId)
        return state;
      const existing = state.find((item) => item.product.id === product.id);
      if (existing)
        return state.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  product.availableQuantity,
                ),
              }
            : item,
        );
      return product.availableQuantity > 0
        ? [...state, { product, quantity: 1 }]
        : state;
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
                ),
              ),
            }
          : item,
      );
    case 'remove':
      return state.filter((item) => item.product.id !== action.id);
    case 'clear':
      return [];
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
