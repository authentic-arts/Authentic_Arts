import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aa_cart')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('aa_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (artwork, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === artwork.id);
      if (existing) {
        return prev.map(i =>
          i.id === artwork.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, artwork.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...artwork, quantity }];
    });
  };

  const removeFromCart = (artworkId) => {
    setCartItems(prev => prev.filter(i => i.id !== artworkId));
  };

  const updateQuantity = (artworkId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(artworkId);
      return;
    }
    setCartItems(prev =>
      prev.map(i => i.id === artworkId ? { ...i, quantity } : i)
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const cartSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const applyDiscount = (isFirstTime) => {
    if (isFirstTime) return cartSubtotal * 0.8; // 20% off
    return cartSubtotal;
  };

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart,
      updateQuantity, clearCart,
      cartCount, cartSubtotal, applyDiscount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
