export async function getSupabase() {
  try {
    const { createClient } = await import("@supabase/supabase-js");

    // Primary sources: env vars injected by Cloud at build time
    let url: string | undefined = (import.meta as any).env?.VITE_SUPABASE_URL;
    let key: string | undefined = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;

    // Secondary: derive from project id if URL missing
    if (!url) {
      const pid = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
      if (pid) url = `https://${pid}.supabase.co`;
    }

    // FINAL SAFETY FALLBACKS for preview reliability only (publishable-only)
    if (!url) url = "https://fwiaqwojpbonojpuggah.supabase.co";
    if (!key) key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aWFxd29qcGJvbm9qcHVnZ2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDIxODcsImV4cCI6MjA3NzMxODE4N30.E1JOeUFWCcdDNST1JlYinwoLCo6LD1M0LLjjfJ54ImA";

    if (!url || !key) throw new Error("Supabase env not available");

    const client = createClient(url, key, {
      auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
    });
    return client;
  } catch (e) {
    console.error("Supabase client not ready. Environment variables may not be loaded yet.", e);
    return null;
  }
}
