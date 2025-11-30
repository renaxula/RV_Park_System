import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (err) {
      console.error("Failed to fetch session", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(
    async (credentials) => {
      setError(null);
      await api.post("/auth/login", credentials);
      await fetchMe();
    },
    [fetchMe]
  );

  const register = useCallback(
    async (payload) => {
      setError(null);
      await api.post("/auth/register", payload);
      await fetchMe();
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    setError(null);
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo(() => {
    const hasRole = (requiredRole = "customer") => {
      if (!user) return false;
      if (!requiredRole) return true;
      const levels = { customer: 0, employee: 1, admin: 2 };
      return levels[user.role] >= levels[requiredRole];
    };
    return {
      user,
      loading,
      error,
      setError,
      login,
      register,
      logout,
      hasRole,
      isAuthenticated: !!user,
      homePage:
          user?.role === "customer"
          ? "/customer-dash"
          : user?.role === "admin"
          ? "/admin-dash"
          : user?.role === "employee"
          ? "/employee-dash"
          : "/customer-dash"
    };
  }, [error, loading, logout, register, user, login]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
