// Supabase client setup

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kaokqdggrlavjurtwlcb.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "";

if (!supabaseKey) {
  console.warn(
    "SUPABASE_KEY environment variable not set. Using mock data mode."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // We'll handle sessions manually if needed
  },
});

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!supabaseKey;
}

