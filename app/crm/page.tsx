"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Clock, Search, ShieldAlert, Stethoscope, UserCog, XCircle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import SafetyModal from "@/components/SafetyModal";

/**
 * CRM (Customer Support)
 *
 * NOTE: Your backend endpoints for Ticket Detective / Time-Travel / Order Book Surgeon
 * are not in this repo yet, so this page is an operational UI shell.
 */

export default function CRMPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"ticket" | "god" | "timetravel" | "surgeon">("ticket");
  const [confirm, setConfirm] = useState<null | {
    level: "standard" | "high-risk";
    title: string;
    message: string;
    action: () => void;
  }>(null);

  const [ticketQuery, setTicketQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [xpAmount, setXpAmount] = useState(200);
  const [reason, setReason] = useState("");
  const [badgeId, setBadgeId] = useState("Early Adopter");
  const [freezeAmount, setFreezeAmount] = useState(1);

  const content = useMemo(() => {
    if (tab === "ticket") {
      return (
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
          <div>
            <div className="font-semibold">Ticket Detective</div>
            <div className="text-xs text-gray-400">Search by Ticket ID or User ID</div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                value={ticketQuery}
                onChange={(e) => setTicketQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                placeholder="ticket_123 or user_456"
              />
            </div>
            <button
              type="button"
              onClick={() => addToast({ description: "Backend ticket search API not connected yet.", variant: "info" })}
              className="px-4 py-2 rounded-lg bg-cyan-600 border border-cyan-500 text-sm font-semibold hover:bg-cyan-500"
            >
              Search
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-400">Inspector</div>
            <div className="text-xs text-gray-500 mt-1">
              This panel will display entry time vs lock time, fill details, and allow manual mark WON/VOID
              once backend APIs are provided.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirm({
                  level: "high-risk",
                  title: "Mark ticket as WON?",
                  message: "⚠️ This overrides normal resolution. Use only with clear evidence.",
                  action: () => addToast({ description: "Not connected: mark WON", variant: "warning" }),
                })}
                className="px-3 py-1.5 rounded-lg bg-emerald-700/80 border border-emerald-500 text-xs font-semibold hover:bg-emerald-600 inline-flex items-center gap-2"
              >
                <BadgeCheck className="w-4 h-4" /> Mark WON
              </button>
              <button
                type="button"
                onClick={() => setConfirm({
                  level: "high-risk",
                  title: "Void ticket?",
                  message: "⚠️ This refunds/voids outcomes. Use only if required.",
                  action: () => addToast({ description: "Not connected: void ticket", variant: "warning" }),
                })}
                className="px-3 py-1.5 rounded-lg bg-red-700/80 border border-red-500 text-xs font-semibold hover:bg-red-600 inline-flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Void
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "god") {
      return (
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
          <div>
            <div className="font-semibold">Gamification Editor (God Finger)</div>
            <div className="text-xs text-gray-400">Manually correct XP/Streak/Badges</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">User ID</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                placeholder="user_123"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Reason (required)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                placeholder="Customer support recovery..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
              <div className="text-xs text-gray-400">Grant XP</div>
              <input
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => setConfirm({
                  level: "high-risk",
                  title: "Grant XP?",
                  message: `Grant ${xpAmount} XP to ${userId || "(user)"}.`,
                  action: () => addToast({ description: "Not connected: grant XP", variant: "info" }),
                })}
                className="w-full px-3 py-2 rounded-lg bg-cyan-600 border border-cyan-500 text-xs font-semibold hover:bg-cyan-500 inline-flex items-center justify-center gap-2"
              >
                <UserCog className="w-4 h-4" /> Grant
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
              <div className="text-xs text-gray-400">Restore Streak</div>
              <button
                type="button"
                onClick={() => setConfirm({
                  level: "high-risk",
                  title: "Restore streak?",
                  message: `This will override the user's last trade date for ${userId || "(user)"}.`,
                  action: () => addToast({ description: "Not connected: restore streak", variant: "info" }),
                })}
                className="w-full px-3 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-xs font-semibold hover:bg-emerald-500 inline-flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" /> Restore
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
              <div className="text-xs text-gray-400">Issue Badge</div>
              <input
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => setConfirm({
                  level: "high-risk",
                  title: "Issue badge?",
                  message: `Issue “${badgeId}” to ${userId || "(user)"}.`,
                  action: () => addToast({ description: "Not connected: issue badge", variant: "info" }),
                })}
                className="w-full px-3 py-2 rounded-lg bg-purple-600 border border-purple-500 text-xs font-semibold hover:bg-purple-500 inline-flex items-center justify-center gap-2"
              >
                <BadgeCheck className="w-4 h-4" /> Issue
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-400">Grant Streak Freeze</div>
            <div className="mt-2 flex gap-2 items-center">
              <input
                type="number"
                value={freezeAmount}
                onChange={(e) => setFreezeAmount(Number(e.target.value))}
                className="w-32 px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => setConfirm({
                  level: "high-risk",
                  title: "Grant freeze?",
                  message: `Grant ${freezeAmount} Freeze(s) to ${userId || "(user)"}.`,
                  action: () => addToast({ description: "Not connected: grant freeze", variant: "info" }),
                })}
                className="px-3 py-2 rounded-lg bg-yellow-600 border border-yellow-500 text-xs font-semibold hover:bg-yellow-500"
              >
                Grant
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "timetravel") {
      return (
        <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
          <div>
            <div className="font-semibold">Time-Travel Inspector</div>
            <div className="text-xs text-gray-400">Reconstruct order book at a specific timestamp</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div>
                This requires a backend endpoint like:
                <div className="font-mono text-[11px] text-gray-300 mt-1">GET /admin/orderbook/snapshot?market_id=...&timestamp=...</div>
                Once provided, this page will render the reconstructed bids/asks.
              </div>
            </div>
          </div>
        </div>
      );
    }

    // surgeon
    return (
      <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <div className="font-semibold">Order Book Surgeon</div>
          <div className="text-xs text-gray-400">Cancel specific active limit orders</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-400">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              Backend endpoints needed:
              <div className="font-mono text-[11px] text-gray-300 mt-1">GET /admin/orders?market_id=...</div>
              <div className="font-mono text-[11px] text-gray-300">POST /admin/orders/{"{order_id}"}/cancel</div>
              This UI will then show an order table with a per-row cancel button.
            </div>
          </div>
        </div>
      </div>
    );
  }, [tab, ticketQuery, userId, xpAmount, reason, badgeId, freezeAmount, addToast]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Support (CRM)</h1>
          <p className="text-sm text-gray-400">Tickets, disputes, and manual user/account corrections</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 border-b border-gray-800">
        {[{ id: "ticket", label: "Ticket Detective" }, { id: "god", label: "God Finger" }, { id: "timetravel", label: "Time-Travel" }, { id: "surgeon", label: "Order Surgeon" }].map((t) => (
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
        onConfirm={() => {
          confirm?.action();
        }}
        level={confirm?.level || "standard"}
        title={confirm?.title || "Confirm"}
        message={confirm?.message || ""}
        confirmText="Confirm"
      />
    </div>
  );
}
