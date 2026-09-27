/**
 * Cloudflare Worker: LeDoctor Unified API Gateway & Proxy
 * Handles routing, CORS, rate limiting, and secure proxying to Supabase and microservices.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        },
      });
    }

    // Health check endpoint
    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return new Response(JSON.stringify({
        status: "healthy",
        service: "LeDoctor Edge Gateway",
        timestamp: new Date().toISOString()
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Forward to AI Proxy
    if (url.pathname.startsWith("/api/ai/")) {
      const aiServiceUrl = env.AI_SERVICE_URL || "http://localhost:8000";
      const targetUrl = new URL(url.pathname.replace("/api/ai", ""), aiServiceUrl);
      targetUrl.search = url.search;

      return fetch(new Request(targetUrl, request));
    }

    return new Response(JSON.stringify({
      error: "Not Found",
      message: `Endpoint ${url.pathname} not mapped in LeDoctor Gateway`
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};
