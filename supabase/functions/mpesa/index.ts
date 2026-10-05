import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const amount = body.amount;
    const rawPhone = body.phone_number || body.phoneNumber || body.phone;
    const reference = body.reference || body.accountReference || `AA-${Date.now()}`;

    let authToken = Deno.env.get("PAYHERO_AUTH_TOKEN") || "";
    const channelId = Number(Deno.env.get("PAYHERO_CHANNEL_ID"));

    if (!authToken || !channelId) {
      return new Response(
        JSON.stringify({
          status: false,
          error: "PayHero secrets (PAYHERO_AUTH_TOKEN or PAYHERO_CHANNEL_ID) are missing in Supabase."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Automatically ensure 'Basic ' prefix is present
    authToken = authToken.trim();
    if (!authToken.toLowerCase().startsWith("basic ")) {
      authToken = `Basic ${authToken}`;
    }

    let phone = String(rawPhone || "").replace(/[\s+]/g, '');

    const payload = {
      amount: Number(amount),
      phone_number: phone,
      channel_id: channelId,
      provider: "m-pesa",
      external_reference: reference,
      callback_url: "https://fmneiiaqwjnwcdjjeqrs.supabase.co/functions/v1/payhero-callback",
    };

    const res = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("PayHero Response Data:", JSON.stringify(data));

    return new Response(
      JSON.stringify({
        ...data,
        error: res.ok ? null : (data.message || data.error || data.detail || `PayHero returned status ${res.status}`),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: false, error: err.message || "Edge Function execution error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});