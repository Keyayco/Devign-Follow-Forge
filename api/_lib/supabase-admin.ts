import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn("Supabase admin environment variables are missing. API routes will fail until configured.");
}

export const supabaseAdmin = createClient(url || "http://localhost", key || "missing", {
  auth: { persistSession: false, autoRefreshToken: false },
});
