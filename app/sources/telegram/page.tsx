'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Radio, Power, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { TelegramChannel } from '@/lib/types';

export default function TelegramSourcesPage() {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);

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

  const filteredChannels = channels.filter((ch) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return ch.username.toLowerCase().includes(q) || ch.url.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChannels = filteredChannels.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setIsItemsDropdownOpen(false);
  };

  return (
    <div className="w-full h-full text-white flex flex-col overflow-hidden">
      <div className="mx-auto w-full space-y-4">
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
        <div className="bg-[#1e1b52] rounded-lg border border-gray-800 p-4">
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

        {/* Channels List - Table style (with search + pagination like Questions) */}
        <div className="bg-[#1e1b52] rounded-lg border border-gray-800 p-4 flex-1 flex flex-col min-h-0">
          <h2 className="text-sm font-bold text-white mb-3">
            Active Channels ({channels.filter(ch => ch.enabled !== false).length}/{channels.length})
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
                placeholder="Search channels..."
                className="bg-transparent border-none outline-none text-[11px] text-white placeholder:text-gray-500 w-full"
              />
            </div>

            {filteredChannels.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-gray-300 relative">
                {/* Show: N per page pill */}
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

                {/* Range pill: 1-20 of N */}
                <div className="flex items-center justify-center px-3 h-[40px] rounded-full bg-white/5 border border-white/10 text-[11px] text-white">
                  <span>
                    {filteredChannels.length === 0
                      ? '0-0 of 0'
                      : `${startIndex + 1}-${Math.min(endIndex, filteredChannels.length)} of ${filteredChannels.length}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No channels yet. Add your first channel above!
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No channels match your search.
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden mt-2">
              <div className="h-[500px] overflow-y-auto border border-[#34316b] rounded-xl bg-[#221f54]">
                <table className="w-full text-left text-xs text-gray-300 border-separate border-spacing-0">
                  <thead className="sticky top-0 bg-[#252264] z-10">
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="px-3 py-2 font-medium text-white">Channel</th>
                      <th className="px-3 py-2 font-medium text-white">URL</th>
                      <th className="w-20 px-3 py-2 text-right font-medium text-white">Status</th>
                      <th className="w-16 px-3 py-2 text-right font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentChannels.map((channel) => (
                      <tr
                        key={channel.id}
                        className="hover:bg-gray-800/80 cursor-pointer"
                      >
                        <td className="px-3 py-2 align-top">
                          <Power
                            className={`w-4 h-4 ${channel.enabled !== false ? 'text-green-400' : 'text-gray-600'}`}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-white font-medium text-sm truncate">@{channel.username}</div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-xs text-gray-400 truncate">{channel.url}</div>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              channel.enabled !== false
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {channel.enabled !== false ? 'On' : 'Off'}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <button
                            onClick={() => deleteChannel(channel.id)}
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

          {/* Pagination row */}
          {filteredChannels.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800 gap-3 flex-wrap text-xs text-gray-300">
              <span>
                Showing {filteredChannels.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredChannels.length)} of {filteredChannels.length}
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
