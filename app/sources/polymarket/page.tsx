'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, TrendingUp, Power, Tag } from 'lucide-react';
import { PolymarketTopic } from '@/lib/types';

export default function PolymarketSourcesPage() {
  const [topics, setTopics] = useState<PolymarketTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
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
    <div className="min-h-screen p-4 bg-gray-950">
      <div className="max-w-4xl mx-auto space-y-4">
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
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
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
                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Topics List - Compact */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-white mb-3">
            Active Topics ({topics.filter(t => t.enabled).length}/{topics.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No topics yet. Default topics will be added automatically.
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Power className={`w-4 h-4 flex-shrink-0 ${topic.enabled ? 'text-green-400' : 'text-gray-600'}`} />
                      <div className="truncate">
                        <span className="text-white font-medium text-sm">{topic.name}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${getCategoryColor(topic.category)}`}>
                          {topic.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTopic(topic.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-all flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-1.5 mt-2">
                    <Tag className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {topic.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
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
