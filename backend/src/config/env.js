const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = [
  "PORT",
  "FRONTEND_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_KEY",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

function isPlaceholderLike(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return (
    normalized.includes("your-") ||
    normalized.includes("replace-") ||
    normalized.includes("example") ||
    normalized.includes("changeme")
  );
}

function looksLikeSupabaseApiKey(value) {
  const normalized = String(value || "").trim();
  return normalized.startsWith("eyJ") || normalized.startsWith("sb_");
}

const supabaseKeysToValidate = [
  { name: "SUPABASE_ANON_KEY", value: process.env.SUPABASE_ANON_KEY },
  { name: "SUPABASE_SERVICE_KEY", value: process.env.SUPABASE_SERVICE_KEY },
];

for (const entry of supabaseKeysToValidate) {
  if (isPlaceholderLike(entry.value) || !looksLikeSupabaseApiKey(entry.value)) {
    throw new Error(
      `${entry.name} appears invalid. Paste a real Supabase API key from your project settings.`
    );
  }
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL,
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  },
};
