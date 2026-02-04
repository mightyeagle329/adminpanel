'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Radio, Power } from 'lucide-react';
import { TelegramChannel } from '@/lib/types';

export default function TelegramSourcesPage() {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/channels');
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addChannel = async () => {
    if (!newUrl.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      });

      const data = await response.json();
      if (data.success) {
        setChannels([...channels, data.channel]);
        setNewUrl('');
        alert('✅ Channel added successfully!');
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteChannel = async (id: string) => {
    if (!confirm('Delete this channel?')) return;

    try {
      const response = await fetch(`/api/channels?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setChannels(channels.filter(ch => ch.id !== id));
        alert('✅ Channel deleted!');
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-950">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header - Compact */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 p-1.5">
            <Radio className="w-full h-full text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Telegram Channels</h1>
            <p className="text-xs text-gray-400">Manage crypto news channels</p>
          </div>
        </div>

        {/* Add Channel - Compact */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-white mb-3">Add New Channel</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://t.me/channel_name"
              className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addChannel()}
            />
            <button
              onClick={addChannel}
              disabled={isAdding || !newUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </div>

        {/* Channels List - Compact */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-white mb-3">
            Active Channels ({channels.filter(ch => ch.enabled !== false).length}/{channels.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No channels yet. Add your first channel above!
            </div>
          ) : (
            <div className="space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Power className={`w-4 h-4 flex-shrink-0 ${(channel.enabled !== false) ? 'text-green-400' : 'text-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">@{channel.username}</div>
                      <div className="text-xs text-gray-500 truncate">{channel.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      (channel.enabled !== false)
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-700 text-gray-500'
                    }`}>
                      {(channel.enabled !== false) ? 'On' : 'Off'}
                    </span>
                    <button
                      onClick={() => deleteChannel(channel.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
