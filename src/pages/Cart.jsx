import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import { ksh } from '../utils/currency';

export default function Cart() {
  const navigate = useNavigate();
  const { user, markPurchased } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartSubtotal } = useCart();
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [confirmedPaymentInfo, setConfirmedPaymentInfo] = useState(null);

  if (!user) {
    navigate('/signin');
    return null;
  }

  const isFirstTime = user.isFirstTimeBuyer;
  const discountAmount = isFirstTime ? cartSubtotal * 0.2 : 0;
  const finalTotal = cartSubtotal - discountAmount;

  const handlePaymentSuccess = async (paymentResult = {}) => {
    const { paymentMethod = 'mpesa', paymentRef = null } = paymentResult;
    setConfirmedPaymentInfo({ paymentMethod, paymentRef });
    
    // Pass full cart items & payment metadata so AuthContext can build the order
    await markPurchased(cartItems, { paymentMethod, paymentRef });
    clearCart();
    setShowCheckout(false);
    setCheckoutSuccess(true);
  };

  if (checkoutSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 sm:p-10 max-w-lg w-full text-center shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-md shadow-green-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Payment Successful
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Confirmed!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Your payment via <strong>{confirmedPaymentInfo?.paymentMethod === 'mpesa' ? 'Lipa Na M-Pesa' : 'PayPal'}</strong> has been verified.
            </p>
            {confirmedPaymentInfo?.paymentRef && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-150 dark:border-gray-700 inline-block">
                <p className="text-xs text-gray-400">M-Pesa Receipt Number</p>
                <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{confirmedPaymentInfo.paymentRef}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-md"
            >
              View Purchases
            </button>
            <button
              onClick={() => navigate('/collections')}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3.5 rounded-xl text-sm transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
            <span className="text-5xl">🛒</span>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-base">Your cart is empty.</p>
            <button
              onClick={() => navigate('/collections')}
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Discover Artworks
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={item.altText || item.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-150"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <Link to={`/artwork/${item.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-500 transition-colors text-base sm:text-lg">
                      {item.title}
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">by {item.artistName}</p>
                    {item.selectedFrame && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
                        Framing: {item.selectedFrame.name} ({item.selectedFrame.price === 0 ? 'Free' : `+${ksh(item.selectedFrame.price)}`})
                      </p>
                    )}
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">{ksh(item.price)}</p>
                  </div>
                  
                  {/* Quantity adjustments */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      -
                    </button>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.availableQuantity || 1)} // cap at mock availability
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    aria-label="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Summary</h3>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{ksh(cartSubtotal)}</span>
                </div>
                {isFirstTime && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>First-time discount (20%)</span>
                    <span>-{ksh(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-500 font-semibold">Free</span>
                </div>
              </div>

              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{ksh(finalTotal)}</span>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl text-center shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <PaymentModal
            total={finalTotal}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowCheckout(false)}
          />
        )}
      </div>
    </div>
  );
}
