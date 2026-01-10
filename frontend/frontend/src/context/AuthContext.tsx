import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

export type RoleName = "employee" | "manager" | "admin";

export type UserProfile = {
  userId: number;
  firstname: string;
  surname: string;
  email: string;
  department: string;
  annualLeaveBalance: number;
  role: {
    roleId: number;
    name: RoleName;
  };
};

type AuthContextType = {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    if (!token) {
      setUser(null);
      return;
    }
    
    const me = await api<{ message: string; data: UserProfile }>("/api/auth/me", { auth: true });
    setUser(me.data);
  };

  const login = async (email: string, password: string) => {
    
    const res = await api<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("token", res.token);
    setToken(res.token);

    
    const me = await api<{ message: string; data: UserProfile }>("/api/auth/me", { auth: true });
    setUser(me.data);
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        // Token might be expired/invalid
        logout();
      } finally {
        setLoading(false);
      }
    })();
    
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, login, logout, refreshMe }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
