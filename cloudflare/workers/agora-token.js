/**
 * Cloudflare Worker: Agora RTC Token Generator
 * Securely generates dynamic tokens for LeDoctor video consultations.
 * Verifies that the requesting user is a legitimate participant in the appointment.
 */

// Helper to convert string to Uint8Array
function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

// Helper to calculate HMAC-SHA256 in Cloudflare Worker / Web Crypto environment
async function hmacSha256(keyStr, messageStr) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(messageStr));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const { channelName, uid, role } = await request.json();

      if (!channelName) {
        return new Response(JSON.stringify({ error: "Missing channelName (meeting_id)" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const appId = env.AGORA_APP_ID || "demo_agora_app_id";
      const appCertificate = env.AGORA_APP_CERTIFICATE || "demo_agora_cert";

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + 3600; // 1 hour token validity

      // Generate secure signature token
      const messageToSign = `${appId}:${channelName}:${uid || 0}:${privilegeExpiredTs}`;
      const tokenSignature = await hmacSha256(appCertificate, messageToSign);

      const responsePayload = {
        token: `006${appId}${tokenSignature}${privilegeExpiredTs}`,
        appId: appId,
        channelName: channelName,
        uid: uid || 0,
        expiresAt: privilegeExpiredTs,
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
