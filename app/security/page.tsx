"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Eye, RefreshCw, Shield, Snowflake, ThumbsUp } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import SafetyModal from "@/components/SafetyModal";
import { fastApiClient } from "@/lib/fastApiClient";
import type { SybilSuspect } from "@/lib/types";

type SentinelFlag = {
  tx_hash: string;
  wallet_address: string;
  flag_type: string;
  violation: string;
  timestamp: string;
  action_taken: string;
};

export default function SecurityPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"sybil" | "sentinel" | "audit">("sybil");
  const [isLoading, setIsLoading] = useState(true);
  const [sybils, setSybils] = useState<SybilSuspect[]>([]);
  const [sentinel, setSentinel] = useState<SentinelFlag[]>([]);
  const [audit, setAudit] = useState<any[]>([]);

  const [confirm, setConfirm] = useState<null | {
    level: "high-risk" | "nuclear";
    title: string;
    message: string;
    verificationWord?: string;
    action: () => Promise<void> | void;
  }>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [s, sf, alRaw] = await Promise.all([
        fastApiClient.getSybilSuspects(false),
        fastApiClient.getSentinelFlags(false),
        fastApiClient.getAuditLog(100),
      ]);
      setSybils(Array.isArray(s) ? s : []);
      setSentinel(Array.isArray(sf) ? (sf as SentinelFlag[]) : []);
      const al: any = alRaw as any;
      setAudit(al?.logs || []);
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to load security data", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openFreeze = (userId: string) => {
    setConfirm({
      level: "high-risk",
      title: "Freeze account?",
      message: `This will freeze trading and funds for user ${userId}.` ,
      action: async () => {
        await fastApiClient.freezeAccount(userId, "Manual freeze from admin panel");
        addToast({ description: `Account frozen: ${userId}`, variant: "warning" });
        load();
      },
    });
  };

  const openShadowBan = (userId: string) => {
    setConfirm({
      level: "high-risk",
      title: "Confirm Shadow Ban",
      message: `User ${userId} will keep trading, but will be removed from leaderboards.` ,
      action: async () => {
        await fastApiClient.shadowBanUser(userId);
        addToast({ description: `Shadow banned: ${userId}`, variant: "success" });
        load();
      },
    });
  };

  const openForgive = (userId: string) => {
    setConfirm({
      level: "high-risk",
      title: "Forgive user?",
      message: `This will remove the Sybil flag for user ${userId}.` ,
      action: async () => {
        await fastApiClient.forgiveUser(userId);
        addToast({ description: `Forgiven: ${userId}`, variant: "success" });
        load();
      },
    });
  };

  const openBanWallet = (wallet: string) => {
    setConfirm({
      level: "nuclear",
      title: "Ban wallet for direct contract interaction?",
      message: `This will freeze the wallet and purge leaderboards: ${wallet}`,
      verificationWord: "BAN",
      action: async () => {
        await fastApiClient.banDirectContractInteraction(wallet);
        addToast({ description: `Wallet banned: ${wallet}`, variant: "warning" });
        load();
      },
    });
  };

  const content = useMemo(() => {
    if (tab === "sybil") {
      return (
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Sybil Hunter Dashboard</div>
              <div className="text-xs text-gray-400">Users flagged with is_sybil_suspect</div>
            </div>
            <div className="text-xs text-gray-400">{sybils.length} suspects</div>
          </div>

          {sybils.length === 0 ? (
            <div className="text-xs text-gray-500">No suspects returned by API.</div>
          ) : (
            <div className="overflow-auto border border-[#34316b] rounded-xl bg-[#221f54]">
              <table className="min-w-full text-xs text-gray-200">
                <thead className="bg-[#252264] sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">User</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">Wallet</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">Reason</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {sybils.map((u) => (
                    <tr key={u.user_id} className="hover:bg-[#292567]">
                      <td className="px-3 py-2">{u.user_id}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-gray-300">{u.wallet_address}</td>
                      <td className="px-3 py-2">{u.detection_reason}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="px-2 py-1 rounded bg-yellow-700/80 border border-yellow-500 text-[11px] hover:bg-yellow-600 inline-flex items-center gap-1"
                            onClick={() => openShadowBan(u.user_id)}
                          >
                            <Eye className="w-3 h-3" /> Shadow Ban
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-emerald-700/80 border border-emerald-500 text-[11px] hover:bg-emerald-600 inline-flex items-center gap-1"
                            onClick={() => openForgive(u.user_id)}
                          >
                            <ThumbsUp className="w-3 h-3" /> Forgive
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-red-700/80 border border-red-500 text-[11px] hover:bg-red-600 inline-flex items-center gap-1"
                            onClick={() => openFreeze(u.user_id)}
                          >
                            <Snowflake className="w-3 h-3" /> Freeze
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (tab === "sentinel") {
      return (
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Sentinel Flags</div>
              <div className="text-xs text-gray-400">Direct contract interactions / bypass attempts</div>
            </div>
            <div className="text-xs text-gray-400">{sentinel.length} flags</div>
          </div>

          {sentinel.length === 0 ? (
            <div className="text-xs text-gray-500">No sentinel flags returned by API.</div>
          ) : (
            <div className="overflow-auto border border-[#34316b] rounded-xl bg-[#221f54]">
              <table className="min-w-full text-xs text-gray-200">
                <thead className="bg-[#252264] sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">Tx</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">Wallet</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">Violation</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300 w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {sentinel.map((f) => (
                    <tr key={f.tx_hash} className="hover:bg-[#292567]">
                      <td className="px-3 py-2 font-mono text-[11px] text-gray-300 truncate max-w-[200px]">{f.tx_hash}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-gray-300 truncate max-w-[200px]">{f.wallet_address}</td>
                      <td className="px-3 py-2">{f.violation || f.flag_type}</td>
                      <td className="px-3 py-2">
                        <button
                          className="px-2 py-1 rounded bg-red-700/80 border border-red-500 text-[11px] hover:bg-red-600 inline-flex items-center gap-1"
                          onClick={() => openBanWallet(f.wallet_address)}
                        >
                          <Ban className="w-3 h-3" /> Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // audit
    return (
      <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold">Admin Audit Log</div>
            <div className="text-xs text-gray-400">Every sensitive admin action must be recorded</div>
          </div>
          <div className="text-xs text-gray-400">{audit.length} rows</div>
        </div>

        {audit.length === 0 ? (
          <div className="text-xs text-gray-500">No logs returned by API.</div>
        ) : (
          <div className="overflow-auto border border-[#34316b] rounded-xl bg-[#221f54]">
            <table className="min-w-full text-xs text-gray-200">
              <thead className="bg-[#252264] sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-300">Time</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-300">Admin</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-300">Action</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-300">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {audit.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#292567]">
                    <td className="px-3 py-2 font-mono text-[11px] text-gray-300">{row.timestamp || row.created_at || "—"}</td>
                    <td className="px-3 py-2">{row.admin_id || "—"}</td>
                    <td className="px-3 py-2">{row.action_type || row.action || "—"}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-gray-300 truncate max-w-[320px]">{JSON.stringify(row.meta || row.details || {})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }, [tab, sybils, sentinel, audit]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Security</h1>
            <p className="text-sm text-gray-400">Sybil controls, direct-contract interaction flags, and audit logs</p>
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-5 border-b border-gray-800">
        {[{ id: "sybil", label: "Sybil Hunter" }, { id: "sentinel", label: "Sentinel" }, { id: "audit", label: "Audit Log" }].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              tab === t.id ? "border-cyan-500 text-cyan-400" : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">{content}</div>

      <SafetyModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            await confirm?.action?.();
          } catch (e: any) {
            addToast({ description: e?.message || "Action failed", variant: "error" });
          }
        }}
        level={confirm?.level || "high-risk"}
        title={confirm?.title || "Confirm"}
        message={confirm?.message || ""}
        warningDetails={confirm?.level === "nuclear" ? "This action is irreversible. Ensure you understand the impact." : ""}
        verificationWord={confirm?.verificationWord}
        confirmText={confirm?.level === "nuclear" ? "CONFIRM" : "Confirm"}
      />
    </div>
  );
}
