import { useReducer, useState } from 'react';
import {
  cartReducer,
  initialCart,
  cartTotal,
} from '../../../domain/features/cart/cartReducer.js';
import { CartContext } from './CartContext.js';
export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, initialCart);
  const [notice, setNotice] = useState('');
  const [replacement, setReplacement] = useState(null);
  function add(product) {
    if (product.availableQuantity < 1) return;
    if (items.length && items[0].product.producerId !== product.producerId) {
      setReplacement(product);
      setNotice(
        'Coșul conține produse de la alt producător. Vrei să îl înlocuiești?',
      );
      return;
    }
    setReplacement(null);
    const quantity = items.find(
      (item) => item.product.id === product.id,
    )?.quantity;
    if (
      quantity >= Math.min(1000, product.availableQuantity) ||
      (!quantity && items.length >= 50)
    ) {
      setNotice('Ai atins limita disponibilă pentru acest coș.');
      return;
    }
    dispatch({ type: 'add', product });
    setNotice(`${product.title} a fost adăugat în coș.`);
  }
  return (
    <CartContext
      value={{
        items,
        add,
        dispatch,
        total: cartTotal(items),
        count: items.reduce((sum, item) => sum + item.quantity, 0),
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          {replacement && (
            <button
              type="button"
              className="cart-replacement-action"
              onClick={() => {
                dispatch({
                  type: 'replace',
                  items: [{ product: replacement, quantity: 1 }],
                });
                setNotice(`${replacement.title} a fost adăugat în coș.`);
                setReplacement(null);
              }}
            >
              Înlocuiește coșul
            </button>
          )}
          <button
            aria-label="Închide notificarea"
            onClick={() => {
              setNotice('');
              setReplacement(null);
            }}
          >
            ×
          </button>
        </div>
      )}
    </CartContext>
  );
}
