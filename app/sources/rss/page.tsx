'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Rss, Power, ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { RSSFeed } from '@/lib/types';

export default function RSSSourcesPage() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);

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

  const filteredFeeds = feeds.filter((feed) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return feed.name.toLowerCase().includes(q) || feed.url.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredFeeds.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFeeds = filteredFeeds.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setIsItemsDropdownOpen(false);
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
    <div className="w-full h-full text-white flex flex-col overflow-hidden">
      <div className="mx-auto w-full space-y-4">
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

        {/* Feeds List - Table style with Questions-like controls */}
        <div className="bg-[#252350] rounded-lg border border-gray-800 p-4 flex-1 flex flex-col min-h-0">
          <h2 className="text-sm font-bold text-white mb-3">
            Active Feeds ({feeds.filter(f => f.enabled).length}/{feeds.length})
          </h2>

          {/* Search + items-per-page controls */}
          <div className="flex items-center justify-between mb-3 gap-4">
            <div className="flex items-center gap-2 px-4 h-[40px] w-full max-w-md rounded-full bg-white/5 border border-white/10 text-xs">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search feeds or URLs..."
                className="bg-transparent border-none outline-none text-[11px] text-white placeholder:text-gray-500 w-full"
              />
            </div>

            {filteredFeeds.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-gray-300 relative">
                <button
                  type="button"
                  onClick={() => setIsItemsDropdownOpen((open) => !open)}
                  className="flex items-center justify-between px-4 h-[40px] w-[160px] rounded-full bg-white/5 border border-white/10 text-[11px] text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  <span>Show: {itemsPerPage} per page</span>
                  <span className="text-[10px] ml-2">▾</span>
                </button>

                {isItemsDropdownOpen && (
                  <div className="absolute left-0 top-[44px] z-20 w-[160px] rounded-2xl bg-[#17153a] border border-white/10 shadow-lg overflow-hidden text-[11px] text-white">
                    {[10, 20, 50, 100].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleItemsPerPageChange(opt)}
                        className={`w-full px-4 py-2 text-left hover:bg:white/10 ${
                          itemsPerPage === opt ? 'bg-white/15' : ''
                        }`}
                      >
                        {opt} per page
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-center px-3 h-[40px] rounded-full bg:white/5 border border-white/10 text-[11px] text-white">
                  <span>
                    {filteredFeeds.length === 0
                      ? '0-0 of 0'
                      : `${startIndex + 1}-${Math.min(endIndex, filteredFeeds.length)} of ${filteredFeeds.length}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          ) : feeds.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No feeds yet. Default feeds will be added automatically.
            </div>
          ) : filteredFeeds.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No feeds match your search.
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden mt-2">
              <div className="h-[450px] overflow-y-auto border border-[#34316b] rounded-xl bg-[#221f54]">
                <table className="w-full text-left text-xs text-gray-300 border-separate border-spacing-0">
                  <thead className="sticky top-0 bg-[#252264] z-10">
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="px-3 py-2 font-medium text-white">Feed</th>
                      <th className="px-3 py-2 font-medium text-white">URL</th>
                      <th className="w-24 px-3 py-2 text-right font-medium text-white">Category</th>
                      <th className="w-20 px-3 py-2 text-right font-medium text-white">Status</th>
                      <th className="w-20 px-3 py-2 text-right font-medium text-white">Open</th>
                      <th className="w-16 px-3 py-2 text-right font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFeeds.map((feed) => (
                      <tr
                        key={feed.id}
                        className="hover:bg-gray-800/80 cursor-pointer"
                      >
                        <td className="px-3 py-2 align-top">
                          <Power className={`w-4 h-4 ${feed.enabled ? 'text-green-400' : 'text-gray-600'}`} />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="text-white font-medium text-sm truncate">{feed.name}</span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="text-xs text-gray-400 truncate block max-w-xs">{feed.url}</span>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <span className={`px-1.5 py-0.5 rounded text-xs border ${getCategoryColor(feed.category)}`}>
                            {feed.category}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            feed.enabled 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-700 text-gray-500'
                          }`}>
                            {feed.enabled ? 'On' : 'Off'}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <a
                            href={feed.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-orange-300 hover:text-orange-200"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open
                          </a>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <button
                            onClick={() => deleteFeed(feed.id)}
                            className="inline-flex items-center justify-center p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredFeeds.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800 gap-3 flex-wrap text-xs text-gray-300">
              <span>
                Showing {filteredFeeds.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredFeeds.length)} of {filteredFeeds.length}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-800/90 border border-gray-700 text-gray-100 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Prev
                </button>
                <span className="px-3 py-1 rounded-full bg-gray-900/80 border border-gray-700 text-[11px] text-gray-300">
                  Page <span className="text-white">{currentPage}</span> / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-800/90 border border-gray-700 text-gray-100 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
