export async function getSupabase() {
  try {
    const mod = await import("@/integrations/supabase/client");
    return mod.supabase;
  } catch (e) {
    console.error("Supabase client not ready. Environment variables may not be loaded yet.", e);
    return null;
  }
}
