const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabasePublic = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = {
  supabaseAdmin,
  supabasePublic,
};

