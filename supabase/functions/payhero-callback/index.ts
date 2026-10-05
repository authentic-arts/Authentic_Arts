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

        // 1. Extract both Safaricom ws_CO_ ID and external AA- reference
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

        // 2. Determine transaction status
        const statusStr = String(
            resData.Status || body.Status || resData.status || body.status || ""
        ).toUpperCase();

        const isSuccess =
            statusStr === "SUCCESS" ||
            statusStr === "COMPLETED" ||
            body.success === true ||
            resData.ResultCode === 0 ||
            resData.result_code === 0;

        const receipt =
            resData.MpesaReceiptNumber ||
            resData.mpesa_receipt_number ||
            body.MpesaReceiptNumber ||
            "SUCCESS";

        const desc =
            resData.ResultDesc ||
            resData.result_desc ||
            body.message ||
            (isSuccess ? "Payment confirmed successfully" : "Payment failed");

        // 3. Build match condition to update either ID format
        const filters: string[] = [];
        if (checkoutReqId) filters.push(`checkout_request_id.eq.${checkoutReqId}`);
        if (externalRef) filters.push(`checkout_request_id.eq.${externalRef}`);

        if (filters.length > 0) {
            const matchCondition = filters.join(",");
            const { error } = await supabase
                .from("mpesa_transactions")
                .update({
                    status: isSuccess ? "completed" : "failed",
                    mpesa_receipt_number: isSuccess ? receipt : null,
                    result_code: isSuccess ? 0 : 1,
                    result_desc: desc,
                    updated_at: new Date().toISOString(),
                })
                .or(matchCondition);

            if (error) {
                console.error("Database Update Error:", error);
            } else {
                console.log(`Successfully updated transaction using filter: (${matchCondition})`);
            }
        } else {
            console.warn("No valid transaction IDs found in webhook body.");
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