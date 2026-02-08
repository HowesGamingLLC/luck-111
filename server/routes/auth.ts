import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client on the server side
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("[Auth Routes] Initializing Supabase...");
console.log(
  "[Auth Routes] VITE_SUPABASE_URL:",
  supabaseUrl ? "✓ Set" : "✗ Missing",
);
console.log(
  "[Auth Routes] VITE_SUPABASE_ANON_KEY:",
  supabaseAnonKey ? "✓ Set" : "✗ Missing",
);

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

if (!supabase) {
  console.error(
    "[Auth Routes] Supabase client not initialized - auth will not work",
  );
}

/**
 * POST /api/auth/login
 * Proxy endpoint for Supabase authentication
 */
export const loginHandler: RequestHandler = async (req, res) => {
  try {
    console.log("[Auth] Login attempt");

    if (!supabase) {
      console.error("[Auth] Supabase not initialized");
      return res
        .status(500)
        .json({ error: "Authentication service unavailable" });
    }

    const { email, password } = req.body;
    console.log("[Auth] Login for email:", email);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Auth] Supabase auth error details:");
      console.error("[Auth] - Message:", error.message);
      console.error("[Auth] - Status:", (error as any).status);
      console.error("[Auth] - Code:", (error as any).code);
      console.error("[Auth] - Full error:", JSON.stringify(error, null, 2));

      let statusCode = 401;
      let errorMessage = error.message || "Authentication failed";

      // Check if it's a network error
      if (
        error.message?.includes("fetch failed") ||
        error.message?.includes("ENOTFOUND")
      ) {
        statusCode = 503;
        errorMessage =
          "Authentication service temporarily unavailable. Supabase server cannot be reached. Please verify your Supabase project is running and accessible. Check /api/health for details.";
      }

      return res.status(statusCode).json({
        error: errorMessage,
        code: (error as any).code,
        message: error.message,
        hint: "If Supabase is unreachable, check network connectivity and verify the project exists at https://app.supabase.com",
      });
    }

    if (!data.session) {
      console.error("[Auth] No session returned from Supabase");
      return res.status(401).json({ error: "No session returned" });
    }

    console.log("[Auth] Login successful for:", email);

    // Return session and user data
    const responseData = {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token || null,
        expires_in: data.session.expires_in || null,
        expires_at: data.session.expires_at || null,
      },
      user: {
        id: data.user.id,
        email: data.user.email || email,
        created_at: data.user.created_at || new Date().toISOString(),
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.json(responseData);
  } catch (error) {
    console.error("[Auth] Login handler exception:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * POST /api/auth/register
 * Proxy endpoint for Supabase registration
 */
export const registerHandler: RequestHandler = async (req, res) => {
  try {
    if (!supabase) {
      return res
        .status(500)
        .json({ error: "Authentication service unavailable" });
    }

    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || "" },
      },
    });

    if (error) {
      console.error("Supabase signup error:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: "Failed to create user" });
    }

    // Return user data (no session on signup as email confirmation may be required)
    res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
      message: "User created successfully. Please check your email to confirm.",
    });
  } catch (error) {
    console.error("Register handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/auth/logout
 * Handle logout (clear session)
 */
export const logoutHandler: RequestHandler = async (req, res) => {
  try {
    // Logout is handled on the client side by clearing the session
    // This endpoint is mainly for cleanup if needed
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh the access token using refresh token
 */
export const refreshHandler: RequestHandler = async (req, res) => {
  try {
    if (!supabase) {
      return res
        .status(500)
        .json({ error: "Authentication service unavailable" });
    }

    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      console.error("Token refresh error:", error);
      return res.status(401).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ error: "Failed to refresh session" });
    }

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error("Refresh handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
