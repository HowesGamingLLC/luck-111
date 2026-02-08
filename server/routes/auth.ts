import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client on the server side
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("[Auth Routes] Initializing Supabase...");
console.log("[Auth Routes] VITE_SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
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
    if (!supabase) {
      return res.status(500).json({ error: "Authentication service unavailable" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase auth error:", error);
      return res.status(401).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ error: "No session returned" });
    }

    // Return session and user data
    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
    });
  } catch (error) {
    console.error("Login handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/auth/register
 * Proxy endpoint for Supabase registration
 */
export const registerHandler: RequestHandler = async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: "Authentication service unavailable" });
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
      return res.status(500).json({ error: "Authentication service unavailable" });
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
