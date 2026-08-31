import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import * as authService from "../services/auth";
import type { AuthUser } from "../services/auth";
import { setSessionExpiredHandler } from "../services/api";
import type { LoginPayload, RegisterPayload } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true only during the initial session-restore check
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Called both on logout and when api.ts reports a failed background
  // refresh (refresh token expired/blacklisted while the app was open).
  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      // We only check whether a refresh token exists locally — we don't
      // ping the backend here. If it's actually expired or blacklisted,
      // the first real API call will 401, api.ts will try to refresh,
      // fail, and clearSession() fires via the handler above.
      const hasSession = await authService.isLoggedIn();
      if (hasSession) {
        const cachedUser = await authService.getCachedUser();
        setUser(cachedUser ?? { id: -1 }); // id unknown fallback shouldn't normally happen
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const loggedInUser = await authService.login(payload);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const registeredUser = await authService.register(payload);
    setUser(registeredUser);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}