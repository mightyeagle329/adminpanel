"use client";

import { useEffect, useState } from "react";
import { Bell, Megaphone, Link as LinkIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import SafetyModal from "@/components/SafetyModal";
import { fastApiClient } from "@/lib/fastApiClient";
import type { GlobalBanner } from "@/lib/types";

type BannerColor = "info_blue" | "warning_yellow" | "critical_red";

export default function CommunicationsPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"banner" | "broadcast" | "status">("banner");
  const [isLoading, setIsLoading] = useState(true);

  const [active, setActive] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [banner, setBanner] = useState<GlobalBanner>({
    message: "",
    color: "info_blue",
    action_link: "",
    enabled: true,
  });

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [segment, setSegment] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [aRaw, h] = await Promise.all([fastApiClient.getActiveBanner(), fastApiClient.getBannerHistory(50)]);
      const a: any = aRaw as any;
      setActive(a?.banner ?? null);
      setHistory(Array.isArray(h) ? h : []);
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to load communications data", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createBanner = async () => {
    try {
      if (!banner.message.trim()) {
        addToast({ description: "Banner message is required", variant: "warning" });
        return;
      }
      await fastApiClient.createGlobalBanner({
        message: banner.message,
        color: banner.color as BannerColor,
        action_link: banner.action_link || undefined,
        enabled: banner.enabled,
      });
      addToast({ description: "Banner created (FastAPI mock)", variant: "success" });
      setBanner((p) => ({ ...p, message: "", action_link: "" }));
      load();
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to create banner", variant: "error" });
    }
  };

  const sendBroadcast = async () => {
    try {
      if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
        addToast({ description: "Title and message are required", variant: "warning" });
        return;
      }
      await fastApiClient.broadcastNotification(broadcastTitle, broadcastMessage, segment);
      addToast({ description: "Broadcast sent (FastAPI mock)", variant: "success" });
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (e: any) {
      addToast({ description: e?.message || "Broadcast failed", variant: "error" });
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Live Ops & Communications</h1>
            <p className="text-sm text-gray-400">Global banners, broadcasts, and system status</p>
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
        {[{ id: "banner", label: "Global Banner" }, { id: "broadcast", label: "Broadcast" }, { id: "status", label: "System Status" }].map((t) => (
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
        {tab === "banner" && (
          <>
            <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
              <div>
                <div className="font-semibold">Create Banner</div>
                <div className="text-xs text-gray-400">Visible to all users in-app</div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Message</label>
                <input
                  value={banner.message}
                  onChange={(e) => setBanner((p) => ({ ...p, message: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  placeholder="e.g., Maintenance in 30 mins"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Color</label>
                  <select
                    value={banner.color}
                    onChange={(e) => setBanner((p) => ({ ...p, color: e.target.value as BannerColor }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="info_blue">Info (Blue)</option>
                    <option value="warning_yellow">Warning (Yellow)</option>
                    <option value="critical_red">Critical (Red)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Action link (optional)</label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                    <input
                      value={banner.action_link || ""}
                      onChange={(e) => setBanner((p) => ({ ...p, action_link: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={createBanner}
                className="px-4 py-2 rounded-lg bg-cyan-600 border border-cyan-500 text-sm font-semibold hover:bg-cyan-500"
              >
                Create Banner
              </button>
            </div>

            <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
              <div className="font-semibold">Active Banner</div>
              <div className="text-xs text-gray-400 mb-3">Current banner returned by API</div>
              {!active ? (
                <div className="text-xs text-gray-500">No active banner.</div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-sm font-semibold">{active.message}</div>
                  <div className="text-xs text-gray-400 mt-1">Color: {active.color}</div>
                </div>
              )}
            </div>

            <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
              <div className="font-semibold">Banner History</div>
              <div className="text-xs text-gray-400 mb-3">Most recent banners</div>
              {history.length === 0 ? (
                <div className="text-xs text-gray-500">No history returned by API.</div>
              ) : (
                <div className="space-y-2">
                  {history.map((b, idx) => (
                    <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="text-sm font-semibold">{b.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {b.color} · {b.created_at || "—"} · by {b.created_by || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === "broadcast" && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div>
              <div className="font-semibold">Broadcast Notification</div>
              <div className="text-xs text-gray-400">Send a push/in-app notification to a segment</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  placeholder="e.g., Market is LIVE"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Segment</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                >
                  <option value="all">All</option>
                  <option value="vip">VIP</option>
                  <option value="new_users">New Users</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Message</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm min-h-[120px]"
                placeholder="Write your message..."
              />
            </div>

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 border border-yellow-500 text-sm font-semibold hover:bg-yellow-500"
            >
              <Megaphone className="w-4 h-4" />
              Send Broadcast
            </button>
          </div>
        )}

        {tab === "status" && (
          <SystemStatusCard />
        )}
      </div>

      <SafetyModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={sendBroadcast}
        level="high-risk"
        title="Broadcast notification?"
        message="This will notify many users at once. Make sure the message is accurate."
        confirmText="SEND"
      />
    </div>
  );
}

function SystemStatusCard() {
  const { addToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fastApiClient.getSystemStatus();
      setData(res);
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to load status", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold">System Status</div>
          <div className="text-xs text-gray-400">High-level health from backend</div>
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

      {loading ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-400">Uptime</div>
            <div className="font-semibold">{data?.uptime_pct ?? "—"}%</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-400">Components</div>
            <pre className="text-[11px] text-gray-300 whitespace-pre-wrap">{JSON.stringify(data?.status || {}, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
