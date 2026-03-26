import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest } from "./queryClient";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPlatformAdmin: boolean;
  emailVerified: boolean;
  requiresVerification?: boolean;
}

interface MfaResponse {
  requiresMfa: true;
  maskedEmail: string;
  lab_code?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser | MfaResponse>;
  verifyLoginMfa: (code: string) => Promise<AuthUser>;
  resendLoginCode: () => Promise<{ lab_code?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({} as AuthUser),
  verifyLoginMfa: async () => ({} as AuthUser),
  resendLoginCode: async () => ({}),
  register: async () => ({} as AuthUser),
  logout: async () => {},
  verifyEmail: async () => {},
  resendCode: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser | MfaResponse> => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    if (data.requiresMfa) {
      return data as MfaResponse;
    }
    setUser(data);
    setIsLoading(false);
    return data;
  }, []);

  const verifyLoginMfa = useCallback(async (code: string): Promise<AuthUser> => {
    const res = await apiRequest("POST", "/api/auth/verify-login-mfa", { code });
    const data = await res.json();
    setUser(data);
    setIsLoading(false);
    return data;
  }, []);

  const resendLoginCode = useCallback(async (): Promise<{ lab_code?: string }> => {
    const res = await apiRequest("POST", "/api/auth/resend-login-code");
    const data = await res.json();
    return data;
  }, []);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }): Promise<AuthUser> => {
    const res = await apiRequest("POST", "/api/auth/register", data);
    const userData = await res.json();
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
    localStorage.removeItem("tableicty_tenant");
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    const res = await apiRequest("POST", "/api/auth/verify-email", { code });
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
    }
  }, []);

  const resendCode = useCallback(async () => {
    await apiRequest("POST", "/api/auth/resend-code");
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyLoginMfa, resendLoginCode, register, logout, verifyEmail, resendCode, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
