"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Image as ImageIcon, Link as LinkIcon, Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import SafetyModal from "@/components/SafetyModal";
import { fastApiClient } from "@/lib/fastApiClient";
import type { MarketBadge, MarketCategory, XPPromoTag } from "@/lib/types";

type WizardStep = 1 | 2 | 3 | 4 | 5;

const BADGES: MarketBadge[] = [
  "NONE",
  "🔥 HOT",
  "💎 GEM",
  "🚨 BREAKING",
  "🐳 WHALE",
  "🔥 VIRAL",
  "⚖️ VERDICT",
  "⚔️ RIVALRY",
  "⚡ FLASH",
  "🏆 FINAL",
];

const CATEGORIES: MarketCategory[] = ["SPORTS", "CRYPTO", "HYPE", "FINANCE", "GLOBAL"];
const XP_TAGS: XPPromoTag[] = ["NONE", "✨ 2x XP EVENT"];

function isoNowPlusMinutes(mins: number) {
  return new Date(Date.now() + mins * 60 * 1000).toISOString().slice(0, 16);
}

export default function MarketWizardPage() {
  const { addToast } = useToast();
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MarketCategory>("CRYPTO");
  const [subTag, setSubTag] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");

  // Step 2
  const [badge, setBadge] = useState<MarketBadge>("NONE");
  const [xpPromoTag, setXpPromoTag] = useState<XPPromoTag>("NONE");
  const [batchId, setBatchId] = useState("");

  // Step 3
  const [outcomeALabel, setOutcomeALabel] = useState("YES");
  const [outcomeAIconUrl, setOutcomeAIconUrl] = useState("");
  const [outcomeBLabel, setOutcomeBLabel] = useState("NO");
  const [outcomeBIconUrl, setOutcomeBIconUrl] = useState("");

  // Step 4
  const [startTime, setStartTime] = useState(isoNowPlusMinutes(5));
  const [lockTime, setLockTime] = useState(isoNowPlusMinutes(65));
  const [resolutionTime, setResolutionTime] = useState(isoNowPlusMinutes(125));

  // Step 5
  const [oracleUrl, setOracleUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canGoNext = useMemo(() => {
    if (step === 1) return title.trim().length >= 10 && !!category;
    if (step === 2) return true;
    if (step === 3) return outcomeALabel.trim().length > 0 && outcomeBLabel.trim().length > 0;
    if (step === 4) return !!startTime && !!lockTime && !!resolutionTime;
    if (step === 5) return oracleUrl.trim().length > 0;
    return false;
  }, [step, title, category, outcomeALabel, outcomeBLabel, startTime, lockTime, resolutionTime, oracleUrl]);

  const next = () => setStep((s) => (Math.min(5, s + 1) as WizardStep));
  const prev = () => setStep((s) => (Math.max(1, s - 1) as WizardStep));

  const submit = async () => {
    setIsSubmitting(true);
    try {
      // NOTE: This will hit FastAPI (currently mock). When you provide real backend,
      // we will swap the client and payload as needed.
      const payload = {
        title,
        category,
        sub_tag: subTag || undefined,
        banner_image_url: bannerImageUrl || undefined,
        badge,
        xp_promo_tag: xpPromoTag,
        outcome_a: { label: outcomeALabel, icon_url: outcomeAIconUrl || undefined },
        outcome_b: { label: outcomeBLabel, icon_url: outcomeBIconUrl || undefined },
        start_time: new Date(startTime).toISOString(),
        lock_time: new Date(lockTime).toISOString(),
        resolution_time: new Date(resolutionTime).toISOString(),
        oracle_source_url: oracleUrl,
        batch_id: batchId || undefined,
      };

      await fastApiClient.createMarket(payload);
      addToast({ description: "Market created (draft). Backend integration can be swapped later.", variant: "success" });
      setStep(1);
      setTitle("");
      setSubTag("");
      setBannerImageUrl("");
      setBadge("NONE");
      setXpPromoTag("NONE");
      setBatchId("");
      setOutcomeALabel("YES");
      setOutcomeBLabel("NO");
      setOutcomeAIconUrl("");
      setOutcomeBIconUrl("");
      setOracleUrl("");
    } catch (e: any) {
      addToast({ description: e?.message || "Failed to create market", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
            <Wand2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Market Maker Wizard</h1>
            <p className="text-sm text-gray-400">Create a new market with title, outcomes, timing, and a proof source</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">Step {step}/5</div>
      </div>

      {/* Stepper */}
      <div className="flex gap-2 mb-5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s as WizardStep)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              step === s
                ? "bg-cyan-600 border-cyan-500 text-white"
                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {step === 1 && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold">Step 1 · Content & Visuals</h2>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Market title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g., "Bitcoin to hit $100k by Q4?"'
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
              />
              <p className="text-[11px] text-gray-500 mt-1">Minimum 10 characters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MarketCategory)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Content chip (Sub-tag)</label>
                <input
                  value={subTag}
                  onChange={(e) => setSubTag(e.target.value)}
                  placeholder="e.g., Memes / UFC / Macro"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Banner image URL</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <ImageIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Upload/compression will be added when backend APIs are provided.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold">Step 2 · Marketing Badges</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Badge</label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value as MarketBadge)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                >
                  {BADGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">XP Promo Tag</label>
                <select
                  value={xpPromoTag}
                  onChange={(e) => setXpPromoTag(e.target.value as XPPromoTag)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                >
                  {XP_TAGS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Batch ID (risk tags CSV)</label>
              <input
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g., BTC_PREDICT_20260228, BTC_DIRECTIONAL"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">Allowlist validation will be enforced once backend is integrated.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold">Step 3 · Dynamic Outcomes</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="text-xs text-gray-400">Outcome A</div>
                <input
                  value={outcomeALabel}
                  onChange={(e) => setOutcomeALabel(e.target.value)}
                  placeholder="YES"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm"
                />
                <input
                  value={outcomeAIconUrl}
                  onChange={(e) => setOutcomeAIconUrl(e.target.value)}
                  placeholder="Icon URL (optional)"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm"
                />
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="text-xs text-gray-400">Outcome B</div>
                <input
                  value={outcomeBLabel}
                  onChange={(e) => setOutcomeBLabel(e.target.value)}
                  placeholder="NO"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm"
                />
                <input
                  value={outcomeBIconUrl}
                  onChange={(e) => setOutcomeBIconUrl(e.target.value)}
                  placeholder="Icon URL (optional)"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold">Step 4 · Lifecycle Timing</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Start time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Lock time</label>
                <input
                  type="datetime-local"
                  value={lockTime}
                  onChange={(e) => setLockTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Resolution time</label>
                <input
                  type="datetime-local"
                  value={resolutionTime}
                  onChange={(e) => setResolutionTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500">
              All times should be treated as UTC on the backend. This UI uses your browser timezone.
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="bg-[#252350] border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold">Step 5 · Oracle (Proof Source)</h2>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Source link (URL)</label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  value={oracleUrl}
                  onChange={(e) => setOracleUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Required. Every market must have an external source of truth.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Preview</div>
                  <div className="text-xs text-gray-400 mt-1">
                    <div className="mb-1">{title || "(title)"}</div>
                    <div>
                      {outcomeALabel || "A"} vs {outcomeBLabel || "B"} · {badge} · {xpPromoTag}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500 font-mono break-all">{oracleUrl || "(oracle url)"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="pt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canGoNext}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 border border-cyan-500 text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!canGoNext || isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Market
            </button>
          )}
        </div>
      </div>

      <SafetyModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        level="standard"
        title="Create market draft?"
        message="This will create a new market in DRAFT mode. You can publish later once backend integration is connected."
        confirmText={isSubmitting ? "Creating..." : "Confirm"}
      />
    </div>
  );
}
