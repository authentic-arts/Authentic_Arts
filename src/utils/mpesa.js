// src/utils/mpesa.js
import { supabase } from '../lib/supabase';

/**
 * Clean & format Kenyan phone number to 2547XXXXXXXX or 2541XXXXXXXX
 */
export const formatKenyanPhone = (phone) => {
  if (!phone) return { isValid: false, formatted: '', error: 'Phone number is required' };

  // Remove spaces, hyphens, and non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  }

  // Verify Kenyan line length (254 + 9 digits = 12 digits)
  const isValid = /^254[71]\d{8}$/.test(cleaned);

  return {
    isValid,
    formatted: cleaned,
    error: isValid ? '' : 'Please enter a valid Kenyan number (e.g. 0712345678 or 0112345678)',
  };
};

/**
 * Initiate STK Push via PayHero / Daraja Edge Function
 */
export const initiateSTKPush = async ({ phone, amount, reference, description, userId }) => {
  try {
    // Generate a unique fallback ID if the gateway response doesn't return one immediately
    const uniqueReqId = `REQ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const { data, error } = await supabase.functions.invoke('payhero-stk-push', {
      body: {
        phone,
        amount,
        reference: reference || 'AuthenticArts',
        description: description || 'Artwork Purchase',
        user_id: userId,
        request_id: uniqueReqId,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to trigger STK Push edge function.');
    }

    // Extract Safaricom's CheckoutRequestID or fallback to unique generated ID
    const checkoutRequestId = data?.checkoutRequestId || data?.CheckoutRequestID || data?.checkout_request_id || uniqueReqId;

    return {
      success: true,
      checkoutRequestId,
      message: data?.message || 'STK Push sent successfully.',
    };
  } catch (err) {
    console.error('STK Initiation Error:', err);
    throw err;
  }
};

/**
 * Poll database strictly by unique checkout_request_id
 */
export const pollSTKStatus = async ({ checkoutRequestId, maxAttempts = 20, intervalMs = 3000, onStatusUpdate }) => {
  if (!checkoutRequestId) {
    throw new Error('Missing checkoutRequestId for polling.');
  }

  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    if (onStatusUpdate) {
      onStatusUpdate({
        attempt: attempts,
        message: `Waiting for PIN authorization (attempt ${attempts}/${maxAttempts})...`,
      });
    }

    // Query mpesa_transactions STRICTLY by unique checkout_request_id
    const { data: tx, error } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .maybeSingle();

    if (error) {
      console.warn('Polling database query warning:', error);
    }

    if (tx) {
      // 1. Success condition: status is 'completed' AND result_code is 0
      if (tx.status === 'completed' && (tx.result_code === 0 || tx.result_code === '0')) {
        return {
          status: 'completed',
          receiptNumber: tx.mpesa_receipt_number || tx.payment_reference || 'VERIFIED',
        };
      }

      // 2. Explicit failure condition (e.g. Insufficient funds, cancelled PIN, timeout)
      if (
        tx.status === 'failed' ||
        tx.status === 'cancelled' ||
        (tx.result_code !== null && tx.result_code !== undefined && Number(tx.result_code) !== 0)
      ) {
        let userMessage = tx.result_desc || 'M-Pesa transaction failed.';

        // Custom message mapping for standard Safaricom error codes
        const code = Number(tx.result_code);
        if (code === 1) userMessage = 'Insufficient M-Pesa balance to complete purchase.';
        if (code === 1032) userMessage = 'Transaction was cancelled on phone.';
        if (code === 1037) userMessage = 'M-Pesa prompt timed out. No PIN was entered.';

        return {
          status: code === 1032 ? 'cancelled' : 'failed',
          message: userMessage,
        };
      }
    }

    // Wait for the configured interval before polling again
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    status: 'timeout',
    message: 'M-Pesa verification timed out. No PIN response received.',
  };
};