'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

type MarketStatus = 'OPEN' | 'LOCKED' | 'SETTLING' | 'RESOLVED' | 'VOID';

type Market = {
  market_id: string;
  title: string;
  yes_account: string;
  no_account: string;
  status: MarketStatus | string;
};

type UpdatedMarketChange = {
  market_id: string;
  title: string;
  yes_account: string;
  no_account: string;
  previous_status: string;
  updated_status: MarketStatus;
};

const STATUS_OPTIONS: MarketStatus[] = ['OPEN', 'LOCKED', 'SETTLING', 'RESOLVED', 'VOID'];

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://23.27.186.134:8080';

export default function MarketsPage() {
  const { addToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<MarketStatus>('OPEN');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'markets' | 'updated'>('markets');
  const [updatedChanges, setUpdatedChanges] = useState<Record<string, UpdatedMarketChange>>({});
  const [originalStatuses, setOriginalStatuses] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client after mount; initial render on server should not call fetch
    if (!mounted || viewMode !== 'markets') return;
    fetchMarkets();
  }, [status, page, limit, mounted, viewMode]);

  const fetchMarkets = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({ status, limit: String(limit), page: String(page) });
      const url = `${API_BASE.replace(/\/$/, '')}/v1/markets?${params.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await res.json().catch(() => null);

      // Expecting shape: { markets: Market[]; total: number }
      console.log('Markets response', { url, httpStatus: res.status, data });

      const nextMarkets: Market[] = Array.isArray(data?.markets) ? data.markets : [];
      const nextTotal: number = typeof data?.total === 'number' ? data.total : nextMarkets.length;

      // Apply any local status overrides from updatedChanges so that
      // when we return to a page, we still see the latest edited status
      // instead of the original backend value.
      const adjustedMarkets: Market[] = nextMarkets.map((m) => {
        const change = updatedChanges[m.market_id];
        return change ? { ...m, status: change.updated_status } : m;
      });

      setMarkets(adjustedMarkets);
      setTotal(nextTotal);

      // Save raw backend response for manual testing snapshots
      try {
        await fetch('/api/markets/snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            page,
            limit,
            total: nextTotal,
            markets: nextMarkets,
          }),
        });
      } catch (snapshotError) {
        console.warn('Failed to save markets snapshot:', snapshotError);
      }

      // Capture original statuses for revert detection
      const origins: Record<string, string> = {};
      nextMarkets.forEach(m => {
        origins[m.market_id] = (m.status || '').toString().toUpperCase();
      });
      setOriginalStatuses(prev => ({ ...prev, ...origins }));

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
        addToast({ description: msg, variant: 'error' });
      } else {
        addToast({ description: `Loaded markets (${status}) page ${page}`, variant: 'success' });
      }
    } catch (e: any) {
      console.warn('Error fetching markets', e);
      const msg = e?.message || 'Unknown error while fetching markets';
      addToast({ description: msg, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusClick = (next: MarketStatus) => {
    setViewMode('markets');
    setStatus(next);
    setPage(1);
  };

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => p + 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleStatusChange = async (marketId: string, nextStatus: MarketStatus) => {
    const market = markets.find(m => m.market_id === marketId);
    if (!market) return;

    // Update visible table status
    setMarkets(prev => prev.map(m =>
      m.market_id === marketId ? { ...m, status: nextStatus } : m
    ));

    // Record change with previous and updated status, and keep
    // all changed markets in a single place regardless of current tab.
    // If the final status equals the original status from backend, remove it
    // from the updated list so we don't show no-op edits.
    setUpdatedChanges(prev => {
      const originalStatus = (originalStatuses[marketId] || market.status || '').toString().toUpperCase();
      const nextUpper = (nextStatus || '').toString().toUpperCase();

      // If user reverted back to original status, drop this change entirely
      if (originalStatus && originalStatus === nextUpper) {
        const { [marketId]: _omit, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [marketId]: {
          market_id: market.market_id,
          title: market.title,
          yes_account: market.yes_account,
          no_account: market.no_account,
          previous_status: originalStatus || nextUpper,
          updated_status: nextStatus,
        },
      };
    });
  };

  const updatedList = Object.values(updatedChanges);

  const handleViewUpdated = () => {
    setViewMode('updated');
  };

  const handleConfirmUpdated = () => {
    if (updatedList.length === 0) {
      addToast({ description: 'No updated markets to confirm.', variant: 'info' });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    if (updatedList.length === 0) {
      setShowConfirmModal(false);
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Replace this with real backend API call when provided.
      console.log('Sending updated markets to backend:', updatedList);
      addToast({
        description: `Sent ${updatedList.length} updated market(s) to backend (see console for payload).`,
        variant: 'success',
      });
      setShowConfirmModal(false);
    } catch (e: any) {
      console.error('Error sending updated markets', e);
      addToast({
        description: `Failed to send updated markets: ${e?.message || 'Unknown error'}`,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = () => {
    if (isSubmitting) return;
    setShowConfirmModal(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-white">Markets</h1>
            <p className="text-xs text-gray-400">View markets by status and inspect backend response</p>
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

        {/* Status Filter + Updated view toggle */}
        <div className="bg-[#252350] rounded-lg border border-gray-800 p-3 flex flex-wrap gap-2 items-center">
          {STATUS_OPTIONS.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusClick(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-cyan-600 text-white border-cyan-500'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                }`}
              >
                {s}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleViewUpdated}
            className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              viewMode === 'updated'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
          >
            Updated ({updatedList.length})
          </button>
        </div>

        {/* Main content - fixed header, scrolling table */}
        <div className="bg-[#252350] rounded-lg border border-gray-800 p-4 space-y-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>
              Status: <span className="text-white font-medium">{status}</span> · Page: <span className="text-white font-medium">{page}</span> /{' '}
              <span className="text-white font-medium">{totalPages}</span> · Limit: {limit} · Total: {total}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-3">
                <span className="text-gray-500">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-[11px] text-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page === 1 || isLoading}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full bg-gray-800 text-gray-200 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={isLoading || page >= totalPages}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full bg-gray-800 text-gray-200 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {viewMode === 'markets' ? (
            isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : markets.length === 0 ? (
              <div className="text-xs text-gray-400 py-4 text-center">
                No markets found for this status.
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                <table className="min-w-full text-xs text-gray-200">
                  <thead className="bg-gray-800/80 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-300">Title</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-300 w-32">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-300 w-32">Yes Account</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-300 w-32">No Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {markets.map((m) => (
                      <tr key={m.market_id} className="hover:bg-gray-800/60">
                        <td className="px-3 py-2 align-top">
                          <div className="text-gray-100 text-xs leading-snug line-clamp-2">{m.title}</div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={(m.status || '').toUpperCase()}
                            onChange={(e) => handleStatusChange(m.market_id, e.target.value as MarketStatus)}
                            className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-[11px] text-gray-100"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-500/60 text-[11px] text-emerald-200">
                            {m.yes_account}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-900/40 border border-red-500/60 text-[11px] text-red-200">
                            {m.no_account}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span>Updated markets: {updatedList.length}</span>
                <button
                  type="button"
                  onClick={handleConfirmUpdated}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white border border-emerald-500 text-[11px] hover:bg-emerald-500"
                >
                  Confirm & Send
                </button>
              </div>

              {updatedList.length === 0 ? (
                <div className="text-xs text-gray-400 py-4 text-center">
                  No markets have been updated yet. Change statuses in the markets view, then return here.
                </div>
              ) : (
                <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                  <table className="min-w-full text-xs text-gray-200">
                    <thead className="bg-gray-800/80 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-300">Title</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-300 w-32">Previous Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-300 w-32">Updated Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-300 w-32">Yes Account</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-300 w-32">No Account</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {updatedList.map((m) => (
                        <tr key={m.market_id} className="hover:bg-gray-800/60">
                          <td className="px-3 py-2 align-top">
                            <div className="text-gray-100 text-xs leading-snug line-clamp-2">{m.title}</div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-800 border border-gray-600 text-[11px] text-gray-200">
                              {m.previous_status}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-900/40 border border-cyan-500/60 text-[11px] text-cyan-200">
                              {m.updated_status}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-500/60 text-[11px] text-emerald-200">
                              {m.yes_account}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-900/40 border border-red-500/60 text-[11px] text-red-200">
                              {m.no_account}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setUpdatedChanges(prev => {
                                  const { [m.market_id]: _omit, ...rest } = prev;
                                  return rest;
                                });
                              }}
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-800 border border-gray-600 text-[11px] text-gray-200 hover:bg-gray-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {showConfirmModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full max-w-md space-y-3 shadow-xl">
          <h2 className="text-sm font-semibold text-white">Confirm sending updates</h2>
          <p className="text-xs text-gray-300">
            Are you sure you want to send{' '}
            <span className="font-semibold text-white">{updatedList.length}</span>{' '}
            updated market{updatedList.length === 1 ? '' : 's'} to the backend?
          </p>
          <p className="text-[11px] text-gray-500">
            This will submit all status changes you&apos;ve made in the Markets view.
          </p>
          <div className="flex justify-end gap-2 text-xs mt-2">
            <button
              type="button"
              onClick={handleCancelConfirm}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-60"
            >
              No, go back
            </button>
            <button
              type="button"
              onClick={handleConfirmSend}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-full bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {isSubmitting ? 'Sending…' : 'Yes, send updates'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
