import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cartApi, ordersApi } from '../services/api';
import { Cart, Order } from '../types';
import { useApp } from './AppContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (productId: string, quantity?: number, selectedSize?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number, selectedSize?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (shippingAddress?: string) => Promise<Order>;
  orders: Order[];
  fetchOrders: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useOptionalCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const formatCart = (raw: any): Cart => {
    return {
      id: raw.id,
      itemCount: raw.item_count || 0,
      subtotal: parseFloat(raw.subtotal || '0'),
      items: (raw.items || []).map((it: any) => ({
        id: it.id,
        productId: it.product_id,
        productTitle: it.product_title,
        productImageUrl: it.product_image_url,
        price: parseFloat(it.price || '0'),
        quantity: it.quantity,
        selectedSize: it.selected_size,
        itemTotal: parseFloat(it.item_total || '0'),
      })),
    };
  };

  const refreshCart = useCallback(async () => {
    if (!currentUser) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await cartApi.getCart();
      setCart(formatCart(data));
    } catch {
      // Cart might fail if unauthorized or server error
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  const addToCart = async (productId: string, quantity = 1, selectedSize = 'M') => {
    setIsLoading(true);
    try {
      const data = await cartApi.addItem(productId, quantity, selectedSize);
      setCart(formatCart(data));
      setIsCartDrawerOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number, selectedSize?: string) => {
    setIsLoading(true);
    try {
      const data = await cartApi.updateItem(itemId, quantity, selectedSize);
      setCart(formatCart(data));
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setIsLoading(true);
    try {
      const data = await cartApi.removeItem(itemId);
      setCart(formatCart(data));
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      await cartApi.clearCart();
      if (cart) {
        setCart({ ...cart, items: [], itemCount: 0, subtotal: 0 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (shippingAddress = '123 Fashion Blvd'): Promise<Order> => {
    setIsLoading(true);
    try {
      const raw = await ordersApi.checkout(shippingAddress);
      const order: Order = {
        id: raw.id,
        totalAmount: parseFloat(raw.total_amount || '0'),
        currency: raw.currency || 'USD',
        orderStatus: raw.order_status,
        paymentStatus: raw.payment_status,
        shippingAddress: raw.shipping_address,
        createdAt: raw.created_at,
        items: (raw.items || []).map((it: any) => ({
          id: it.id,
          productId: it.product_id,
          productTitle: it.product_title,
          productImageUrl: it.product_image_url,
          quantity: it.quantity,
          selectedSize: it.selected_size,
          unitPrice: parseFloat(it.unit_price || '0'),
          totalPrice: parseFloat(it.total_price || '0'),
        })),
      };
      if (cart) {
        setCart({ ...cart, items: [], itemCount: 0, subtotal: 0 });
      }
      setOrders((prev) => [order, ...prev]);
      return order;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      const rawOrders = await ordersApi.listOrders();
      setOrders(
        rawOrders.map((raw) => ({
          id: raw.id,
          totalAmount: parseFloat(raw.total_amount || '0'),
          currency: raw.currency || 'USD',
          orderStatus: raw.order_status,
          paymentStatus: raw.payment_status,
          shippingAddress: raw.shipping_address,
          createdAt: raw.created_at,
          items: (raw.items || []).map((it: any) => ({
            id: it.id,
            productId: it.product_id,
            productTitle: it.product_title,
            productImageUrl: it.product_image_url,
            quantity: it.quantity,
            selectedSize: it.selected_size,
            unitPrice: parseFloat(it.unit_price || '0'),
            totalPrice: parseFloat(it.total_price || '0'),
          })),
        }))
      );
    } catch {
      // ignore
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        checkout,
        orders,
        fetchOrders,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
