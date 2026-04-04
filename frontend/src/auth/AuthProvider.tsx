import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProfile, login as loginApi, logout as logoutApi, refreshSession, signup as signupApi } from "./api";
import type { AuthResponse, AuthUser } from "./types";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const ACCESS_TOKEN_KEY = "odoo_pos_access_token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistSession(data: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data: AuthResponse) => {
    persistSession(data);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout API failure and clear local session anyway.
    }
    clearSession();
    setAccessToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginApi(email, password);
      applySession(data);
    },
    [applySession]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await signupApi(name, email, password);
      applySession(data);
    },
    [applySession]
  );

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await getProfile(storedToken);
        setAccessToken(storedToken);
        setUser(me.user);
      } catch {
        try {
          const refreshed = await refreshSession();
          applySession(refreshed);
        } catch {
          clearSession();
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [applySession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      signup,
      logout,
    }),
    [user, accessToken, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
