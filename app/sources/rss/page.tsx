'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Rss, Power } from 'lucide-react';
import { RSSFeed } from '@/lib/types';

export default function RSSSourcesPage() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Local draft for a new feed. Mirror the RSSFeed shape for the fields we edit.
  const [newFeed, setNewFeed] = useState<Pick<RSSFeed, 'name' | 'url' | 'category'>>({
    name: '',
    url: '',
    category: 'crypto',
  });

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sources/rss');
      const data = await response.json();
      setFeeds(data.feeds || []);
    } catch (error) {
      console.error('Error loading feeds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFeed = async () => {
    if (!newFeed.name.trim() || !newFeed.url.trim()) {
      alert('Name and URL are required');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/sources/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFeed.name,
          url: newFeed.url,
          category: newFeed.category,
          enabled: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFeeds([...feeds, data.feed]);
        setNewFeed({ name: '', url: '', category: 'crypto' });
        alert('✅ RSS feed added successfully!');
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteFeed = async (id: string) => {
    if (!confirm('Delete this feed?')) return;

    try {
      const response = await fetch(`/api/sources/rss?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setFeeds(feeds.filter(f => f.id !== id));
        alert('✅ Feed deleted!');
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'crypto': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'politics': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'financial': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header - Compact */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-orange-600 p-1.5">
            <Rss className="w-full h-full text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">RSS Feeds</h1>
            <p className="text-xs text-gray-400">Track news sources and blogs</p>
          </div>
        </div>

        {/* Add Feed Form - Compact */}
        <div className="bg-[#252350] rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-white mb-3">Add New Feed</h2>
          <div className="space-y-2">
            <input
              type="text"
              value={newFeed.name}
              onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
              placeholder="Feed name (e.g., CoinDesk)"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <input
              type="url"
              value={newFeed.url}
              onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
              placeholder="Feed URL"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <select
                value={newFeed.category}
                onChange={(e) => setNewFeed({ ...newFeed, category: e.target.value as RSSFeed['category'] })}
                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="crypto">Crypto</option>
                <option value="politics">Politics</option>
                <option value="financial">Financial</option>
                <option value="general">General</option>
              </select>
              <button
                onClick={addFeed}
                disabled={isAdding}
                className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Feeds List - Compact */}
        <div className="bg-[#252350] rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-white mb-3">
            Active Feeds ({feeds.filter(f => f.enabled).length}/{feeds.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          ) : feeds.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No feeds yet. Default feeds will be added automatically.
            </div>
          ) : (
            <div className="space-y-2">
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  className="p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Power className={`w-4 h-4 flex-shrink-0 ${feed.enabled ? 'text-green-400' : 'text-gray-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium text-sm truncate">{feed.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${getCategoryColor(feed.category)}`}>
                            {feed.category}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {feed.url}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        feed.enabled 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-700 text-gray-500'
                      }`}>
                        {feed.enabled ? 'On' : 'Off'}
                      </span>
                      <button
                        onClick={() => deleteFeed(feed.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
