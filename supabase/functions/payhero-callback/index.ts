import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
        console.log("PayHero Webhook Received:", JSON.stringify(body));

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const resData = body.response || body;

        // 1. Extract Safaricom ws_CO_ ID and external AA- reference
        const checkoutReqId =
            resData.CheckoutRequestID ||
            resData.checkout_request_id ||
            body.CheckoutRequestID ||
            body.checkout_request_id;

        const externalRef =
            resData.ExternalReference ||
            resData.external_reference ||
            body.ExternalReference ||
            body.external_reference ||
            body.reference;

        // 2. Extract exact Safaricom ResultCode & ResultDesc
        const rawResultCode =
            resData.ResultCode ??
            resData.result_code ??
            body.ResultCode ??
            body.result_code;

        const resultCode = rawResultCode !== undefined && rawResultCode !== null
            ? Number(rawResultCode)
            : null;

        const statusStr = String(
            resData.Status || resData.status || body.Status || body.status || ""
        ).toUpperCase();

        // 3. Strict success validation: ResultCode MUST be 0 AND status cannot be FAILED/CANCELLED
        const isSuccess =
            (resultCode === 0 || resultCode === null) &&
            statusStr !== "FAILED" &&
            statusStr !== "CANCELLED" &&
            statusStr !== "EXPIRED" &&
            body.success !== false;

        const receipt =
            resData.MpesaReceiptNumber ||
            resData.mpesa_receipt_number ||
            body.MpesaReceiptNumber ||
            null;

        const desc =
            resData.ResultDesc ||
            resData.result_desc ||
            body.message ||
            (isSuccess ? "Payment confirmed successfully" : "Payment failed");

        // 4. Update mpesa_transactions by matching either CheckoutRequestID or ExternalReference
        const filters: string[] = [];
        if (checkoutReqId) filters.push(`checkout_request_id.eq.${checkoutReqId}`);
        if (externalRef) filters.push(`checkout_request_id.eq.${externalRef}`);

        if (filters.length > 0) {
            const matchCondition = filters.join(",");
            const { error } = await supabase
                .from("mpesa_transactions")
                .update({
                    status: isSuccess ? "completed" : "failed",
                    mpesa_receipt_number: isSuccess ? (receipt || "SUCCESS") : null,
                    result_code: resultCode ?? (isSuccess ? 0 : 1),
                    result_desc: desc,
                    updated_at: new Date().toISOString(),
                })
                .or(matchCondition);

            if (error) {
                console.error("Database Update Error:", error);
            } else {
                console.log(`Updated transaction (${matchCondition}) -> status: ${isSuccess ? "completed" : "failed"}, resultCode: ${resultCode}`);
            }
        } else {
            console.warn("No valid transaction IDs found in webhook payload.");
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("Callback Execution Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});