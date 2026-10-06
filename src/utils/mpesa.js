// src/utils/mpesa.js
import { supabase } from '../lib/supabase.js';

/**
 * Validates and normalises Kenyan phone numbers for M-Pesa STK Push.
 */
export function formatKenyanPhone(phoneInput) {
  if (!phoneInput) {
    return { isValid: false, formatted: '', error: 'Phone number is required' };
  }

  let cleaned = String(phoneInput).replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (/^0[17]\d{8}$/.test(cleaned)) {
    cleaned = '254' + cleaned.substring(1);
  }

  if (/^[17]\d{8}$/.test(cleaned)) {
    cleaned = '254' + cleaned;
  }

  const isValid = /^254(7\d{8}|1\d{8})$/.test(cleaned);

  if (!isValid) {
    return {
      isValid: false,
      formatted: cleaned,
      error: 'Please enter a valid Safaricom number (e.g. 0712345678)',
    };
  }

  return { isValid: true, formatted: cleaned, error: null };
}

/**
 * Initiates an M-Pesa STK Push request via PayHero Edge Function with a guaranteed unique reference.
 */
export async function initiateSTKPush({
  phone,
  amount,
  reference,
  description = 'Artwork Purchase',
  userId = null,
}) {
  const phoneValidation = formatKenyanPhone(phone);
  if (!phoneValidation.isValid) {
    throw new Error(phoneValidation.error);
  }

  const uniqueRef = reference && reference !== 'AuthenticArt'
    ? reference
    : `AA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const roundedAmount = Math.max(1, Math.round(Number(amount)));

  try {
    const { data, error } = await supabase.functions.invoke('mpesa', {
      body: {
        phone_number: phoneValidation.formatted,
        amount: roundedAmount,
        reference: uniqueRef,
        description: description,
      },
    });

    if (error || !data || data.error || data.status === false) {
      throw new Error(
        error?.message || data?.error || data?.message || 'Failed to initiate STK Push via PayHero'
      );
    }

    // Insert pending transaction record in database
    if (supabase) {
      try {
        await supabase.from('mpesa_transactions').insert({
          checkout_request_id: uniqueRef,
          user_id: userId,
          phone_number: phoneValidation.formatted,
          amount: roundedAmount,
          status: 'pending',
        });
      } catch (dbErr) {
        console.warn('Could not record pending transaction in database:', dbErr);
      }
    }

    return {
      success: true,
      checkoutRequestId: uniqueRef,
      reference: uniqueRef,
      customerMessage: 'STK Push sent to phone. Please enter your M-Pesa PIN.',
    };
  } catch (err) {
    console.error('STK Push Error:', err);
    throw err;
  }
}

/**
 * Polls Supabase DB Status until transaction is completed, cancelled, or timed out.
 */
export async function pollSTKStatus({
  checkoutRequestId,
  maxAttempts = 30,
  intervalMs = 2000,
  onStatusUpdate = () => { },
}) {
  if (!checkoutRequestId) {
    throw new Error('Transaction reference/CheckoutRequestID is required');
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (supabase) {
      try {
        const { data: dbTx, error } = await supabase
          .from('mpesa_transactions')
          .select('status, result_code, result_desc, mpesa_receipt_number')
          .eq('checkout_request_id', checkoutRequestId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && dbTx) {
          // 1. Final Verified Success
          if (dbTx.status === 'completed') {
            return {
              status: 'completed',
              resultCode: 0,
              receiptNumber: dbTx.mpesa_receipt_number || 'SUCCESS',
              message: dbTx.result_desc || 'Payment confirmed successfully!',
            };
          }

          // 2. Final Terminal Failure
          if (dbTx.status === 'failed' || dbTx.status === 'cancelled') {
            let userMessage = dbTx.result_desc || 'Payment was cancelled or failed.';
            const code = Number(dbTx.result_code);

            if (code === 1) userMessage = 'Insufficient M-Pesa balance to complete purchase.';
            if (code === 1032) userMessage = 'Transaction was cancelled on your phone.';
            if (code === 1037) userMessage = 'M-Pesa prompt timed out. No PIN was entered.';

            return {
              status: code === 1032 ? 'cancelled' : 'failed',
              resultCode: code,
              message: userMessage,
            };
          }
          // If status is still 'pending', stay in the loop
        }
      } catch (dbErr) {
        console.warn('Database polling check warning:', dbErr);
      }
    }

    onStatusUpdate({
      attempt,
      status: 'polling',
      message: `Waiting for PIN entry on phone (attempt ${attempt}/${maxAttempts})...`,
    });

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    status: 'timeout',
    resultCode: 1037,
    message: 'M-Pesa verification timed out. If you entered your PIN, your order will reflect shortly.',
  };
}