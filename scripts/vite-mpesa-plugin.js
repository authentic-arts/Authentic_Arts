// scripts/vite-mpesa-plugin.js
import https from 'https';

// In-memory store for tracking simulated/real requests in local dev
const transactionsStore = new Map();

function getTimestamp() {
  const date = new Date();
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

async function getDarajaAccessToken(env, consumerKey, consumerSecret) {
  const baseUrl = env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daraja OAuth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export function mpesaPlugin() {
  return {
    name: 'vite-mpesa-daraja-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // 1. STK Push endpoint
        if (url === '/api/mpesa/stkpush' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { phoneNumber, amount, accountReference = 'AuthenticArts', transactionDesc = 'Artwork Purchase' } = JSON.parse(body || '{}');

              const env = process.env.DARAJA_ENVIRONMENT || 'sandbox';
              const consumerKey = process.env.DARAJA_CONSUMER_KEY;
              const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
              const shortcode = process.env.DARAJA_SHORTCODE || '174379';
              const passkey = process.env.DARAJA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
              const callbackUrl = process.env.DARAJA_CALLBACK_URL || 'https://sandbox.safaricom.co.ke/mpesa/';

              // If live credentials are provided, perform real Daraja API call
              if (consumerKey && consumerSecret) {
                try {
                  const token = await getDarajaAccessToken(env, consumerKey, consumerSecret);
                  const timestamp = getTimestamp();
                  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
                  const baseUrl = env === 'production'
                    ? 'https://api.safaricom.co.ke'
                    : 'https://sandbox.safaricom.co.ke';

                  const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      BusinessShortCode: shortcode,
                      Password: password,
                      Timestamp: timestamp,
                      TransactionType: 'CustomerPayBillOnline',
                      Amount: Math.round(Number(amount)),
                      PartyA: phoneNumber,
                      PartyB: shortcode,
                      PhoneNumber: phoneNumber,
                      CallBackURL: callbackUrl,
                      AccountReference: accountReference,
                      TransactionDesc: transactionDesc,
                    }),
                  });

                  const stkData = await stkRes.json();
                  res.statusCode = stkRes.ok ? 200 : 400;
                  res.end(JSON.stringify(stkData));
                  return;
                } catch (apiErr) {
                  console.warn('[Daraja API] Live call failed, falling back to sandbox simulator:', apiErr.message);
                }
              }

              // High-fidelity local sandbox simulation
              const timestamp = getTimestamp();
              const checkoutRequestId = `ws_CO_${timestamp}_${Math.floor(100000 + Math.random() * 900000)}`;
              const merchantRequestId = `MR_${Math.floor(10000 + Math.random() * 90000)}_${timestamp.slice(-4)}`;

              transactionsStore.set(checkoutRequestId, {
                checkoutRequestId,
                merchantRequestId,
                phoneNumber,
                amount,
                createdAt: Date.now(),
                status: 'pending',
              });

              res.statusCode = 200;
              res.end(JSON.stringify({
                MerchantRequestID: merchantRequestId,
                CheckoutRequestID: checkoutRequestId,
                ResponseCode: '0',
                ResponseDescription: 'Success. Request accepted for processing',
                CustomerMessage: `Success. Request accepted for processing. Check your phone (${phoneNumber}) for the M-Pesa PIN prompt.`,
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 2. STK Query endpoint
        if (url === '/api/mpesa/query' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { checkoutRequestId } = JSON.parse(body || '{}');

              const env = process.env.DARAJA_ENVIRONMENT || 'sandbox';
              const consumerKey = process.env.DARAJA_CONSUMER_KEY;
              const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
              const shortcode = process.env.DARAJA_SHORTCODE || '174379';
              const passkey = process.env.DARAJA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

              if (consumerKey && consumerSecret) {
                try {
                  const token = await getDarajaAccessToken(env, consumerKey, consumerSecret);
                  const timestamp = getTimestamp();
                  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
                  const baseUrl = env === 'production'
                    ? 'https://api.safaricom.co.ke'
                    : 'https://sandbox.safaricom.co.ke';

                  const queryRes = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      BusinessShortCode: shortcode,
                      Password: password,
                      Timestamp: timestamp,
                      CheckoutRequestID: checkoutRequestId,
                    }),
                  });

                  const queryData = await queryRes.json();
                  res.statusCode = queryRes.ok ? 200 : 400;
                  res.end(JSON.stringify(queryData));
                  return;
                } catch (queryErr) {
                  console.warn('[Daraja API] Live query failed, checking sandbox simulator store:', queryErr.message);
                }
              }

              // Sandbox simulator logic
              const txn = transactionsStore.get(checkoutRequestId);
              const elapsed = txn ? Date.now() - txn.createdAt : 5000;

              // If testing phone ending in 0000 -> simulate cancel
              if (txn?.phoneNumber?.endsWith('0000')) {
                res.statusCode = 200;
                res.end(JSON.stringify({
                  ResponseCode: '0',
                  ResponseDescription: 'The service request has been accepted successfully',
                  MerchantRequestID: txn.merchantRequestId,
                  CheckoutRequestID: checkoutRequestId,
                  ResultCode: '1032',
                  ResultDesc: 'Request cancelled by user.',
                }));
                return;
              }

              // After ~4 seconds of simulated user PIN entry, confirm success
              if (elapsed >= 4000) {
                const receipt = 'QH' + Math.floor(10000000 + Math.random() * 90000000);
                res.statusCode = 200;
                res.end(JSON.stringify({
                  ResponseCode: '0',
                  ResponseDescription: 'The service request has been accepted successfully',
                  MerchantRequestID: txn?.merchantRequestId || 'MR_12345',
                  CheckoutRequestID: checkoutRequestId,
                  ResultCode: '0',
                  ResultDesc: 'The service request is processed successfully.',
                  MpesaReceiptNumber: receipt,
                }));
                return;
              }

              // Still pending user PIN entry on phone
              res.statusCode = 200;
              res.end(JSON.stringify({
                ResponseCode: '0',
                ResponseDescription: 'The service request has been accepted successfully',
                MerchantRequestID: txn?.merchantRequestId || 'MR_12345',
                CheckoutRequestID: checkoutRequestId,
                ResultCode: 'pending',
                ResultDesc: 'Waiting for customer PIN entry on mobile phone',
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 3. Callback webhook handler
        if (url === '/api/mpesa/callback' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              console.log('[Daraja Callback Received]:', JSON.stringify(payload, null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }));
            } catch (e) {
              res.statusCode = 400;
              res.end('Invalid callback JSON');
            }
          });
          return;
        }

        next();
      });
    },
  };
}
