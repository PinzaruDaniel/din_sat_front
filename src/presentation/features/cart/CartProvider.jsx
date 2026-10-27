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
  function add(product) {
    if (items.length && items[0].product.producerId !== product.producerId) {
      setNotice(
        'Coșul tău conține produse de la alt producător. Finalizează comanda sau golește coșul înainte de a alege altul.',
      );
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
          <button
            aria-label="Închide notificarea"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </div>
      )}
    </CartContext>
  );
}
