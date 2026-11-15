import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { cart, isCartDrawerOpen, closeCartDrawer, updateQuantity, removeFromCart, checkout, isLoading } = useCart();
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState('123 Atelier Street, New York, NY 10001');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  if (!isCartDrawerOpen) return null;

  const handleCheckout = async () => {
    if (!currentUser) {
      closeCartDrawer();
      navigate('/login');
      return;
    }
    try {
      setIsCheckingOut(true);
      const order = await checkout(shippingAddress);
      setCheckoutSuccess(order.id);
    } catch {
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeCartDrawer}>
      <div
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 text-stone-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800">
            <h2 className="text-xl font-serif tracking-wider uppercase text-amber-100 flex items-center gap-2">
              <span>Shopping Bag</span>
              {cart && cart.itemCount > 0 && (
                <span className="text-xs font-mono font-normal bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {cart.itemCount}
                </span>
              )}
            </h2>
            <button
              onClick={closeCartDrawer}
              className="text-stone-400 hover:text-white transition-colors p-1"
              aria-label="Close cart"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {checkoutSuccess ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white">Order Confirmed!</h3>
                <p className="text-sm text-stone-400">
                  Your simulated order has been registered. Order ID: <span className="font-mono text-amber-200">{checkoutSuccess.slice(0, 8)}...</span>
                </p>
                <button
                  onClick={() => {
                    setCheckoutSuccess(null);
                    closeCartDrawer();
                    navigate('/profile');
                  }}
                  className="mt-4 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium rounded text-sm transition-colors uppercase tracking-wider"
                >
                  View My Orders
                </button>
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto text-stone-500">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-stone-400">Your shopping bag is currently empty.</p>
                <button
                  onClick={() => {
                    closeCartDrawer();
                    navigate('/store');
                  }}
                  className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium rounded transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 bg-stone-800/40 border border-stone-800 rounded-lg">
                  <img
                    src={item.productImageUrl || '/placeholder.png'}
                    alt={item.productTitle}
                    className="w-20 h-24 object-cover rounded bg-stone-800 border border-stone-700"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white line-clamp-1">{item.productTitle}</h4>
                      <p className="text-xs text-stone-400 mt-1">Size: <span className="text-amber-300 font-mono">{item.selectedSize}</span></p>
                      <p className="text-xs font-mono text-stone-300 mt-1">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-stone-700 rounded bg-stone-900">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-2.5 py-1 text-stone-400 hover:text-white"
                          disabled={isLoading}
                        >
                          -
                        </button>
                        <span className="px-2 font-mono text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-stone-400 hover:text-white"
                          disabled={isLoading}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart && cart.items.length > 0 && !checkoutSuccess && (
            <div className="border-t border-stone-800 px-6 py-6 bg-stone-950 space-y-4">
              <div className="space-y-1.5 text-xs text-stone-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-stone-200">${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping (Complimentary)</span>
                  <span className="text-emerald-400">FREE</span>
                </div>
                <div className="flex justify-between text-base font-serif text-white pt-2 border-t border-stone-800">
                  <span>Total</span>
                  <span className="font-mono text-amber-300">${cart.subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1">
                  Shipping Destination
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-900 border border-stone-800 rounded text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || isLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-semibold uppercase tracking-wider text-xs rounded transition-colors"
              >
                {isCheckingOut ? 'Processing Order...' : `Complete Checkout — $${cart.subtotal.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
