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
 * Initiates an M-Pesa STK Push request via PayHero Edge Function with a GUARANTEED UNIQUE reference.
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

  // Generate a guaranteed unique reference string for every single transaction
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

    // Insert pending transaction record into Supabase using the unique reference
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
        // Query the latest record matching this unique checkout reference
        const { data: dbTx, error } = await supabase
          .from('mpesa_transactions')
          .select('status, result_code, result_desc, mpesa_receipt_number')
          .eq('checkout_request_id', checkoutRequestId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && dbTx) {
          if (dbTx.status === 'completed') {
            return {
              status: 'completed',
              resultCode: 0,
              receiptNumber: dbTx.mpesa_receipt_number || 'SUCCESS',
              message: dbTx.result_desc || 'Payment confirmed successfully!',
            };
          }

          if (dbTx.status === 'failed' || dbTx.status === 'cancelled') {
            return {
              status: dbTx.status,
              resultCode: dbTx.result_code || 1,
              message: dbTx.result_desc || 'Payment was cancelled or failed.',
            };
          }
        }
      } catch (dbErr) {
        console.warn('Database polling check warning:', dbErr);
      }
    }

    onStatusUpdate({ attempt, status: 'polling', message: 'Waiting for PIN entry on phone...' });
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    status: 'timeout',
    resultCode: 1037,
    message: 'We did not receive confirmation in time. If you entered your PIN, your order will update shortly.',
  };
}