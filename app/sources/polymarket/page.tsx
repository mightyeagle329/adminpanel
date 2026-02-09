'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, TrendingUp, Power, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { PolymarketTopic } from '@/lib/types';

export default function PolymarketSourcesPage() {
  const [topics, setTopics] = useState<PolymarketTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);
  
  const [newTopic, setNewTopic] = useState({
    name: '',
    keywords: '',
    category: 'crypto' as const,
  });

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sources/polymarket');
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTopic = async () => {
    if (!newTopic.name.trim() || !newTopic.keywords.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsAdding(true);
    try {
      const keywords = newTopic.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      const response = await fetch('/api/sources/polymarket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTopic.name,
          keywords,
          category: newTopic.category,
          enabled: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTopics([...topics, data.topic]);
        setNewTopic({ name: '', keywords: '', category: 'crypto' });
        alert('✅ Topic added successfully!');
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('Delete this topic?')) return;

    try {
      const response = await fetch(`/api/sources/polymarket?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setTopics(topics.filter(t => t.id !== id));
        alert('✅ Topic deleted!');
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const filteredTopics = topics.filter((topic) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const keywordsCombined = topic.keywords.join(' ').toLowerCase();
    return topic.name.toLowerCase().includes(q) || keywordsCombined.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTopics = filteredTopics.slice(startIndex, endIndex);

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
      case 'sports': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="w-full h-full text-white flex flex-col overflow-hidden">
      <div className="mx-auto w-full space-y-4">
        {/* Header - Compact */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 p-1.5">
            <TrendingUp className="w-full h-full text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Polymarket Topics</h1>
            <p className="text-xs text-gray-400">Track prediction markets</p>
          </div>
        </div>

        {/* Add Topic Form - Compact */}
        <div className="bg-[#1e1b52] rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-white mb-3">Add New Topic</h2>
          <div className="space-y-2">
            <input
              type="text"
              value={newTopic.name}
              onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
              placeholder="Topic name (e.g., Crypto Markets)"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="text"
              value={newTopic.keywords}
              onChange={(e) => setNewTopic({ ...newTopic, keywords: e.target.value })}
              placeholder="Keywords: Bitcoin, BTC, Ethereum"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <select
                value={newTopic.category}
                onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value as any })}
                className="flex-1 px-3 py-2 text-sm bg-[#221f54] border-[#34316b] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="crypto">Crypto</option>
                <option value="politics">Politics</option>
                <option value="financial">Financial</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
              <button
                onClick={addTopic}
                disabled={isAdding}
                className="px-4 py-2 bg-[#221f54] text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Topics List - Table style with Questions-like controls */}
        <div className="bg-[#1e1b52] rounded-lg border border-gray-800 p-4 flex-1 flex flex-col min-h-0">
          <h2 className="text-sm font-bold text-white mb-3">
            Active Topics ({topics.filter(t => t.enabled).length}/{topics.length})
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
                placeholder="Search topics or keywords..."
                className="bg-transparent border-none outline-none text-[11px] text-white placeholder:text-gray-500 w-full"
              />
            </div>

            {filteredTopics.length > 0 && (
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
                        className={`w-full px-4 py-2 text-left hover:bg-white/10 ${
                          itemsPerPage === opt ? 'bg-white/15' : ''
                        }`}
                      >
                        {opt} per page
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-center px-3 h-[40px] rounded-full bg-white/5 border border-white/10 text-[11px] text-white">
                  <span>
                    {filteredTopics.length === 0
                      ? '0-0 of 0'
                      : `${startIndex + 1}-${Math.min(endIndex, filteredTopics.length)} of ${filteredTopics.length}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No topics yet. Default topics will be added automatically.
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No topics match your search.
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden mt-2">
              <div className="h-[400px] overflow-y-auto border border-gray-700 rounded-xl bg-[#221f54]">
                <table className="w-full text-left text-xs text-gray-300 border-separate border-spacing-0">
                  <thead className="sticky top-0 bg-[#252264] z-10">
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="px-3 py-2 font-medium text-white">Topic</th>
                      <th className="px-3 py-2 font-medium text-white">Keywords</th>
                      <th className="w-24 px-3 py-2 text-right font-medium text-white">Category</th>
                      <th className="w-16 px-3 py-2 text-right font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTopics.map((topic) => (
                      <tr
                        key={topic.id}
                        className="hover:bg-gray-800/80 cursor-pointer"
                      >
                        <td className="px-3 py-2 align-top">
                          <Power className={`w-4 h-4 ${topic.enabled ? 'text-green-400' : 'text-gray-600'}`} />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="text-white font-medium text-sm">{topic.name}</span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-wrap gap-1 w-full">
                            {topic.keywords.map((keyword, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-[11px]"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <span className={`px-1.5 py-0.5 rounded text-xs border ${getCategoryColor(topic.category)}`}>
                            {topic.category}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <button
                            onClick={() => deleteTopic(topic.id)}
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

          {filteredTopics.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800 gap-3 flex-wrap text-xs text-gray-300">
              <span>
                Showing {filteredTopics.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredTopics.length)} of {filteredTopics.length}
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
