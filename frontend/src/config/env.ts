const getEnv = (key: string, fallback: string) => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return typeof value === "string" && value.length > 0 ? value : fallback;
};

export const appEnv = {
  apiBaseUrl: getEnv("VITE_API_BASE_URL", "http://localhost:4000/api"),
  socketBaseUrl: getEnv("VITE_SOCKET_BASE_URL", "http://localhost:4000"),
  supabaseUrl: getEnv("VITE_SUPABASE_URL", ""),
  supabaseAnonKey: getEnv("VITE_SUPABASE_ANON_KEY", ""),
};
