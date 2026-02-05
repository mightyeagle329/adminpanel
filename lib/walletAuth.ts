"use client";

import bs58 from "bs58";

export type SolanaAuthMessage = {
  sender: string;
  timestamp: number;
  referrer?: string;
};

export type SolanaAuthPayload = {
  message: string; // JSON string of SolanaAuthMessage
  signedMessage: string; // bs58-encoded signature
};

export function buildSolanaAuthMessage({
  sender,
  referrer = "admin-panel",
}: {
  sender: string;
  referrer?: string;
}): SolanaAuthMessage {
  return {
    sender,
    timestamp: Date.now(),
    referrer,
  };
}

export function encodeSignedMessage(signatureBytes: Uint8Array) {
  return bs58.encode(signatureBytes);
}
