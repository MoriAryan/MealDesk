import { createClient } from "@supabase/supabase-js";
import env from "./env.js";

export const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const supabasePublic = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
