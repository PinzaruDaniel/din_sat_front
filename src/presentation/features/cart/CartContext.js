import { createContext, useContext } from 'react';
export const CartContext = createContext(null);
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('CartProvider is missing.');
  return value;
}
