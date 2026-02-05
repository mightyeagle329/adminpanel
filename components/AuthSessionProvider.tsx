"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type WalletSession = {
  auth_provider: "wallet";
  user_key: string; // wallet pubkey
  address?: string; // optional backend user address/id
  access_token: string;
  refresh_token: string;
  raw?: any; // full backend response for debugging
  created_at: number;
};

type AuthSessionContextValue = {
  session: WalletSession | null;
  setSession: (s: WalletSession | null) => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "walletAuthSession";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSessionState] = useState<WalletSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WalletSession) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
  }, [session]);

  const setSession = (value: WalletSession | null) => {
    setSessionState(value);
  };

  return (
    <AuthSessionContext.Provider value={{ session, setSession }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return ctx;
}
