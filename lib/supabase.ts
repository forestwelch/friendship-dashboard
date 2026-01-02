// Supabase client setup

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kaokqdggrlavjurtwlcb.supabase.co";
// Use NEXT_PUBLIC_ prefix for client-side access
// For client components, we need NEXT_PUBLIC_SUPABASE_KEY
// For server components, we can use SUPABASE_KEY
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || "";

if (!supabaseKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "Supabase key not found. Please set NEXT_PUBLIC_SUPABASE_KEY in .env.local for client-side access."
    );
  } else {
    console.warn(
      "Supabase key not found. Please set SUPABASE_KEY or NEXT_PUBLIC_SUPABASE_KEY in .env.local."
    );
  }
}

// Create client - will work even with empty key (queries will just fail gracefully)
export const supabase = createClient(supabaseUrl, supabaseKey || "dummy-key", {
  auth: {
    persistSession: false, // We'll handle sessions manually if needed
  },
});

// Admin client for server-side operations (bypasses RLS)
// Use SUPABASE_SERVICE_ROLE_KEY for server-side admin operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!supabaseKey && supabaseKey !== "dummy-key";
}

// Helper to get admin client (for server-side operations that need to bypass RLS)
// Falls back to regular client if service role key is not configured (for development)
export function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }
  // Fallback to regular client if admin not configured
  // This will work with the temporary migration that allows public writes
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY not configured. Using regular client. " +
      "For production, set SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  return supabase;
}
