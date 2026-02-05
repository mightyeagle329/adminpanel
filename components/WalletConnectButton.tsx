"use client";

import React, { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { Loader2, Wallet as WalletIcon, ChevronDown } from "lucide-react";

function shortAddress(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { connected, publicKey, connect, disconnect } = useWallet();
  const { signing, needsSignIn, session, signIn, clearSession } = useWalletAuth();
  const { setVisible } = useWalletModal();

  const handleClick = useCallback(async () => {
    try {
      if (!connected) {
        // For fresh connections, just open the wallet modal and
        // let the adapter handle user selection/approval.
        setVisible(true);
        return;
      }
      // Once connected, if we still need sign-in, trigger it
      if (!signing && needsSignIn) {
        await signIn();
      }
    } catch (e) {
      console.error("Wallet connect/sign-in error", e);
    }
  }, [connected, needsSignIn, setVisible, signIn, signing]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      // Clear auth session so user must sign in again next time
      clearSession();
    } catch (e) {
      console.error("Wallet disconnect error", e);
    }
  }, [clearSession, disconnect]);

  const label = (() => {
    if (signing) return "Signing...";
    if (!connected) return "Connect Wallet";
    if (needsSignIn) return "Sign in";

    const addr = session?.address || publicKey?.toBase58();
    return addr ? shortAddress(addr) : "Connected";
  })();

  const isAuthed = connected && !!session && session.user_key === publicKey?.toBase58();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={signing}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-600 text-white text-xs font-medium border border-cyan-500/70 shadow-sm hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {signing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <WalletIcon className="w-3.5 h-3.5" />
        )}
        <span>{label}</span>
        {isAuthed && <ChevronDown className="w-3 h-3 opacity-70" />}
      </button>

      {isAuthed && (
        <button
          onClick={handleDisconnect}
          className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-full bg-gray-900 text-gray-300 border border-gray-700 text-[11px] hover:bg-gray-800 transition-colors"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
