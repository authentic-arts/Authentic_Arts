// supabase/functions/mpesa/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getTimestamp(): string {
  const date = new Date();
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

async function getAccessToken(env: string, key: string, secret: string): Promise<string> {
  const baseUrl = env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

  const credentials = btoa(`${key}:${secret}`);
  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Daraja OAuth failed: ${txt}`);
  }

  const data = await res.json();
  return data.access_token;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = Deno.env.get("DARAJA_ENVIRONMENT") || "sandbox";
    const consumerKey = Deno.env.get("DARAJA_CONSUMER_KEY") || "";
    const consumerSecret = Deno.env.get("DARAJA_CONSUMER_SECRET") || "";
    const shortcode = Deno.env.get("DARAJA_SHORTCODE") || "174379";
    const passkey = Deno.env.get("DARAJA_PASSKEY") || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    const callbackUrl = Deno.env.get("DARAJA_CALLBACK_URL") || "https://fmneiiaqwjnwcdjjeqrs.supabase.co/functions/v1/mpesa";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const baseUrl = env === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    const body = await req.json();

    // 1. SAFARICOM STK CALLBACK WEBHOOK
    if (body?.Body?.stkCallback) {
      const callbackData = body.Body.stkCallback;
      const checkoutRequestId = callbackData.CheckoutRequestID;
      const resultCode = Number(callbackData.ResultCode);
      const resultDesc = callbackData.ResultDesc;

      let mpesaReceipt = "";
      if (resultCode === 0 && callbackData.CallbackMetadata?.Item) {
        const items = callbackData.CallbackMetadata.Item;
        const receiptObj = items.find((item: any) => item.Name === "MpesaReceiptNumber");
        if (receiptObj) mpesaReceipt = receiptObj.Value;
      }

      // Update mpesa_transactions record in Supabase
      const { data: updatedTx } = await supabase
        .from("mpesa_transactions")
        .update({
          status: resultCode === 0 ? "completed" : "failed",
          result_code: resultCode,
          result_desc: resultDesc,
          mpesa_receipt_number: mpesaReceipt || null,
        })
        .eq("checkout_request_id", checkoutRequestId)
        .select()
        .single();

      // Clear the user's cart on payment success
      if (resultCode === 0 && updatedTx?.user_id) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", updatedTx.user_id);
      }

      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. STK PUSH ACTION
    if (body.action === "stkpush") {
      const { phoneNumber, amount, accountReference = "AuthenticArts", transactionDesc = "Artwork Purchase" } = body;
      const token = await getAccessToken(env, consumerKey, consumerSecret);
      const timestamp = getTimestamp();
      const password = btoa(`${shortcode}${passkey}${timestamp}`);

      const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
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
      return new Response(JSON.stringify(stkData), {
        status: stkRes.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. QUERY ACTION
    if (body.action === "query") {
      const { checkoutRequestId } = body;
      const token = await getAccessToken(env, consumerKey, consumerSecret);
      const timestamp = getTimestamp();
      const password = btoa(`${shortcode}${passkey}${timestamp}`);

      const queryRes = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        }),
      });

      const queryData = await queryRes.json();
      return new Response(JSON.stringify(queryData), {
        status: queryRes.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});