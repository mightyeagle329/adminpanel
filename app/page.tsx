'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, TrendingUp, Twitter, Rss, Loader2, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { WalletConnectButton } from '@/components/WalletConnectButton';

interface SourceStats {
  telegram: number;
  polymarket: number;
  twitter: number;
  rss: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { addToast } = useToast();
  const [stats, setStats] = useState<SourceStats>({ telegram: 0, polymarket: 0, twitter: 0, rss: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [lastScrape, setLastScrape] = useState<{ time: string; total: number; stats?: SourceStats } | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [showApiWarning, setShowApiWarning] = useState(false);

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

      if (result.success || result.stats) {
        setLastScrape({
          time: new Date().toISOString(),
          total: result.stats.total,
          stats: result.stats,
        });
        
        // Show API warning if Twitter/Polymarket had issues
        if (result.stats.twitter === 0 || result.stats.polymarket === 0) {
          setShowApiWarning(true);
        }
        
        // Show detailed results
        let message = `✅ Scraped ${result.stats.total} posts from last 2 days!\n\n`;
        message += `📺 Telegram: ${result.stats.telegram}\n`;
        message += `📊 Polymarket: ${result.stats.polymarket}\n`;
        message += `🐦 Twitter: ${result.stats.twitter}\n`;
        message += `📰 RSS: ${result.stats.rss}`;
        
        if (result.errors && result.errors.length > 0) {
          message += '\n\n⚠️ Some sources had issues:\n';
          message += result.errors.map((e: any) => `• ${e.source}`).join('\n');
          message += '\n\nCheck console for details.';
        }
        
        addToast({ description: message, variant: 'success' });
        
        // Reload the page to show updated data
        await loadStats();
      } else {
        addToast({
          description: `Scraping failed:\n\n${result.error || 'Unknown error'}`,
          variant: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error during scraping:', error);
      addToast({
        description: `Error during scraping:\n\n${error.message}`,
        variant: 'error',
      });
    } finally {
      setIsScraping(false);
    }
  };

  const sourceCards = [
    { 
      name: 'Telegram',
      count: stats.telegram,
      icon: Radio,
      color: 'bg-blue-600',
      href: '/sources/telegram',
      description: 'Channels',
      iconColor: 'text-blue-400'
    },
    {
      name: 'Polymarket',
      count: stats.polymarket,
      icon: TrendingUp,
      color: 'bg-purple-600',
      href: '/sources/polymarket',
      description: 'Topics',
      iconColor: 'text-purple-400'
    },
    {
      name: 'Twitter',
      count: stats.twitter,
      icon: Twitter,
      color: 'bg-sky-600',
      href: '/sources/twitter',
      description: 'Accounts',
      iconColor: 'text-sky-400'
    },
    {
      name: 'RSS',
      count: stats.rss,
      icon: Rss,
      color: 'bg-orange-600',
      href: '/sources/rss',
      description: 'Feeds',
      iconColor: 'text-orange-400'
    },
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header + Wallet Connect */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              News Tracking Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              Multi-source crypto, politics & financial news monitoring
            </p>
          </div>
          <div className="flex-shrink-0">
            <WalletConnectButton />
          </div>
        </div>

        {/* Source Statistics - Compact Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {sourceCards.map((source) => {
            const Icon = source.icon;
            return (
              <button
                key={source.name}
                onClick={() => router.push(source.href)}
                className="bg-[#252350] rounded-lg border border-gray-800 p-3 hover:bg-gray-850 hover:border-gray-700 transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded ${source.color} p-1 flex-shrink-0`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <div className={`text-xl font-bold ${source.iconColor}`}>
                    {isLoading ? '...' : source.count}
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-300">
                  {source.name}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {source.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions - Compact Buttons */}
        <div className="bg-[#252350] rounded-lg border border-gray-700 p-5">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={startScraping}
              disabled={isScraping}
              className="px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              {isScraping ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scraping...
                </span>
              ) : (
                'Start Scraping'
              )}
            </button>

            <button
              onClick={() => router.push('/data')}
              className="px-5 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all text-sm"
            >
              View All Data
            </button>

            <button
              onClick={() => router.push('/questions')}
              className="px-5 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all text-sm"
            >
              Generate Questions
            </button>
          </div>
        </div>

        {/* Last Scrape Info - Compact */}
        {lastScrape && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-white font-medium text-sm">
                    Last scrape: {new Date(lastScrape.time).toLocaleTimeString()}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {lastScrape.total} posts total
                  </div>
                </div>
              </div>
              {lastScrape.stats && (
                <div className="flex gap-3 text-xs">
                  <span className="text-blue-400">📺 {lastScrape.stats.telegram}</span>
                  <span className="text-purple-400">📊 {lastScrape.stats.polymarket}</span>
                  <span className="text-sky-400">🐦 {lastScrape.stats.twitter}</span>
                  <span className="text-orange-400">📰 {lastScrape.stats.rss}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Warning */}
        {showApiWarning && (
          <div className="bg-yellow-900/20 rounded-lg border border-yellow-700/50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="text-yellow-400 font-medium mb-1">API Status Notice</div>
                <div className="text-gray-400">
                  Twitter/Polymarket returned 0 results. Free tier API may have limits. RSS is working normally.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Getting Started - Compact */}
        {stats.telegram + stats.polymarket + stats.twitter + stats.rss === 0 && !isLoading && (
          <div className="bg-cyan-900/20 rounded-lg border border-cyan-700/50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-medium text-sm mb-2">Getting Started</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>1. Configure sources in sidebar</div>
                  <div>2. Click "Start Scraping" button</div>
                  <div>3. View data and generate questions</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
