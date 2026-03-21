"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@/lib/api";

const TOKEN_KEY = "blog_token";
const USER_KEY = "blog_user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearStoredAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      clearStoredAuth();
      setToken(null);
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, [clearStoredAuth]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, [clearStoredAuth]);

  return { user, token, login, logout, isLoggedIn: !!token, isReady };
}
