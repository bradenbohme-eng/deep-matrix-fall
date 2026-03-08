import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { action, connectionId, endpointUrl, connectionType, payload } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case "health_check":
        return json({ status: "ok", engine: "vm-proxy", timestamp: new Date().toISOString() });

      case "test": {
        // Test connectivity to an external endpoint
        const url = endpointUrl;
        if (!url) return json({ error: "endpointUrl required" }, 400);

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const start = performance.now();
          const resp = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: { "User-Agent": "AIMOS-VM-Proxy/1.0" },
          });
          clearTimeout(timeout);
          const latency = performance.now() - start;

          // Accept any 2xx or even 4xx (means server is reachable)
          const reachable = resp.status < 500;
          const body = await resp.text().catch(() => "");

          return json({
            ok: reachable,
            status: resp.status,
            latency: Math.round(latency),
            bodyPreview: body.slice(0, 200),
          });
        } catch (e: any) {
          return json({
            ok: false,
            error: e.name === "AbortError" ? "Connection timed out (10s)" : e.message,
          });
        }
      }

      case "proxy": {
        // Proxy a request to an external endpoint
        if (!connectionId) return json({ error: "connectionId required" }, 400);

        const { data: conn, error: connErr } = await sb
          .from("aimos_vm_connections")
          .select("*")
          .eq("id", connectionId)
          .single();

        if (connErr || !conn) return json({ error: "Connection not found" }, 404);

        const targetUrl = conn.endpoint_url;
        const config = conn.config || {};

        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          // Add auth headers based on connection type
          if (config.apiKey) {
            if (conn.connection_type === "openai" || conn.connection_type === "gemini") {
              headers["Authorization"] = `Bearer ${config.apiKey}`;
            } else if (conn.connection_type === "mcp") {
              headers["X-API-Key"] = config.apiKey;
            }
          }

          const resp = await fetch(targetUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });

          const data = await resp.json().catch(() => ({}));

          // Update connection status
          await sb
            .from("aimos_vm_connections")
            .update({
              status: resp.ok ? "ok" : "error",
              last_tested_at: new Date().toISOString(),
            })
            .eq("id", connectionId);

          return json({ ok: resp.ok, status: resp.status, data });
        } catch (e: any) {
          await sb
            .from("aimos_vm_connections")
            .update({ status: "error", last_tested_at: new Date().toISOString() })
            .eq("id", connectionId);

          return json({ ok: false, error: e.message }, 502);
        }
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    console.error("vm-proxy error:", e);
    return json({ error: e.message || "Unknown error" }, 500);
  }
});
