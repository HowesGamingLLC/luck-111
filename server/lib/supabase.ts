import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRole) {
  console.warn(
    "Supabase server env vars missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE.",
  );
}

export const supabaseAdmin =
  supabaseUrl && serviceRole
    ? createClient(supabaseUrl, serviceRole, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;
