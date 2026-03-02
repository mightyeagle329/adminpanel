"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import SafetyModal from "@/components/SafetyModal";
import { fastApiClient } from "@/lib/fastApiClient";

type CompetitionType = "RECURRING_WEEKLY" | "ONE_TIME";

export default function CompetitionsPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"create" | "economy" | "alliance" | "ops">("create");
  const [loading, setLoading] = useState(true);

  const [competition, setCompetition] = useState({
    title: "",
    prize_text: "",
    prize_image_url: "",
    type: "RECURRING_WEEKLY" as CompetitionType,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  });

  const [economy, setEconomy] = useState<any>(null);
  const [alliance, setAlliance] = useState<any>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetCompetitionId, setResetCompetitionId] = useState("comp_123");

  const load = async () => {
    setLoading(true);
    try {
      const [e, a] = await Promise.all([fastApiClient.getEconomyConfig(), fastApiClient.getAllianceConfig()]);
      setEconomy(e);
      setAlliance(a);
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to load competition configs", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      if (competition.title.trim().length < 5) {
        addToast({ description: "Title must be at least 5 characters", variant: "warning" });
        return;
      }
      await fastApiClient.createCompetition({
        ...competition,
        start_date: new Date(competition.start_date).toISOString(),
        end_date: new Date(competition.end_date).toISOString(),
      });
      addToast({ description: "Competition created (FastAPI mock)", variant: "success" });
      setCompetition((p) => ({ ...p, title: "", prize_text: "", prize_image_url: "" }));
    } catch (e: any) {
      addToast({ description: e?.message || "Create failed", variant: "error" });
    }
  };

  const saveEconomy = async () => {
    try {
      await fastApiClient.updateEconomyConfig(economy);
      addToast({ description: "Economy config updated (FastAPI mock)", variant: "success" });
    } catch (e: any) {
      addToast({ description: e?.message || "Update failed", variant: "error" });
    }
  };

  const saveAlliance = async () => {
    try {
      await fastApiClient.updateAllianceConfig(alliance);
      addToast({ description: "Alliance config updated (FastAPI mock)", variant: "success" });
    } catch (e: any) {
      addToast({ description: e?.message || "Update failed", variant: "error" });
    }
  };

  const doReset = async () => {
    try {
      await fastApiClient.resetLeaderboard(resetCompetitionId);
      addToast({ description: "Leaderboard reset triggered (FastAPI mock)", variant: "warning" });
    } catch (e: any) {
      addToast({ description: e?.message || "Reset failed", variant: "error" });
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-fuchsia-600 to-violet-600 flex items-center justify-center">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Competitions (SRS)</h1>
            <p className="text-sm text-gray-400">Create competitions, tune XP economy, and manage referrals</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-5 border-b border-gray-800">
        {[{ id: "create", label: "Create" }, { id: "economy", label: "Economy" }, { id: "alliance", label: "Alliance" }, { id: "ops", label: "Operations" }].map((t) => (
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

      <div className="flex-1 overflow-auto space-y-6">
        {tab === "create" && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="font-semibold">Create Competition</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  value={competition.title}
                  onChange={(e) => setCompetition((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  placeholder="Super Bowl Special"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select
                  value={competition.type}
                  onChange={(e) => setCompetition((p) => ({ ...p, type: e.target.value as CompetitionType }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                >
                  <option value="RECURRING_WEEKLY">Recurring Weekly</option>
                  <option value="ONE_TIME">One-Time</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Prize text</label>
                <input
                  value={competition.prize_text}
                  onChange={(e) => setCompetition((p) => ({ ...p, prize_text: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  placeholder="10,000 USDC + VIP Tickets"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Prize image URL (optional)</label>
                <input
                  value={competition.prize_image_url}
                  onChange={(e) => setCompetition((p) => ({ ...p, prize_image_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Start date</label>
                <input
                  type="datetime-local"
                  value={competition.start_date}
                  onChange={(e) => setCompetition((p) => ({ ...p, start_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">End date</label>
                <input
                  type="datetime-local"
                  value={competition.end_date}
                  onChange={(e) => setCompetition((p) => ({ ...p, end_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={create}
              className="px-4 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-sm font-semibold hover:bg-emerald-500"
            >
              Create
            </button>
          </div>
        )}

        {tab === "economy" && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="font-semibold">Economy Tuning</div>
            <div className="text-xs text-gray-400">Adjust SRS parameters (mock)</div>

            {!economy ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    ["base_trade_xp", "Base Trade XP"],
                    ["volume_ratio", "Volume Ratio"],
                    ["relief_multiplier", "Relief Multiplier"],
                    ["xp_inflation_cap_multiplier", "XP Inflation Cap"],
                    ["streak_freeze_cost", "Streak Freeze Cost"],
                    ["god_mode_multiplier", "God Mode Multiplier"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1">{label}</label>
                      <input
                        type="number"
                        value={economy[key] ?? ""}
                        onChange={(e) => setEconomy((p: any) => ({ ...p, [key]: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={saveEconomy}
                  className="px-4 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-sm font-semibold hover:bg-emerald-500"
                >
                  Save Economy Config
                </button>
              </>
            )}
          </div>
        )}

        {tab === "alliance" && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="font-semibold">Alliance Operations</div>
            <div className="text-xs text-gray-400">Referral boosts & tree viewer (tree UI later)</div>

            {!alliance ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Global boost multiplier</label>
                  <input
                    type="number"
                    value={alliance.global_boost_multiplier ?? ""}
                    onChange={(e) => setAlliance((p: any) => ({ ...p, global_boost_multiplier: Number(e.target.value) }))}
                    className="w-full max-w-sm px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveAlliance}
                  className="px-4 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-sm font-semibold hover:bg-emerald-500"
                >
                  Save Alliance Config
                </button>

                <div className="mt-4 text-xs text-gray-500">
                  Referral tree viewer will be added once backend provides tree nodes with children.
                </div>
              </>
            )}
          </div>
        )}

        {tab === "ops" && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="font-semibold">Operations</div>
            <div className="text-xs text-gray-400">Force reset weekly leaderboard</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Competition ID</label>
                <input
                  value={resetCompetitionId}
                  onChange={(e) => setResetCompetitionId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono"
                  placeholder="comp_123"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setResetConfirm(true)}
                  className="px-4 py-2 rounded-lg bg-red-600 border border-red-500 text-sm font-semibold hover:bg-red-500"
                >
                  Reset Leaderboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <SafetyModal
        isOpen={resetConfirm}
        onClose={() => setResetConfirm(false)}
        onConfirm={doReset}
        level="high-risk"
        title="Reset leaderboard?"
        message="⚠️ WARNING: This action cannot be undone. You are about to reset the weekly leaderboard."
        confirmText="RESET"
      />
    </div>
  );
}
