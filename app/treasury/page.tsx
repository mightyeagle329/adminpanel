"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, DollarSign, Flame, RefreshCw, ShieldAlert } from "lucide-react";
import { fastApiClient } from "@/lib/fastApiClient";
import { useToast } from "@/components/ToastProvider";
import SafetyModal from "@/components/SafetyModal";
import type { VaultComposition } from "@/lib/types";

type FeeConfig = { platform_fee_rate: number; min_bet_size: number };
type RiskConfig = { max_exposure_per_event_pct: number; global_tvl_cap: number; risk_mode: string };

function formatMoney(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function TreasuryPage() {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [composition, setComposition] = useState<VaultComposition | null>(null);
  const [exposure, setExposure] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [correlation, setCorrelation] = useState<any>(null);
  const [fees, setFees] = useState<FeeConfig | null>(null);
  const [risk, setRisk] = useState<RiskConfig | null>(null);

  const [killSwitchOpen, setKillSwitchOpen] = useState(false);
  const [rebalanceOpen, setRebalanceOpen] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [c, e, h, cm, f, r] = await Promise.all([
        fastApiClient.getVaultComposition(),
        fastApiClient.getCurrentExposure(),
        fastApiClient.getLiabilityHeatmap(),
        fastApiClient.getCorrelationMatrix(),
        fastApiClient.getFeeConfig(),
        fastApiClient.getRiskConfig(),
      ]);
      setComposition(c);
      setExposure(e);
      setHeatmap(h);
      setCorrelation(cm);
      setFees(f as FeeConfig);
      setRisk(r as RiskConfig);
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to load treasury data", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const utilization = useMemo(() => {
    const pct = exposure?.utilization_pct;
    return typeof pct === "number" ? pct : null;
  }, [exposure]);

  const saveFees = async () => {
    if (!fees) return;
    try {
      await fastApiClient.updateFeeConfig(fees);
      addToast({ description: "Fee configuration updated (FastAPI mock).", variant: "success" });
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to update fees", variant: "error" });
    }
  };

  const saveRisk = async () => {
    if (!risk) return;
    try {
      await fastApiClient.updateRiskConfig(risk);
      addToast({ description: "Risk configuration updated (FastAPI mock).", variant: "success" });
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to update risk config", variant: "error" });
    }
  };

  const blockCorrelation = async (outcomeA: string, outcomeB: string) => {
    try {
      await fastApiClient.blockCorrelation(outcomeA, outcomeB);
      addToast({ description: `Blocked combination: ${outcomeA} + ${outcomeB}`, variant: "success" });
      load();
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to block correlation", variant: "error" });
    }
  };

  const doKillSwitch = async () => {
    try {
      await fastApiClient.activateKillSwitch();
      addToast({ description: "GLOBAL TRADING PAUSED (FastAPI mock).", variant: "warning" });
    } catch (e: any) {
      addToast({ description: e?.message || "Kill switch failed", variant: "error" });
    }
  };

  const doRebalance = async () => {
    try {
      await fastApiClient.triggerRebalance();
      addToast({ description: "Rebalance triggered (FastAPI mock).", variant: "success" });
    } catch (e: any) {
      addToast({ description: e?.message || "Rebalance failed", variant: "error" });
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Treasury & Risk</h1>
            <p className="text-sm text-gray-400">Vault overview, exposure controls, global fees, and emergency actions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setRebalanceOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 border border-blue-500 text-sm font-semibold hover:bg-blue-500"
          >
            <Flame className="w-4 h-4" />
            Trigger Rebalance
          </button>

          <button
            type="button"
            onClick={() => setKillSwitchOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 border border-red-500 text-sm font-semibold hover:bg-red-500"
          >
            <ShieldAlert className="w-4 h-4" />
            Kill Switch
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {/* Vault composition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
            <div className="text-xs text-gray-400">Total Value Locked</div>
            <div className="text-3xl font-bold text-emerald-400">
              {composition ? `$${formatMoney(composition.total_value_locked)}` : "—"}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Breakdown (mock until backend is connected).</div>
          </div>
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
            <div className="text-xs text-gray-400">Pocket A · CLOB Liquidity</div>
            <div className="text-2xl font-bold">{composition ? `$${formatMoney(composition.pocket_a_clob)}` : "—"}</div>
            <div className="text-xs text-gray-500 mt-1">Funds active in limit orders.</div>
          </div>
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
            <div className="text-xs text-gray-400">Pocket B · House Fund</div>
            <div className="text-2xl font-bold">{composition ? `$${formatMoney(composition.pocket_b_house)}` : "—"}</div>
            <div className="text-xs text-gray-500 mt-1">Funds backing streak/parlay positions.</div>
          </div>
        </div>

        {/* Exposure */}
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Exposure</div>
              <div className="text-xs text-gray-400">Current vault utilization</div>
            </div>
            {utilization != null && (
              <div className={`text-sm font-semibold ${utilization >= 90 ? "text-red-400" : utilization >= 75 ? "text-yellow-300" : "text-emerald-300"}`}>
                {utilization.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-400">Total exposure</div>
              <div className="text-xl font-bold">{exposure ? `$${formatMoney(exposure.total_exposure)}` : "—"}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-400">Max exposure</div>
              <div className="text-xl font-bold">{exposure ? `$${formatMoney(exposure.max_exposure)}` : "—"}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-400">Utilization</div>
              <div className="text-xl font-bold">{utilization != null ? `${utilization.toFixed(1)}%` : "—"}</div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
          <div className="font-semibold">Global Liability Heatmap</div>
          <div className="text-xs text-gray-400">Worst-case exposure simulation (mock until backend is connected)</div>

          <div className="mt-4 space-y-2">
            {(heatmap?.heatmap || []).length === 0 ? (
              <div className="text-xs text-gray-500">No heatmap data (yet).</div>
            ) : (
              (heatmap.heatmap as any[]).map((row, idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{row.event}</div>
                    <div className={`text-xs font-semibold ${row.risk_level === "CRITICAL" ? "text-red-400" : "text-yellow-300"}`}>{row.risk_level}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Correlated: {(row.correlated_events || []).join(", ")}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Potential payout: ${formatMoney(row.potential_payout)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Correlation matrix */}
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Correlation Matrix (Parlay Blocker)</div>
              <div className="text-xs text-gray-400">Block outcome combinations (mock)</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              id="corrA"
              placeholder="Outcome A"
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
            />
            <input
              id="corrB"
              placeholder="Outcome B"
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const a = (document.getElementById("corrA") as HTMLInputElement | null)?.value?.trim();
                const b = (document.getElementById("corrB") as HTMLInputElement | null)?.value?.trim();
                if (!a || !b) {
                  addToast({ description: "Enter Outcome A and Outcome B", variant: "warning" });
                  return;
                }
                blockCorrelation(a, b);
              }}
              className="px-4 py-2 rounded-lg bg-cyan-600 border border-cyan-500 text-sm font-semibold hover:bg-cyan-500"
            >
              Block Combination
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {(correlation?.blocked_combinations || []).length === 0 ? (
              <div className="text-xs text-gray-500">No blocked combinations.</div>
            ) : (
              (correlation.blocked_combinations as any[]).map((c, idx) => (
                <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm">
                  <div className="font-semibold">
                    {c.outcome_a} + {c.outcome_b}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Reason: {c.reason || "—"}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fees + Risk config */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div>
              <div className="font-semibold">Financial Configuration (Global Fees)</div>
              <div className="text-xs text-gray-400">Platform fee rate and minimum bet size</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Platform fee rate (%)</label>
                <input
                  type="number"
                  value={fees?.platform_fee_rate ?? ""}
                  onChange={(e) => setFees((p) => ({ ...(p || { platform_fee_rate: 1.5, min_bet_size: 5 }), platform_fee_rate: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Min bet size ($)</label>
                <input
                  type="number"
                  value={fees?.min_bet_size ?? ""}
                  onChange={(e) => setFees((p) => ({ ...(p || { platform_fee_rate: 1.5, min_bet_size: 5 }), min_bet_size: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={saveFees}
              className="px-4 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-sm font-semibold hover:bg-emerald-500"
            >
              Save Fee Config
            </button>
          </div>

          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div>
              <div className="font-semibold">Vault Risk Matrix Configuration</div>
              <div className="text-xs text-gray-400">Controls max exposure per event (2FA will be added later)</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Risk mode</label>
                <select
                  value={risk?.risk_mode ?? "AUTO"}
                  onChange={(e) => setRisk((p) => ({ ...(p || { max_exposure_per_event_pct: 10, global_tvl_cap: 10000000, risk_mode: "AUTO" }), risk_mode: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                >
                  <option value="AUTO">AUTO (Dynamic)</option>
                  <option value="MANUAL">MANUAL (Fixed)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Max exposure per event (%)</label>
                <input
                  type="number"
                  value={risk?.max_exposure_per_event_pct ?? ""}
                  onChange={(e) => setRisk((p) => ({ ...(p || { max_exposure_per_event_pct: 10, global_tvl_cap: 10000000, risk_mode: "AUTO" }), max_exposure_per_event_pct: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Global TVL cap ($)</label>
                <input
                  type="number"
                  value={risk?.global_tvl_cap ?? ""}
                  onChange={(e) => setRisk((p) => ({ ...(p || { max_exposure_per_event_pct: 10, global_tvl_cap: 10000000, risk_mode: "AUTO" }), global_tvl_cap: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={saveRisk}
              className="px-4 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-sm font-semibold hover:bg-emerald-500"
            >
              Update Risk Params
            </button>
            <div className="text-[11px] text-gray-500 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
              2FA requirement is not implemented in this repo yet.
            </div>
          </div>
        </div>
      </div>

      <SafetyModal
        isOpen={killSwitchOpen}
        onClose={() => setKillSwitchOpen(false)}
        onConfirm={doKillSwitch}
        level="nuclear"
        title="🚨 DANGER ZONE: Pause the entire exchange"
        message="You are about to PAUSE GLOBAL TRADING. This stops matching and betting immediately. Withdrawals remain active."
        warningDetails="This is a nuclear action. Only use during active incidents."
        verificationWord="PAUSE"
        confirmText="PAUSE SYSTEM"
      />

      <SafetyModal
        isOpen={rebalanceOpen}
        onClose={() => setRebalanceOpen(false)}
        onConfirm={doRebalance}
        level="high-risk"
        title="Trigger emergency rebalance?"
        message="This forces funds transfer between Pocket A (CLOB) and Pocket B (House Fund)."
        warningDetails="Make sure this action is necessary; it may impact liquidity." 
        confirmText="TRIGGER REBALANCE"
      />
    </div>
  );
}
