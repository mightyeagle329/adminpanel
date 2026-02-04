'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, TrendingUp, Twitter, Rss, Loader2, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import SourceBadge from '@/components/SourceBadge';

interface SourceStats {
  telegram: number;
  polymarket: number;
  twitter: number;
  rss: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SourceStats>({ telegram: 0, polymarket: 0, twitter: 0, rss: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [lastScrape, setLastScrape] = useState<{ time: string; total: number } | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    loadStats();
    initializeSources();
  }, []);

  const initializeSources = async () => {
    try {
      await fetch('/api/sources/init', { method: 'POST' });
    } catch (error) {
      console.error('Error initializing sources:', error);
    }
  };

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [channels, topics, accounts, feeds] = await Promise.all([
        fetch('/api/channels').then(r => r.json()),
        fetch('/api/sources/polymarket').then(r => r.json()),
        fetch('/api/sources/twitter').then(r => r.json()),
        fetch('/api/sources/rss').then(r => r.json()),
      ]);

      setStats({
        telegram: channels.channels?.length || 0,
        polymarket: topics.topics?.length || 0,
        twitter: accounts.accounts?.length || 0,
        rss: feeds.feeds?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startScraping = async () => {
    setIsScraping(true);
    try {
      const response = await fetch('/api/scrape-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 2 }),
      });

      const result = await response.json();

      if (result.success) {
        setLastScrape({
          time: new Date().toISOString(),
          total: result.stats.total,
        });
        alert(`✅ Successfully scraped ${result.stats.total} posts!\n\n` +
          `📺 Telegram: ${result.stats.telegram}\n` +
          `📊 Polymarket: ${result.stats.polymarket}\n` +
          `🐦 Twitter: ${result.stats.twitter}\n` +
          `📰 RSS: ${result.stats.rss}`
        );
      } else {
        alert(`⚠️ Scraping completed with errors:\n\n${result.errors.map((e: any) => `${e.source}: ${e.error}`).join('\n')}`);
      }
    } catch (error: any) {
      alert(`❌ Error during scraping:\n\n${error.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const sourceCards = [
    { 
      name: 'Telegram',
      count: stats.telegram,
      icon: Radio,
      color: 'from-blue-500 to-cyan-500',
      href: '/sources/telegram',
      description: 'Crypto news channels'
    },
    {
      name: 'Polymarket',
      count: stats.polymarket,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      href: '/sources/polymarket',
      description: 'Prediction markets'
    },
    {
      name: 'Twitter',
      count: stats.twitter,
      icon: Twitter,
      color: 'from-sky-500 to-blue-500',
      href: '/sources/twitter',
      description: 'Key accounts'
    },
    {
      name: 'RSS Feeds',
      count: stats.rss,
      icon: Rss,
      color: 'from-orange-500 to-red-500',
      href: '/sources/rss',
      description: 'News feeds'
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-3">
            News Tracking Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Multi-source crypto, politics & financial news monitoring
          </p>
        </div>

        {/* Source Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sourceCards.map((source) => {
            const Icon = source.icon;
            return (
              <button
                key={source.name}
                onClick={() => router.push(source.href)}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-6 hover:bg-gray-800/70 transition-all hover:scale-105 hover:shadow-2xl group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${source.color} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {isLoading ? '...' : source.count}
                </div>
                <div className="text-sm font-medium text-gray-300 mb-1">
                  {source.name}
                </div>
                <div className="text-xs text-gray-500">
                  {source.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={startScraping}
              disabled={isScraping}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
            >
              {isScraping ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scraping...
                </span>
              ) : (
                'Start Scraping All Sources'
              )}
            </button>

            <button
              onClick={() => router.push('/data')}
              className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
            >
              View All Data
            </button>

            <button
              onClick={() => router.push('/questions')}
              className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
            >
              Generate Questions
            </button>
          </div>
        </div>

        {/* Last Scrape Info */}
        {lastScrape && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-white font-medium">
                  Last scrape: {new Date(lastScrape.time).toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">
                  Found {lastScrape.total} posts from all sources
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Source Overview */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Active Sources</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-medium">Telegram Channels</h3>
              </div>
              <p className="text-3xl font-bold text-blue-400">{stats.telegram}</p>
              <p className="text-sm text-gray-500 mt-1">Crypto news channels</p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">Polymarket Topics</h3>
              </div>
              <p className="text-3xl font-bold text-purple-400">{stats.polymarket}</p>
              <p className="text-sm text-gray-500 mt-1">Prediction market topics</p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Twitter className="w-5 h-5 text-sky-400" />
                <h3 className="text-white font-medium">Twitter Accounts</h3>
              </div>
              <p className="text-3xl font-bold text-sky-400">{stats.twitter}</p>
              <p className="text-sm text-gray-500 mt-1">Key influencers & news</p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Rss className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-medium">RSS Feeds</h3>
              </div>
              <p className="text-3xl font-bold text-orange-400">{stats.rss}</p>
              <p className="text-sm text-gray-500 mt-1">News & blogs</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        {stats.telegram + stats.polymarket + stats.twitter + stats.rss === 0 && !isLoading && (
          <div className="bg-cyan-500/10 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-medium mb-2">Getting Started</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Configure your data sources to start tracking news:
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>1. Add Telegram channels (existing channels loaded automatically)</div>
                  <div>2. Configure Polymarket topics (default topics added)</div>
                  <div>3. Add Twitter accounts to monitor</div>
                  <div>4. Add RSS feeds (default feeds included)</div>
                  <div>5. Click "Start Scraping" to collect data</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
