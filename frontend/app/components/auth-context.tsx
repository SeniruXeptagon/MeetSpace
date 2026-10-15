"use client";

import Keycloak from "keycloak-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Profile = { id: string | null; name: string | null; email: string | null };
type AuthState = "loading" | "authenticated" | "unauthenticated" | "error";
type AuthContextValue = {
  state: AuthState;
  profile: Profile | null;
  error: string | null;
  login: (destination?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const keycloak = new Keycloak({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8081",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "meeting-room",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "meeting-room-frontend",
});
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
let initialization: Promise<boolean> | null = null;

function initialize() {
  initialization ??= keycloak.init({
    onLoad: window.location.pathname === "/login" ? undefined : "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
  return initialization;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    keycloak.onAuthLogout = () => {
      if (active) {
        setProfile(null);
        setState("unauthenticated");
      }
    };
    keycloak.onAuthRefreshError = () => {
      keycloak.clearToken();
      if (active) setState("unauthenticated");
    };

    async function checkAuthentication() {
      try {
        const authenticated = await initialize();
        if (!active) return;
        if (!authenticated) {
          setState("unauthenticated");
          return;
        }
        await keycloak.updateToken(30);
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${keycloak.token}` },
          cache: "no-store",
        });
        if (!active) return;
        if (response.status === 401 || response.status === 403) {
          setError("The backend rejected the Keycloak token. Check the API audience and issuer settings.");
          setState("error");
          return;
        }
        if (!response.ok) throw new Error(`Backend returned ${response.status}.`);
        setProfile(await response.json() as Profile);
        setState("authenticated");
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not connect to Keycloak or the backend.");
        setState("error");
      }
    }

    void checkAuthentication();
    return () => { active = false; };
  }, []);

  async function login(destination = "/dashboard") {
    await initialize();
    await keycloak.login({ redirectUri: `${window.location.origin}${destination}` });
  }

  async function logout() {
    await keycloak.logout({ redirectUri: `${window.location.origin}/login` });
  }

  return <AuthContext.Provider value={{ state, profile, error, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
