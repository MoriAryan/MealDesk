const getEnv = (key: string, fallback: string) => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return typeof value === "string" && value.length > 0 ? value : fallback;
};

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const appEnv = {
  apiBaseUrl: normalizeApiBaseUrl(getEnv("VITE_API_BASE_URL", "http://localhost:4000/api")),
  socketBaseUrl: getEnv("VITE_SOCKET_BASE_URL", "http://localhost:4000"),
  supabaseUrl: getEnv("VITE_SUPABASE_URL", ""),
  supabaseAnonKey: getEnv("VITE_SUPABASE_ANON_KEY", ""),
};
