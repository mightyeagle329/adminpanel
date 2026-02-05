"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SolanaAuthPayload, buildSolanaAuthMessage, encodeSignedMessage } from "@/lib/walletAuth";
import { useAuthSession } from "@/components/AuthSessionProvider";

type LoginRequest = {
  auth_provider: string; // "wallet"
  user_key: string; // wallet public key (base58)
  signed_msg: string; // bs58 signature
  msg: string; // JSON string of SolanaAuthMessage
};

const STORAGE_KEY = "solanaAuthPayload";

export function useWalletAuth() {
  const { connected, publicKey, signMessage } = useWallet();
  const { session, setSession } = useAuthSession();

  const [payload, setPayload] = useState<SolanaAuthPayload | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SolanaAuthPayload) : null;
    } catch {
      return null;
    }
  });

  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear payload if wallet disconnects or changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!connected || !publicKey) {
      setPayload(null);
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (!payload) return;

    try {
      const msgObj = JSON.parse(payload.message) as { sender?: string };
      if (msgObj.sender && msgObj.sender !== publicKey.toBase58()) {
        setPayload(null);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      setPayload(null);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [connected, publicKey?.toBase58()]);

  const needsSignIn = useMemo(() => {
    if (!connected || !publicKey) return false;
    if (session && session.user_key === publicKey.toBase58()) return false;
    return !payload;
  }, [connected, payload, publicKey, session]);

  const signIn = useCallback(async () => {
    if (!publicKey) {
      const msg = "Wallet not connected";
      setError(msg);
      if (typeof window !== "undefined") alert(msg);
      return null;
    }
    if (!signMessage) {
      const msg = "Wallet does not support message signing";
      setError(msg);
      if (typeof window !== "undefined") alert(msg);
      return null;
    }

    setSigning(true);
    setError(null);

    try {
      const msgObj = buildSolanaAuthMessage({ sender: publicKey.toBase58() });
      const message = JSON.stringify(msgObj);
      const encoded = new TextEncoder().encode(message);

      const signatureBytes = await signMessage(encoded);
      const signedMessage = encodeSignedMessage(signatureBytes);
      const next: SolanaAuthPayload = { message, signedMessage };

      const loginReq: LoginRequest = {
        auth_provider: "wallet",
        user_key: publicKey.toBase58(),
        signed_msg: signedMessage,
        msg: message,
      };

      let res: Response;
      let data: any = null;

      try {
        res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginReq),
        });
        data = await res.json().catch(() => null);
      } catch (networkError: any) {
        const msg = networkError?.message || "Network error while contacting auth server";
        console.error("Auth network error", networkError);
        setError(msg);
        // Clear any existing session/payload so UI shows Sign in again
        setSession(null);
        setPayload(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
          alert(`Wallet sign-in failed: ${msg}`);
        }
        return null;
      }

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `Login failed (${res.status})`;
        setError(msg);
        // Clear any existing session/payload so UI shows Sign in again
        setSession(null);
        setPayload(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
          alert(`Wallet sign-in failed: ${msg}`);
        }
        return null;
      }

      const access_token =
        (data && (data.access_token as string)) ?? (data?.data?.access_token as string | undefined);
      const refresh_token =
        (data && (data.refresh_token as string)) ?? (data?.data?.refresh_token as string | undefined);
      const address =
        (data && (data.address as string)) ?? (data?.data?.address as string | undefined);

      if (typeof access_token === "string" && typeof refresh_token === "string") {
        // Only persist payload after backend confirms login
        setPayload(next);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }

        setSession({
          auth_provider: "wallet",
          user_key: publicKey.toBase58(),
          address,
          access_token,
          refresh_token,
          raw: data,
          created_at: Date.now(),
        });
        return next;
      } else {
        const msg = "Login response missing tokens";
        setError(msg);
        // Clear any existing session/payload so UI shows Sign in again
        setSession(null);
        setPayload(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
          alert(`Wallet sign-in failed: ${msg}`);
        }
        return null;
      }
    } catch (e: any) {
      console.error("Wallet sign-in error", e);
      const msg = e?.message || "Unknown error during wallet sign-in";
      setError(msg);
      // Clear any existing session/payload so UI shows Sign in again
      setSession(null);
      setPayload(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
        alert(`Wallet sign-in failed: ${msg}`);
      }
      return null;
    } finally {
      setSigning(false);
    }
  }, [publicKey, setSession, signMessage]);

  return {
    connected,
    publicKey,
    signing,
    error,
    needsSignIn,
    session,
    signIn,
  };
}
