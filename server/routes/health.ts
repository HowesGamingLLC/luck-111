import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import dns from "dns/promises";

// Initialize Supabase client on the server side
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

/**
 * GET /api/health
 * Check server and Supabase connectivity
 */
export const healthHandler: RequestHandler = async (req, res) => {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: supabaseUrl ? "✓ Set" : "✗ Missing",
        supabaseKey: supabaseAnonKey ? "✓ Set" : "✗ Missing",
      },
      supabase: {
        canResolve: false,
        canConnect: false,
        error: null as string | null,
      },
    };

    // Try to resolve Supabase domain
    if (supabaseUrl) {
      try {
        const hostname = new URL(supabaseUrl).hostname;
        console.log("[Health] Resolving hostname:", hostname);

        const resolved = await dns.resolve4(hostname);
        console.log("[Health] DNS resolved to:", resolved);
        health.supabase.canResolve = true;

        // Try to connect to Supabase
        if (supabaseUrl && supabaseAnonKey) {
          try {
            const supabase = createClient(supabaseUrl, supabaseAnonKey);

            // Test a simple query
            const { data, error } = await Promise.race([
              supabase.from("profiles").select("id").limit(1),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Supabase connection timeout")),
                  5000,
                ),
              ),
            ]);

            if (!error) {
              health.supabase.canConnect = true;
              console.log("[Health] Supabase connection successful");
            } else {
              health.supabase.canConnect = false;
              health.supabase.error = (error as any).message;
              console.error("[Health] Supabase query error:", error);
            }
          } catch (error) {
            health.supabase.canConnect = false;
            health.supabase.error = error instanceof Error ? error.message : String(error);
            console.error("[Health] Supabase connection error:", error);
          }
        }
      } catch (dnsError) {
        health.supabase.canResolve = false;
        health.supabase.error = dnsError instanceof Error ? dnsError.message : String(dnsError);
        console.error("[Health] DNS resolution error:", dnsError);
      }
    }

    res.json(health);
  } catch (error) {
    console.error("[Health] Handler error:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};
