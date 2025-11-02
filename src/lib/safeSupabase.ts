import { supabase } from "@/integrations/supabase/client";

// Use the single shared Supabase client everywhere to avoid multiple GoTrue instances.
// This prevents auth/session desync and "Multiple GoTrueClient instances" warnings.
export async function getSupabase() {
  return supabase;
}

