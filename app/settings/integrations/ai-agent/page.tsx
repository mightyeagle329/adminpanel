"use client";

import { useMemo, useState } from "react";
import { KeyRound, Lock, Plus, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import SafetyModal from "@/components/SafetyModal";

type Scope = "CREATE" | "PUBLISH" | "RESOLVE";
type KeyRow = {
  id: string;
  name: string;
  created_at: string;
  scopes: Scope[];
  last4: string;
  revoked: boolean;
};

function randomKey() {
  const raw = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `streak_ai_${raw}`;
}

export default function AIAgentIntegrationPage() {
  const { addToast } = useToast();
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [name, setName] = useState("AI Agent Key");
  const [scopes, setScopes] = useState<Record<Scope, boolean>>({
    CREATE: true,
    PUBLISH: false,
    RESOLVE: false,
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const selectedScopes = useMemo(() => {
    return (Object.keys(scopes) as Scope[]).filter((s) => scopes[s]);
  }, [scopes]);

  const generate = () => {
    if (!name.trim()) {
      addToast({ description: "Name is required", variant: "warning" });
      return;
    }
    if (selectedScopes.length === 0) {
      addToast({ description: "Select at least one scope", variant: "warning" });
      return;
    }

    const key = randomKey();
    setGeneratedKey(key);
    setKeys((prev) => [
      {
        id: `${Date.now()}`,
        name: name.trim(),
        created_at: new Date().toISOString(),
        scopes: selectedScopes,
        last4: key.slice(-4),
        revoked: false,
      },
      ...prev,
    ]);

    addToast({
      description: "Key generated locally for UI demo. Replace with backend API later (store only hashed keys server-side).",
      variant: "info",
    });
  };

  const revoke = (id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)));
    addToast({ description: `Key revoked (local): ${id}`, variant: "warning" });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
          <KeyRound className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Agent Integration</h1>
          <p className="text-sm text-gray-400">Settings → Integrations → AI Agent</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="font-semibold">Generate API Key</div>
          <div className="text-xs text-gray-400">Scopes: Create / Publish / Resolve</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Key name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <div className="block text-xs text-gray-400 mb-1">Permission scopes</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(scopes) as Scope[]).map((s) => (
                  <label
                    key={s}
                    className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${
                      scopes[s]
                        ? "bg-emerald-900/30 border-emerald-600 text-emerald-200"
                        : "bg-gray-900 border-gray-700 text-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={scopes[s]}
                      onChange={(e) => setScopes((p) => ({ ...p, [s]: e.target.checked }))}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 border border-cyan-500 text-sm font-semibold hover:bg-cyan-500"
          >
            <Plus className="w-4 h-4" />
            Generate Key
          </button>

          {generatedKey && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-400">Copy this key now (shown once)</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      readOnly
                      value={generatedKey}
                      className="flex-1 px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-[12px] font-mono"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(generatedKey);
                        addToast({ description: "Copied to clipboard", variant: "success" });
                      }}
                      className="px-3 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-xs font-semibold hover:bg-emerald-500"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeneratedKey(null)}
                      className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs hover:bg-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Existing Keys</div>
              <div className="text-xs text-gray-400">For production: store only hashed keys server-side</div>
            </div>
            <div className="text-xs text-gray-400">{keys.length} keys</div>
          </div>

          {keys.length === 0 ? (
            <div className="text-xs text-gray-500">No keys generated yet.</div>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">
                        {k.name} {k.revoked && <span className="text-red-400">(revoked)</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(k.created_at).toLocaleString()} · last4: <span className="font-mono">{k.last4}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] text-gray-400 inline-flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        {k.scopes.join(", ")}
                      </div>
                      <button
                        type="button"
                        disabled={k.revoked}
                        onClick={() => setConfirmRevoke(k.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-700/80 border border-red-500 text-[11px] font-semibold hover:bg-red-600 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SafetyModal
        isOpen={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => {
          if (confirmRevoke) revoke(confirmRevoke);
          setConfirmRevoke(null);
        }}
        level="high-risk"
        title="Revoke API key?"
        message="⚠️ WARNING: This action cannot be undone. Any agent using this key will lose access immediately."
        confirmText="REVOKE"
      />
    </div>
  );
}
