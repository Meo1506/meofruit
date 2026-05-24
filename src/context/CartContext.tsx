"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';

export interface CartItem extends Product {
  quantity: number;
  customFruits?: string[];
  cartKey: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, silent?: boolean, customFruits?: string[]) => void;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

function makeCartKey(product: Product, customFruits?: string[]): string {
  if (customFruits && customFruits.length > 0) {
    return `${product.id || product.name}__${[...customFruits].sort().join('+')}`;
  }
  return product.id || product.name;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('fruit-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        // ignore corrupted data
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fruit-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, silent = false, customFruits?: string[]) => {
    const cartKey = makeCartKey(product, customFruits);
    setCart(prevCart => {
      const existing = prevCart.find(item => item.cartKey === cartKey);
      if (existing) {
        return prevCart.map(item =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      const displayName = customFruits && customFruits.length > 0
        ? `Hộp Tự Chọn: ${customFruits.join(' + ')}`
        : product.name;
      return [...prevCart, { ...product, name: displayName, quantity, customFruits, cartKey }];
    });
    if (!silent) setIsCartOpen(true);
  };

  const removeFromCart = (cartKey: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item => (item.cartKey === cartKey ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      totalPrice, totalItems, isCartOpen, setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
