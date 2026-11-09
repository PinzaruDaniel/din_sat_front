import { describe, it, expect } from 'vitest';
import {
  cartReducer,
  cartTotal,
} from '../../src/domain/features/cart/cartReducer.js';
const product = {
  id: 'a',
  producerId: 'farmer-1',
  priceAmount: '35.25',
  availableQuantity: 3,
};
describe('cart rules', () => {
  it('replaces the basket only with a valid single-producer selection', () => {
    const state = cartReducer([], { type: 'add', product });
    const replacement = { ...product, id: 'b', producerId: 'other' };
    expect(
      cartReducer(state, {
        type: 'replace',
        items: [state[0], { product: replacement, quantity: 1 }],
      }),
    ).toBe(state);
    expect(
      cartReducer(state, {
        type: 'replace',
        items: [{ product: replacement, quantity: 2 }],
      }),
    ).toEqual([{ product: replacement, quantity: 2 }]);
  });
  it('keeps one producer and respects stock', () => {
    let cart = cartReducer([], { type: 'add', product });
    expect(
      cartReducer(cart, {
        type: 'add',
        product: { ...product, id: 'b', producerId: 'farmer-2' },
      }),
    ).toBe(cart);
    cart = cartReducer(cart, { type: 'quantity', id: 'a', quantity: 99 });
    expect(cart[0].quantity).toBe(3);
    expect(
      cartReducer(cart, { type: 'quantity', id: 'a', quantity: 0 })[0].quantity,
    ).toBe(1);
    expect(cartReducer(cart, { type: 'remove', id: 'a' })).toEqual([]);
  });
  it('uses minor units for money and does not mutate existing state', () => {
    const initial = Object.freeze([{ product, quantity: 1 }]);
    const updated = cartReducer(initial, { type: 'add', product });
    expect(initial[0].quantity).toBe(1);
    expect(cartTotal(updated)).toBe(70.5);
  });
});
