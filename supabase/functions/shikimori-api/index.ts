import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SHIKIMORI_BASE = "https://shikimori.one/api";

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/functions\/v1\/shikimori-api/, "");
    const queryString = url.searchParams.toString();
    const targetUrl = `${SHIKIMORI_BASE}${path}${queryString ? "?" + queryString : ""}`;

    // Check cache in Supabase table
    const cacheKey = targetUrl;
    const { data: cachedRow } = await supabase
      .from("api_cache")
      .select("data, fetched_at")
      .eq("url", cacheKey)
      .maybeSingle();

    if (cachedRow) {
      const age = Date.now() - new Date(cachedRow.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return new Response(JSON.stringify(cachedRow.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch from Shikimori
    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "AniStream/1.0",
        "Accept": "application/json",
      },
    });

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: `Shikimori API returned ${resp.status}` }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();

    // Save to cache table (upsert)
    await supabase
      .from("api_cache")
      .upsert({ url: cacheKey, data, fetched_at: new Date().toISOString() }, { onConflict: "url" });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
