import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, checkout, isLoading } = useCart();
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState('123 Atelier Street, New York, NY 10001');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      setIsCheckingOut(true);
      const order = await checkout(shippingAddress);
      setConfirmedOrderId(order.id);
    } catch {
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (confirmedOrderId) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-serif text-white">Order Confirmed!</h1>
        <p className="text-stone-400 max-w-md mx-auto">
          Thank you for choosing VestiAI. Your simulated order <span className="font-mono text-amber-200">#{confirmedOrderId.slice(0, 8)}</span> has been securely processed.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link
            to="/profile"
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium rounded text-xs uppercase tracking-wider transition-colors"
          >
            View Orders in Profile
          </Link>
          <Link
            to="/store"
            className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white font-medium rounded text-xs uppercase tracking-wider transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-stone-900 border border-stone-800 rounded-full flex items-center justify-center mx-auto text-stone-600">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif text-white">Your Shopping Bag is Empty</h1>
        <p className="text-stone-400">Discover hand-crafted apparel and try them on virtually.</p>
        <Link
          to="/store"
          className="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold uppercase tracking-wider text-xs rounded transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-serif text-white tracking-wide uppercase mb-8">Shopping Bag</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-4 p-4 bg-stone-900 border border-stone-800 rounded-xl"
            >
              <img
                src={item.productImageUrl || '/placeholder.png'}
                alt={item.productTitle}
                className="w-24 h-32 object-cover rounded-lg bg-stone-800 border border-stone-700/60"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-white">{item.productTitle}</h3>
                    <p className="font-mono text-amber-300 font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Size: <span className="text-stone-200 font-mono">{item.selectedSize}</span> | Unit: ${item.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-800/80">
                  <div className="flex items-center border border-stone-700 rounded bg-stone-950">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="px-3 py-1 text-stone-400 hover:text-white"
                      disabled={isLoading}
                    >
                      -
                    </button>
                    <span className="px-3 font-mono text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-stone-400 hover:text-white"
                      disabled={isLoading}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider"
                    disabled={isLoading}
                  >
                    Remove Item
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Test Checkout */}
        <div className="p-6 bg-stone-900 border border-stone-800 rounded-xl space-y-6 h-fit">
          <h2 className="text-lg font-serif text-white border-b border-stone-800 pb-3">Order Summary</h2>
          <div className="space-y-3 text-sm text-stone-300">
            <div className="flex justify-between">
              <span>Items Total ({cart.itemCount})</span>
              <span className="font-mono">${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Standard Shipping</span>
              <span className="text-emerald-400">COMPLIMENTARY</span>
            </div>
            <div className="flex justify-between text-base font-medium text-white pt-3 border-t border-stone-800">
              <span>Estimated Total</span>
              <span className="font-mono text-amber-300">${cart.subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400">
              Delivery Address
            </label>
            <input
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-stone-950 border border-stone-700 rounded text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={handleCheckout}
            disabled={isCheckingOut || isLoading}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold uppercase tracking-wider text-xs rounded transition-colors"
          >
            {isCheckingOut ? 'Authorizing Payment...' : `Confirm & Pay $${cart.subtotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};
