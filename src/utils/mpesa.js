// src/utils/mpesa.js
import { supabase } from '../lib/supabase.js';

/**
 * Validates and normalises Kenyan phone numbers for Safaricom Daraja STK Push.
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
      error: 'Please enter a valid Safaricom number (e.g. 0712345678 or 0112345678)',
    };
  }

  return { isValid: true, formatted: cleaned, error: null };
}

/**
 * Initiates an M-Pesa STK Push request via Supabase Edge Function.
 */
export async function initiateSTKPush({ phone, amount, reference = 'AuthenticArts', description = 'Artwork Purchase', userId = null }) {
  const phoneValidation = formatKenyanPhone(phone);
  if (!phoneValidation.isValid) {
    throw new Error(phoneValidation.error);
  }

  const roundedAmount = Math.max(1, Math.round(Number(amount)));

  try {
    const { data, error } = await supabase.functions.invoke('mpesa', {
      body: {
        action: 'stkpush',
        phoneNumber: phoneValidation.formatted,
        amount: roundedAmount,
        accountReference: reference.substring(0, 12),
        transactionDesc: description.substring(0, 20),
      },
    });

    if (error || !data || data.error) {
      throw new Error(error?.message || data?.error || data?.errorMessage || 'Failed to initiate STK Push');
    }

    if (supabase && (data.CheckoutRequestID || data.checkoutRequestId)) {
      const checkoutReqId = data.CheckoutRequestID || data.checkoutRequestId;
      const merchantReqId = data.MerchantRequestID || data.merchantRequestId;

      try {
        await supabase.from('mpesa_transactions').insert({
          checkout_request_id: checkoutReqId,
          merchant_request_id: merchantReqId,
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
      checkoutRequestId: data.CheckoutRequestID || data.checkoutRequestId,
      merchantRequestId: data.MerchantRequestID || data.merchantRequestId,
      customerMessage: data.CustomerMessage || data.customerMessage || 'STK Push sent to phone',
      responseCode: data.ResponseCode || data.responseCode,
    };
  } catch (err) {
    console.error('STK Push Error:', err);
    throw err;
  }
}

/**
 * Polls Daraja STK Query via Supabase Edge Function until completion or timeout.
 */
export async function pollSTKStatus({ checkoutRequestId, maxAttempts = 20, intervalMs = 3000, onStatusUpdate = () => { } }) {
  if (!checkoutRequestId) {
    throw new Error('CheckoutRequestID is required to query status');
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    try {
      const { data, error } = await supabase.functions.invoke('mpesa', {
        body: {
          action: 'query',
          checkoutRequestId,
        },
      });

      if (error || (!data && !data?.ResultCode && data?.ResultCode !== 0)) {
        onStatusUpdate({ attempt, status: 'polling', message: 'Waiting for PIN on phone...' });
        continue;
      }

      const resultCode = Number(data.ResultCode ?? data.resultCode);

      if (resultCode === 0) {
        const receipt = data.MpesaReceiptNumber || data.mpesaReceiptNumber || 'MPESA' + Math.random().toString(36).substring(2, 8).toUpperCase();

        if (supabase) {
          await supabase.from('mpesa_transactions')
            .update({
              status: 'completed',
              result_code: 0,
              result_desc: data.ResultDesc || 'The service request is processed successfully.',
              mpesa_receipt_number: receipt,
            })
            .eq('checkout_request_id', checkoutRequestId);
        }

        return {
          status: 'completed',
          resultCode: 0,
          receiptNumber: receipt,
          message: data.ResultDesc || 'Payment confirmed successfully!',
        };
      }

      if (resultCode === 1032) {
        if (supabase) {
          await supabase.from('mpesa_transactions')
            .update({ status: 'cancelled', result_code: 1032, result_desc: 'Request cancelled by user' })
            .eq('checkout_request_id', checkoutRequestId);
        }
        return {
          status: 'cancelled',
          resultCode: 1032,
          message: 'Payment was cancelled on your phone.',
        };
      }

      if (resultCode === 1037) {
        if (supabase) {
          await supabase.from('mpesa_transactions')
            .update({ status: 'timeout', result_code: 1037, result_desc: 'Transaction timeout' })
            .eq('checkout_request_id', checkoutRequestId);
        }
        return {
          status: 'timeout',
          resultCode: 1037,
          message: 'Payment request timed out. Please try again.',
        };
      }

      if (!isNaN(resultCode) && resultCode !== 0) {
        if (supabase) {
          await supabase.from('mpesa_transactions')
            .update({ status: 'failed', result_code: resultCode, result_desc: data.ResultDesc || 'Payment failed' })
            .eq('checkout_request_id', checkoutRequestId);
        }
        return {
          status: 'failed',
          resultCode,
          message: data.ResultDesc || `Payment failed with code ${resultCode}`,
        };
      }

      onStatusUpdate({ attempt, status: 'polling', message: 'Waiting for PIN on phone...' });
    } catch (err) {
      console.warn(`Query attempt ${attempt} failed:`, err);
      onStatusUpdate({ attempt, status: 'polling', message: 'Checking payment status...' });
    }
  }

  return {
    status: 'timeout',
    resultCode: 1037,
    message: 'We did not receive a response in time. If you entered your PIN, your order will be updated shortly.',
  };
}