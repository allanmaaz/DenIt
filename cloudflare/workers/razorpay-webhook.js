/**
 * Cloudflare Worker: Razorpay Payment Webhook Verifier
 * Securely verifies webhook signatures directly from Razorpay.
 * Updates Supabase payments & appointments state upon successful payment.
 */

async function verifyRazorpaySignature(body, signature, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expectedSignature = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return expectedSignature === signature;
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature header" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rawBody = await request.text();
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

    // Verify cryptographic signature
    if (webhookSecret) {
      const isValid = await verifyRazorpaySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    try {
      const event = JSON.parse(rawBody);

      if (event.event === "payment.captured") {
        const paymentEntity = event.payload.payment.entity;
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;
        const appointmentId = paymentEntity.notes?.appointment_id;

        // Perform Supabase update via Supabase REST API using Service Role Key
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey && appointmentId) {
          // 1. Update Payments record
          await fetch(`${supabaseUrl}/rest/v1/payments?razorpay_order_id=eq.${orderId}`, {
            method: "PATCH",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              razorpay_payment_id: paymentId,
              status: "PAID",
              updated_at: new Date().toISOString()
            })
          });

          // 2. Confirm Appointment
          await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}`, {
            method: "PATCH",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              status: "CONFIRMED",
              payment_status: "PAID",
              updated_at: new Date().toISOString()
            })
          });

          // 3. Log into audit_logs
          await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
            method: "POST",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              action: "PAYMENT_CAPTURED_WEBHOOK",
              entity_type: "APPOINTMENT",
              entity_id: appointmentId,
              metadata: { orderId, paymentId, amount: paymentEntity.amount / 100 }
            })
          });
        }
      }

      return new Response(JSON.stringify({ status: "success", received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
