/**
 * FastAPI Backend Client
 * 
 * Handles communication with the Python FastAPI backend for:
 * - Data scraping
 * - Question generation
 * - AI Curator operations
 * - Admin panel operations (Phase 5)
 */

import {
  AICuratorConfig,
  AICuratorStatus,
  AIGeneratedMarketDraft,
  MarketCategory,
  VaultComposition,
  LiabilityScenario,
  SybilSuspect,
  GlobalBanner,
} from './types';

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

class FastAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = FASTAPI_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || error.detail || 'Request failed');
    }

    return response.json();
  }

  // ============================================
  // SCRAPING
  // ============================================

  async startScraping(params: {
    sources?: string[];
    days_back?: number;
    max_items_per_source?: number;
  }) {
    return this.request('/api/v1/scraping/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getScrapingProgress() {
    return this.request('/api/v1/scraping/progress');
  }

  async getScrapedPosts(limit: number = 100) {
    return this.request(`/api/v1/scraping/posts?limit=${limit}`);
  }

  // ============================================
  // QUESTION GENERATION
  // ============================================

  async generateQuestions(params: {
    min_questions?: number;
    max_questions?: number;
    use_recent_posts?: boolean;
    days_back?: number;
  }) {
    return this.request('/api/v1/questions/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // AI CURATOR (Phase 6)
  // ============================================

  async getAICuratorStatus(): Promise<AICuratorStatus> {
    return this.request<AICuratorStatus>('/api/v1/ai-curator/status');
  }

  async getAICuratorConfig(): Promise<AICuratorConfig> {
    return this.request<AICuratorConfig>('/api/v1/ai-curator/config');
  }

  async updateAICuratorConfig(config: AICuratorConfig) {
    return this.request('/api/v1/ai-curator/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async toggleAIMode(mode: 'HUMAN_REVIEW' | 'FULL_CONTROL') {
    return this.request('/api/v1/ai-curator/toggle', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  }

  async getPendingDrafts(): Promise<AIGeneratedMarketDraft[]> {
    return this.request<AIGeneratedMarketDraft[]>('/api/v1/ai-curator/drafts');
  }

  async approveDraft(draftId: string, modifications?: Record<string, any>) {
    return this.request(`/api/v1/ai-curator/drafts/${draftId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ draft_id: draftId, approved: true, modifications }),
    });
  }

  async rejectDraft(draftId: string) {
    return this.request(`/api/v1/ai-curator/drafts/${draftId}/reject`, {
      method: 'POST',
    });
  }

  async getGenerationStats(period: string = 'today') {
    return this.request(`/api/v1/ai-curator/stats?period=${period}`);
  }

  async getTriggerThresholds() {
    return this.request('/api/v1/ai-curator/thresholds');
  }

  async updateTriggerThresholds(thresholds: any) {
    return this.request('/api/v1/ai-curator/thresholds', {
      method: 'PUT',
      body: JSON.stringify(thresholds),
    });
  }

  async getDataSources() {
    return this.request('/api/v1/ai-curator/data-sources');
  }

  async toggleDataSource(sourceName: string, enabled: boolean) {
    return this.request(`/api/v1/ai-curator/data-sources/${sourceName}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // ============================================
  // MARKETS (Phase 5, Module 2)
  // ============================================

  async createMarket(data: any) {
    return this.request('/api/v1/markets/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listMarkets(params: {
    status?: string;
    category?: MarketCategory;
    source?: 'AI' | 'ADMIN';
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/v1/markets/list?${query}`);
  }

  async getMarket(marketId: string) {
    return this.request(`/api/v1/markets/${marketId}`);
  }

  async updateMarket(marketId: string, data: any) {
    return this.request(`/api/v1/markets/${marketId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resolveMarket(marketId: string, winningOutcome: number, proofData: any) {
    return this.request(`/api/v1/markets/${marketId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ winning_outcome: winningOutcome, proof_data: proofData }),
    });
  }

  async voidMarket(marketId: string, reason: string) {
    return this.request(`/api/v1/markets/${marketId}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async pauseMarket(marketId: string) {
    return this.request(`/api/v1/markets/${marketId}/pause`, {
      method: 'POST',
    });
  }

  async resumeMarket(marketId: string) {
    return this.request(`/api/v1/markets/${marketId}/resume`, {
      method: 'POST',
    });
  }

  // ============================================
  // TREASURY & RISK (Phase 5, Module 5)
  // ============================================

  async getVaultComposition(): Promise<VaultComposition> {
    return this.request<VaultComposition>('/api/v1/treasury/vault/composition');
  }

  async getCurrentExposure() {
    return this.request('/api/v1/treasury/vault/exposure');
  }

  async triggerRebalance() {
    return this.request('/api/v1/treasury/vault/rebalance', {
      method: 'POST',
    });
  }

  async getRiskConfig() {
    return this.request('/api/v1/treasury/risk/config');
  }

  async updateRiskConfig(config: any) {
    return this.request('/api/v1/treasury/risk/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getLiabilityHeatmap() {
    return this.request('/api/v1/treasury/liability/heatmap');
  }

  async getLiabilityScenarios(): Promise<LiabilityScenario[]> {
    return this.request<LiabilityScenario[]>('/api/v1/treasury/liability/scenarios');
  }

  async getCorrelationMatrix() {
    return this.request('/api/v1/treasury/correlation/matrix');
  }

  async blockCorrelation(outcomeA: string, outcomeB: string) {
    return this.request('/api/v1/treasury/correlation/block', {
      method: 'PUT',
      body: JSON.stringify({ outcome_a: outcomeA, outcome_b: outcomeB }),
    });
  }

  async getFeeConfig() {
    return this.request('/api/v1/treasury/fees/config');
  }

  async updateFeeConfig(config: any) {
    return this.request('/api/v1/treasury/fees/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async activateKillSwitch() {
    return this.request('/api/v1/treasury/emergency/kill-switch', {
      method: 'POST',
    });
  }

  // ============================================
  // SECURITY (Phase 5, Module 7)
  // ============================================

  async getSybilSuspects(includeResolved: boolean = false): Promise<SybilSuspect[]> {
    return this.request<SybilSuspect[]>(
      `/api/v1/security/sybil/suspects?include_resolved=${includeResolved}`
    );
  }

  async shadowBanUser(userId: string) {
    return this.request(`/api/v1/security/sybil/${userId}/shadow-ban`, {
      method: 'POST',
    });
  }

  async forgiveUser(userId: string) {
    return this.request(`/api/v1/security/sybil/${userId}/forgive`, {
      method: 'POST',
    });
  }

  async freezeAccount(userId: string, reason: string) {
    return this.request(`/api/v1/security/users/${userId}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unfreezeAccount(userId: string) {
    return this.request(`/api/v1/security/users/${userId}/unfreeze`, {
      method: 'POST',
    });
  }

  async getSentinelFlags(resolved: boolean = false) {
    return this.request(`/api/v1/security/sentinel/flags?resolved=${resolved}`);
  }

  async banDirectContractInteraction(walletAddress: string) {
    return this.request(`/api/v1/security/sentinel/${walletAddress}/ban`, {
      method: 'POST',
    });
  }

  async getAuditLog(limit: number = 100, actionType?: string) {
    const query = `limit=${limit}${actionType ? `&action_type=${actionType}` : ''}`;
    return this.request(`/api/v1/security/audit-log?${query}`);
  }

  // ============================================
  // COMMUNICATIONS (Phase 5, Module 8)
  // ============================================

  async createGlobalBanner(banner: GlobalBanner) {
    return this.request('/api/v1/communications/banner/create', {
      method: 'POST',
      body: JSON.stringify(banner),
    });
  }

  async getActiveBanner() {
    return this.request('/api/v1/communications/banner/active');
  }

  async updateBanner(bannerId: string, banner: GlobalBanner) {
    return this.request(`/api/v1/communications/banner/${bannerId}`, {
      method: 'PUT',
      body: JSON.stringify(banner),
    });
  }

  async deleteBanner(bannerId: string) {
    return this.request(`/api/v1/communications/banner/${bannerId}`, {
      method: 'DELETE',
    });
  }

  async getBannerHistory(limit: number = 50) {
    return this.request(`/api/v1/communications/banner/history?limit=${limit}`);
  }

  async broadcastNotification(title: string, message: string, userSegment: string = 'all') {
    return this.request('/api/v1/communications/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, message, user_segment: userSegment }),
    });
  }

  async getSystemStatus() {
    return this.request('/api/v1/communications/system/status');
  }

  // ============================================
  // COMPETITIONS (Phase 5, Module 4)
  // ============================================

  async createCompetition(data: any) {
    return this.request('/api/v1/competitions/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listCompetitions(activeOnly: boolean = false) {
    return this.request(`/api/v1/competitions/list?active_only=${activeOnly}`);
  }

  async getCompetition(competitionId: string) {
    return this.request(`/api/v1/competitions/${competitionId}`);
  }

  async resetLeaderboard(competitionId: string) {
    return this.request(`/api/v1/competitions/${competitionId}/reset`, {
      method: 'POST',
    });
  }

  async getEconomyConfig() {
    return this.request('/api/v1/competitions/economy/config');
  }

  async updateEconomyConfig(config: any) {
    return this.request('/api/v1/competitions/economy/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getAllianceConfig() {
    return this.request('/api/v1/competitions/alliance/config');
  }

  async updateAllianceConfig(config: any) {
    return this.request('/api/v1/competitions/alliance/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getReferralTree(userId: string) {
    return this.request(`/api/v1/competitions/alliance/tree/${userId}`);
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck() {
    return this.request('/health');
  }
}

// Export singleton instance
export const fastApiClient = new FastAPIClient();

// Export class for custom instances if needed
export default FastAPIClient;
