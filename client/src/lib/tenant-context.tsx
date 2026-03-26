import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";

interface TenantWithRole {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string;
  ownerEmail: string;
  role: string;
  isSandbox: boolean;
  trialEndsAt?: string | null;
}

interface TenantContextType {
  currentTenant: string | null;
  currentRole: string | null;
  tenants: TenantWithRole[];
  setCurrentTenant: (slug: string) => void;
  isLoading: boolean;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  currentTenant: null,
  currentRole: null,
  tenants: [],
  setCurrentTenant: () => {},
  isLoading: true,
  refreshTenants: async () => {},
});

export function useTenant() {
  return useContext(TenantContext);
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenantState] = useState<string | null>(() => {
    return localStorage.getItem("tableicty_tenant") || null;
  });
  const [tenants, setTenants] = useState<TenantWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenants = useCallback(async () => {
    if (!user) {
      setTenants([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/tenants", { credentials: "include" });
      if (res.ok) {
        const data: TenantWithRole[] = await res.json();
        setTenants(data);
        if (data.length > 0) {
          const saved = localStorage.getItem("tableicty_tenant");
          const validSaved = saved && data.some(t => t.slug === saved);
          if (!validSaved) {
            const nonSandbox = data.find(t => !t.isSandbox);
            const sandbox = data.find(t => t.isSandbox);
            const defaultTenant = nonSandbox ? nonSandbox.slug : (sandbox ? sandbox.slug : data[0].slug);
            setCurrentTenantState(defaultTenant);
            localStorage.setItem("tableicty_tenant", defaultTenant);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch tenants", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const setCurrentTenant = useCallback((slug: string) => {
    setCurrentTenantState(slug);
    localStorage.setItem("tableicty_tenant", slug);
  }, []);

  const currentRole = currentTenant
    ? tenants.find(t => t.slug === currentTenant)?.role || null
    : null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{
      currentTenant,
      currentRole,
      tenants,
      setCurrentTenant,
      isLoading,
      refreshTenants: fetchTenants,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function getTenantParam(): string {
  const tenant = localStorage.getItem("tableicty_tenant");
  return tenant ? `?tenant=${tenant}` : "";
}

export function appendTenantParam(url: string): string {
  const tenant = localStorage.getItem("tableicty_tenant");
  if (!tenant) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tenant=${tenant}`;
}
