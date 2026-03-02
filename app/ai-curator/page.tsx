'use client';

import { useEffect, useState } from 'react';
import { Bot, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { fastApiClient } from '@/lib/fastApiClient';
import { useToast } from '@/components/ToastProvider';
import { AICuratorStatus, AICuratorConfig, AIGeneratedMarketDraft, AIMode } from '@/lib/types';

export default function AICuratorPage() {
  const { addToast } = useToast();
  const [status, setStatus] = useState<AICuratorStatus | null>(null);
  const [config, setConfig] = useState<AICuratorConfig | null>(null);
  const [drafts, setDrafts] = useState<AIGeneratedMarketDraft[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'status' | 'drafts' | 'config' | 'stats'>('status');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statusData, configData, draftsData, statsData] = await Promise.all([
        fastApiClient.getAICuratorStatus(),
        fastApiClient.getAICuratorConfig(),
        fastApiClient.getPendingDrafts(),
        fastApiClient.getGenerationStats('today'),
      ]);
      setStatus(statusData);
      setConfig(configData);
      setDrafts(draftsData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading AI Curator data:', error);
      addToast({ description: `Error: ${error.message}`, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAIMode = async () => {
    if (!config) return;
    
    const newMode: AIMode = config.mode === 'HUMAN_REVIEW' ? 'FULL_CONTROL' : 'HUMAN_REVIEW';
    
    try {
      await fastApiClient.toggleAIMode(newMode);
      addToast({
        description: `AI Mode switched to ${newMode === 'FULL_CONTROL' ? '⚡ FULL CONTROL' : '🛡️ HUMAN REVIEW'}`,
        variant: 'success',
      });
      loadData();
    } catch (error: any) {
      addToast({ description: `Error: ${error.message}`, variant: 'error' });
    }
  };

  const approveDraft = async (draftId: string) => {
    try {
      await fastApiClient.approveDraft(draftId);
      addToast({ description: 'Draft approved and published', variant: 'success' });
      loadData();
    } catch (error: any) {
      addToast({ description: `Error: ${error.message}`, variant: 'error' });
    }
  };

  const rejectDraft = async (draftId: string) => {
    try {
      await fastApiClient.rejectDraft(draftId);
      addToast({ description: 'Draft rejected', variant: 'success' });
      loadData();
    } catch (error: any) {
      addToast({ description: `Error: ${error.message}`, variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Curator Engine</h1>
            <p className="text-sm text-gray-400">Autonomous market draft generation and approval</p>
          </div>
        </div>

        {/* Master AI Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Mode:</span>
            <span className={`font-semibold ${config?.mode === 'FULL_CONTROL' ? 'text-yellow-400' : 'text-green-400'}`}>
              {config?.mode === 'FULL_CONTROL' ? '⚡ FULL CONTROL' : '🛡️ HUMAN REVIEW'}
            </span>
          </div>
          <button
            onClick={toggleAIMode}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              config?.mode === 'FULL_CONTROL'
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            Toggle Mode
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg border ${
          status.is_running ? 'bg-green-900/20 border-green-700' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${status.is_running ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <div>
                <div className="font-semibold text-sm">
                  {status.is_running ? '🟢 AI Curator is running' : '⚪ AI Curator is stopped'}
                </div>
                <div className="text-xs text-gray-400">
                  Created today: {status.markets_created_today} | Pending approval: {status.markets_pending_approval}
                </div>
              </div>
            </div>
            {status.last_execution && (
              <div className="text-xs text-gray-400">
                Last execution: {new Date(status.last_execution).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {[
          { id: 'status', label: 'Status' },
          { id: 'drafts', label: `Pending Drafts (${drafts.length})` },
          { id: 'stats', label: 'Statistics' },
          { id: 'config', label: 'Configuration' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              selectedTab === tab.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedTab === 'status' && status && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Markets Created Today</div>
                <div className="text-3xl font-bold text-cyan-400">{status.markets_created_today}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Pending Approval</div>
                <div className="text-3xl font-bold text-yellow-400">{status.markets_pending_approval}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <div className="text-xl font-bold text-green-400">
                  {status.is_running ? 'Running' : 'Stopped'}
                </div>
              </div>
            </div>

            {config && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Current Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Mode:</span>
                    <span className="ml-2 font-semibold">{config.mode}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Interval:</span>
                    <span className="ml-2 font-semibold">{config.interval_seconds}s</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Max/Hour:</span>
                    <span className="ml-2 font-semibold">{config.max_markets_per_hour}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Auto-Publish:</span>
                    <span className="ml-2 font-semibold">{config.auto_publish ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'drafts' && (
          <div className="space-y-4">
            {drafts.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending drafts</p>
              </div>
            ) : (
              drafts.map((draft) => (
                <div key={draft.draft_id} className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-900/40 text-purple-300 text-xs rounded">
                          {draft.category}
                        </span>
                        <span className="px-2 py-1 bg-blue-900/40 text-blue-300 text-xs rounded">
                          {draft.badge}
                        </span>
                        <span className="text-xs text-gray-400">
                          Confidence: {(draft.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{draft.question}</h3>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>Duration: {draft.duration_hours}h</span>
                        <span>Options: {draft.outcome_a_label} vs {draft.outcome_b_label}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveDraft(draft.draft_id)}
                        className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                        title="Approve & Publish"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => rejectDraft(draft.draft_id)}
                        className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Source: {draft.resolution_source}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Total Generated</div>
                <div className="text-2xl font-bold">{stats.total_generated}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Auto-Published</div>
                <div className="text-2xl font-bold text-green-400">{stats.auto_published}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-400">{stats.pending_approval}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Rejected</div>
                <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">By Category</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_category).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{category}</span>
                    <span className="font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">By Game Mode</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_game_mode).map(([mode, count]) => (
                  <div key={mode} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{mode}</span>
                    <span className="font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'config' && config && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-4">Game Modes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'flash_15m_enabled', label: '15m Flash' },
                  { key: 'high_jump_15m_enabled', label: '15m High Jump' },
                  { key: 'marathon_15m_enabled', label: '15m Marathon' },
                  { key: 'climax_30m_enabled', label: '30m Climax' },
                  { key: 'duo_30m_enabled', label: '30m Duo' },
                  { key: 'curator_1h_enabled', label: '1h Curator' },
                  { key: 'curator_4h_enabled', label: '4h Curator' },
                  { key: 'curator_12h_enabled', label: '12h Curator' },
                  { key: 'curator_24h_enabled', label: '24h Curator' },
                ].map((mode) => (
                  <div
                    key={mode.key}
                    className={`p-3 rounded-lg border ${
                      (config as any)[mode.key]
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium">{mode.label}</div>
                    <div className={`text-xs ${(config as any)[mode.key] ? 'text-green-400' : 'text-gray-500'}`}>
                      {(config as any)[mode.key] ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-4">Parameters</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Polling Interval (seconds)</label>
                  <input
                    type="number"
                    value={config.interval_seconds}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Markets Per Hour</label>
                  <input
                    type="number"
                    value={config.max_markets_per_hour}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
