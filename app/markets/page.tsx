'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { useAuthSession } from '@/components/AuthSessionProvider';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Coins } from 'lucide-react';

type MarketStatus = 'Pending' | 'Open' | 'Locked' | 'Settling' | 'Resolved' | 'Void';

type Market = {
  market_id: string;
  metadata: { title?: string };
  yes_mint_address: string | null;
  no_mint_address: string | null;
  status: MarketStatus | string;
  outcome_a_label?: string;
  outcome_b_label?: string;
};

type PendingMarket = {
  market_id: string;
  metadata: { title?: string };
  status: MarketStatus | string;
  outcome_a_label?: string;
  outcome_b_label?: string;
};

// Tabs shown in the filter bar
const STATUS_OPTIONS: MarketStatus[] = ['Pending', 'Open', 'Locked', 'Settling', 'Resolved', 'Void'];

// Statuses that can be chosen in the dropdown (never allow going back to Pending/Open)
const CHANGEABLE_STATUSES: MarketStatus[] = ['Locked', 'Settling', 'Resolved', 'Void'];

// Map new status → endpoint
const STATUS_ENDPOINT: Partial<Record<MarketStatus, string>> = {
  Locked: '/v1/admin/market/lock',
  Settling: '/v1/admin/market/freeze',
  Void: '/v1/admin/market/void',
  // Resolved: TODO — endpoint not yet available
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://62.171.153.189:8080';

type PendingChange = {
  market_id: string;
  title: string;
  fromStatus: string;
  toStatus: MarketStatus;
};

export default function MarketsPage() {
  const { addToast } = useToast();
  const { session } = useAuthSession();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<MarketStatus>('Pending');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingMarkets, setPendingMarkets] = useState<PendingMarket[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);

  // Confirm modal state
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchMarkets();
  }, [status, page, limit, mounted]);

  const fetchMarkets = async () => {
    setIsLoading(true);
    if (status === 'Pending') setIsPendingLoading(true);

    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({ status, limit: String(limit), offset: String(offset) });
      const url = `${API_BASE.replace(/\/$/, '')}/v1/markets?${params.toString()}`;

      const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => null);

      console.log('Markets response', { url, httpStatus: res.status, data });

      const rawList: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.markets)
        ? data.markets
        : [];
      const nextTotal: number = typeof data?.total === 'number' ? data.total : rawList.length;

      if (status === 'Pending') {
        setPendingMarkets(rawList as PendingMarket[]);
      } else {
        setMarkets(rawList as Market[]);
      }
      setTotal(nextTotal);

      if (!res.ok) {
        addToast({ description: `Request failed (${res.status})`, variant: 'error' });
      }
    } catch (e: any) {
      addToast({ description: e?.message || 'Error fetching markets', variant: 'error' });
    } finally {
      setIsLoading(false);
      setIsPendingLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Called when user picks a new status from the dropdown — opens confirm modal
  const handleStatusChange = (market: Market, toStatus: MarketStatus) => {
    setPendingChange({
      market_id: market.market_id,
      title: market.metadata?.title || market.market_id,
      fromStatus: String(market.status),
      toStatus,
    });
  };

  // Send the actual status-change request
  const handleConfirmSend = async () => {
    if (!pendingChange) return;
    if (!session?.access_token) {
      addToast({ description: 'You must be signed in to update a market.', variant: 'error' });
      return;
    }

    const endpoint = STATUS_ENDPOINT[pendingChange.toStatus];
    if (!endpoint) {
      // Resolved — no endpoint yet
      console.log('[markets] Resolved endpoint not yet available. Payload:', pendingChange);
      addToast({ description: 'Resolved endpoint not yet implemented.', variant: 'warning' });
      setPendingChange(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = `${API_BASE.replace(/\/$/, '')}${endpoint}`;
      const body = JSON.stringify({ market_id: pendingChange.market_id });
      console.log('[markets] POST', url, body);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body,
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        // Update the market's status in the local list
        setMarkets(prev =>
          prev.map(m =>
            m.market_id === pendingChange.market_id
              ? { ...m, status: pendingChange.toStatus }
              : m
          )
        );
        addToast({ description: `Market updated to ${pendingChange.toStatus}`, variant: 'success' });
        setPendingChange(null);
      } else {
        const msg = data?.error || data?.message || data?.detail || `Request failed (${res.status})`;
        addToast({ description: msg, variant: 'error' });
      }
    } catch (e: any) {
      addToast({ description: e?.message || 'Network error', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateTokens = async (marketId: string) => {
    if (!session?.access_token) {
      addToast({ description: 'You must be signed in to generate tokens.', variant: 'error' });
      return;
    }

    setGeneratingIds(prev => new Set(prev).add(marketId));
    try {
      const url = `${API_BASE.replace(/\/$/, '')}/v1/admin/market/create-tokens`;
      const body = JSON.stringify({ market_id: marketId });
      console.log('[markets] POST', url, body);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body,
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setPendingMarkets(prev => prev.filter(m => m.market_id !== marketId));
        addToast({ description: `Tokens generated for market ${marketId}`, variant: 'success' });
      } else {
        const msg = data?.error || data?.message || data?.detail || `Request failed (${res.status})`;
        addToast({ description: `Generate failed: ${msg}`, variant: 'error' });
      }
    } catch (e: any) {
      addToast({ description: `Generate failed: ${e?.message || 'Network error'}`, variant: 'error' });
    } finally {
      setGeneratingIds(prev => { const s = new Set(prev); s.delete(marketId); return s; });
    }
  };

  if (!mounted) return null;

  return (
    <>
      <div className="w-full h-full flex flex-col overflow-hidden text-white">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Markets</h1>
              <p className="text-xs text-gray-400">View and manage markets by status</p>
            </div>
            <button
              type="button"
              onClick={fetchMarkets}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/60 bg-cyan-600/90 text-white text-xs font-medium shadow-sm hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Status filter tabs */}
          <div className="bg-[#252350] rounded-lg border border-gray-800 p-3 flex flex-wrap gap-2 items-center">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  status === s
                    ? 'bg-cyan-600 text-white border-cyan-500'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Table card */}
          <div className="bg-[#252350] rounded-lg border border-gray-800 p-4 space-y-3 flex-1 flex flex-col min-h-0">
            {/* Pagination controls */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>
                Status: <span className="text-white font-medium">{status}</span>
                {' '}· Page: <span className="text-white font-medium">{page}</span> /{' '}
                <span className="text-white font-medium">{totalPages}</span>
                {' '}· Limit: {limit} · Total: {total}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 mr-3">
                  <span className="text-gray-500">Show:</span>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-[11px] text-gray-100"
                  >
                    {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full bg-gray-800 text-gray-200 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoading || page >= totalPages}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full bg-gray-800 text-gray-200 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Pending tab */}
            {status === 'Pending' ? (
              isPendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : pendingMarkets.length === 0 ? (
                <div className="text-xs text-gray-400 py-4 text-center">No pending markets found.</div>
              ) : (
                <div className="h-[500px] overflow-y-auto border border-[#34316b] rounded-xl bg-[#221f54]">
                  <table className="min-w-full text-xs text-gray-200">
                    <thead className="bg-[#252264] sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-300">Title</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-300 w-28">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-300 w-36">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {pendingMarkets.map((m) => {
                        const isGenerating = generatingIds.has(m.market_id);
                        return (
                          <tr key={m.market_id} className="hover:bg-[#292567]">
                            <td className="px-3 py-2 align-middle">
                              <div className="text-gray-100 text-xs leading-snug line-clamp-2">
                                {m.metadata?.title || m.market_id}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-500/60 text-[11px] text-amber-300 font-medium">
                                {m.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <button
                                type="button"
                                onClick={() => handleGenerateTokens(m.market_id)}
                                disabled={isGenerating}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-700 border border-violet-500 text-white text-[11px] font-medium hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                              >
                                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                                <span>{isGenerating ? 'Generating…' : 'Generate'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : markets.length === 0 ? (
              <div className="text-xs text-gray-400 py-4 text-center">No markets found for this status.</div>
            ) : (
              <div className="h-[500px] overflow-y-auto border border-[#34316b] rounded-xl bg-[#221f54]">
                <table className="min-w-full text-xs text-gray-200">
                  <thead className="bg-[#252264] sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-300">Title</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-300 w-32">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-300 w-40">Yes Mint</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-300 w-40">No Mint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {markets.map((m) => {
                      // Available options: changeable statuses minus the market's current status
                      const options = CHANGEABLE_STATUSES.filter(
                        s => s.toLowerCase() !== String(m.status).toLowerCase()
                      );
                      return (
                        <tr key={m.market_id} className="hover:bg-[#292567]">
                          <td className="px-3 py-2 align-top">
                            <div className="text-gray-100 text-xs leading-snug line-clamp-2">
                              {m.metadata?.title || m.market_id}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) handleStatusChange(m, e.target.value as MarketStatus);
                              }}
                              className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-[11px] text-gray-100 cursor-pointer"
                            >
                              <option value="" disabled>{String(m.status)}</option>
                              {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-500/60 text-[11px] text-emerald-200 font-mono truncate max-w-[140px]">
                              {m.yes_mint_address ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-900/40 border border-red-500/60 text-[11px] text-red-200 font-mono truncate max-w-[140px]">
                              {m.no_mint_address ?? '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {pendingChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-white">Confirm status change</h2>
            <div className="text-xs text-gray-300 leading-relaxed space-y-1">
              <p className="line-clamp-2 text-white font-medium">{pendingChange.title}</p>
              <p>
                <span className="text-gray-400">From: </span>
                <span className="text-amber-300">{pendingChange.fromStatus}</span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="text-cyan-300">{pendingChange.toStatus}</span>
              </p>
              {!STATUS_ENDPOINT[pendingChange.toStatus] && (
                <p className="text-yellow-400 text-[11px] mt-1">
                  ⚠️ No API endpoint available for <strong>Resolved</strong> yet.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => { if (!isSubmitting) setPendingChange(null); }}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-60"
              >
                No, cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-full bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 disabled:opacity-60 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                {isSubmitting ? 'Sending…' : 'Yes, update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
