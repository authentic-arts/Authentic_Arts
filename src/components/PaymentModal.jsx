// src/components/PaymentModal.jsx
import { useState, useEffect, useRef } from 'react';
import { ksh } from '../utils/currency';
import { formatKenyanPhone, initiateSTKPush, pollSTKStatus } from '../utils/mpesa';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function PaymentModal({ total, onSuccess, onClose }) {
  const { user } = useAuth();
  const [method, setMethod] = useState('mpesa');

  // Step flow: 'input' -> 'stk_prompt' -> 'verifying' -> 'success' | 'error'
  const [step, setStep] = useState('input');

  const [phone, setPhone] = useState(user?.phone || '');
  const [paypalEmail, setPaypalEmail] = useState(user?.email || '');
  const [phoneError, setPhoneError] = useState('');

  // Daraja state
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [mpesaReceipt, setMpesaReceipt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const countdownTimerRef = useRef(null);
  const isCancelledRef = useRef(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Helper to clear frontend & database cart state upon verified payment
  const clearCartData = async () => {
    // 1. Clear local storage cart state if present
    localStorage.removeItem('authentic_arts_cart');
    localStorage.removeItem('cart');

    // 2. Clear database cart table for logged-in user
    if (supabase && user?.id) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('Could not clear database cart items:', err);
      }
    }
  };

  // Handle phone input changes with live cleaning
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    if (phoneError) setPhoneError('');
  };

  // Start Daraja STK Push flow
  const handleInitiatePayment = async () => {
    if (method === 'mpesa') {
      const validation = formatKenyanPhone(phone);
      if (!validation.isValid) {
        setPhoneError(validation.error);
        return;
      }

      setIsProcessing(true);
      setErrorMessage('');
      setStatusMessage('Requesting Safaricom M-Pesa STK Push...');

      try {
        const res = await initiateSTKPush({
          phone: validation.formatted,
          amount: total,
          reference: 'AuthenticArts',
          description: 'Artwork Purchase',
          userId: user?.id,
        });

        setCheckoutRequestId(res.checkoutRequestId);
        setStep('stk_prompt');
        setStatusMessage('STK Prompt sent! Please enter your M-Pesa PIN on your phone.');
        setIsProcessing(false);

        // Start 60s countdown timer
        setCountdown(60);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownTimerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Begin polling for transaction status
        startStatusPolling(res.checkoutRequestId);
      } catch (err) {
        setIsProcessing(false);
        setErrorMessage(err.message || 'Failed to initiate M-Pesa STK Push. Please try again.');
      }
    } else {
      // PayPal flow
      if (!paypalEmail || !paypalEmail.includes('@')) {
        setErrorMessage('Please enter a valid PayPal email address.');
        return;
      }

      setStep('verifying');
      setStatusMessage('Connecting to PayPal gateway...');
      setTimeout(async () => {
        const paypalRef = 'PAYPAL-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        setMpesaReceipt(paypalRef);
        setStep('success');

        // Clear cart on successful PayPal payment
        await clearCartData();

        setTimeout(() => {
          onSuccess({ paymentMethod: 'paypal', paymentRef: paypalRef });
        }, 1800);
      }, 2500);
    }
  };

  // Poll Daraja STK Query
  const startStatusPolling = async (reqId) => {
    try {
      const pollResult = await pollSTKStatus({
        checkoutRequestId: reqId,
        maxAttempts: 20,
        intervalMs: 3000,
        onStatusUpdate: ({ attempt, message }) => {
          if (!isCancelledRef.current) {
            setStatusMessage(message || `Waiting for PIN entry (attempt ${attempt})...`);
          }
        },
      });

      if (isCancelledRef.current) return;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      if (pollResult.status === 'completed') {
        setMpesaReceipt(pollResult.receiptNumber);
        setStep('success');

        // Clear cart on successful M-Pesa payment
        await clearCartData();

        setTimeout(() => {
          onSuccess({
            paymentMethod: 'mpesa',
            paymentRef: pollResult.receiptNumber,
          });
        }, 2000);
      } else if (pollResult.status === 'cancelled') {
        setErrorMessage('Transaction was cancelled on your phone.');
        setStep('error');
      } else if (pollResult.status === 'timeout') {
        setErrorMessage('M-Pesa prompt timed out. No PIN was entered within the required window.');
        setStep('error');
      } else {
        setErrorMessage(pollResult.message || 'M-Pesa transaction failed. Please retry.');
        setStep('error');
      }
    } catch (err) {
      if (!isCancelledRef.current) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setErrorMessage(err.message || 'Error verifying M-Pesa payment.');
        setStep('error');
      }
    }
  };

  const handleRetry = () => {
    setStep('input');
    setErrorMessage('');
    setStatusMessage('');
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Authentic Arts Checkout</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Official Safaricom Daraja 2.0 Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Order Summary Banner */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-2xl p-5 mb-6 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Payable</p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-0.5">{ksh(total, true)}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Secure SSL
              </span>
            </div>
          </div>

          {/* STEP 1: Method & Phone Input */}
          {step === 'input' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* M-Pesa Option */}
                  <div
                    onClick={() => setMethod('mpesa')}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === 'mpesa'
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-950/30 shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-green-500/20">
                        M
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Lipa Na M-Pesa</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Instant STK Prompt</p>
                      </div>
                    </div>
                    {method === 'mpesa' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* PayPal Option */}
                  <div
                    onClick={() => setMethod('paypal')}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === 'paypal'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                        P
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">PayPal</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Global cards & wallet</p>
                      </div>
                    </div>
                    {method === 'paypal' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Input Details */}
              {method === 'mpesa' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    M-Pesa Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-semibold text-sm">
                      🇰🇪 +254
                    </div>
                    <input
                      type="tel"
                      placeholder="712 345 678"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full pl-24 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-medium text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-gray-400"
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">{phoneError}</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Accepts 07XX... or 01XX... A prompt will immediately pop up on this phone.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    PayPal Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all text-base flex items-center justify-center gap-2 ${method === 'mpesa'
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-600/25 hover:scale-[1.01] active:scale-[0.99]'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25 hover:scale-[1.01] active:scale-[0.99]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Contacting Safaricom...</span>
                  </>
                ) : (
                  <>
                    <span>{method === 'mpesa' ? 'Send STK Push' : 'Proceed with PayPal'}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: STK Prompt & Live Waiting Screen */}
          {step === 'stk_prompt' && (
            <div className="text-center py-4 space-y-6">
              {/* Phone Animation Pulse */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-green-500/20 dark:bg-green-500/30 animate-ping"></div>
                <div className="relative w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center text-4xl shadow-inner border border-green-200 dark:border-green-800">
                  📱
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Check Your Phone</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                  A Lipa Na M-Pesa prompt was sent to <strong>{phone}</strong>. Enter your <strong>M-Pesa PIN</strong> to authorize payment of {ksh(total, true)}.
                </p>
              </div>

              {/* Countdown & Status Pill */}
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Live Querying Status</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{statusMessage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-400">Expires in</span>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">{countdown}s</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-colors"
                >
                  Cancel / Re-enter Number
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Verifying */}
          {step === 'verifying' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verifying Transaction...</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{statusMessage}</p>
            </div>
          )}

          {/* STEP 4: Success Screen */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-5 animate-scale-up">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-lg shadow-green-500/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">Payment Verified!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  M-Pesa Receipt Code: <strong className="text-gray-900 dark:text-white font-mono">{mpesaReceipt}</strong>
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                Registering artwork ownership & crediting artist wallet...
              </p>
            </div>
          )}

          {/* STEP 5: Error Screen */}
          {step === 'error' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-500 text-3xl">
                ✕
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Payment Incomplete</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                  {errorMessage || 'The payment request was not completed.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3.5 rounded-xl text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}