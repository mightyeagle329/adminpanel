'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Twitter, Power, User, Building, Newspaper } from 'lucide-react';
import { TwitterAccount } from '@/lib/types';

export default function TwitterSourcesPage() {
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newAccount, setNewAccount] = useState({
    username: '',
    displayName: '',
    accountType: 'person' as const,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sources/twitter');
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAccount = async () => {
    if (!newAccount.username.trim()) {
      alert('Username is required');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/sources/twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newAccount.username.replace('@', ''),
          displayName: newAccount.displayName || newAccount.username,
          accountType: newAccount.accountType,
          enabled: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAccounts([...accounts, data.account]);
        setNewAccount({ username: '', displayName: '', accountType: 'person' });
        alert('✅ Account added successfully!');
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this account?')) return;

    try {
      const response = await fetch(`/api/sources/twitter?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setAccounts(accounts.filter(a => a.id !== id));
        alert('✅ Account deleted!');
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return <User className="w-4 h-4" />;
      case 'organization': return <Building className="w-4 h-4" />;
      case 'news': return <Newspaper className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header - Compact */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600 p-1.5">
            <Twitter className="w-full h-full text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Twitter Accounts</h1>
            <p className="text-xs text-gray-400">Monitor key influencers and news</p>
          </div>
        </div>

        {/* Add Account Form - Compact */}
        <div className="bg-[#252350] rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-white mb-3">Add New Account</h2>
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newAccount.username}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                placeholder="@username"
                className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newAccount.displayName}
                onChange={(e) => setNewAccount({ ...newAccount, displayName: e.target.value })}
                placeholder="Display name (optional)"
                className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={newAccount.accountType}
                onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value as any })}
                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="person">Person</option>
                <option value="organization">Organization</option>
                <option value="news">News/Media</option>
                <option value="other">Other</option>
              </select>
              <button
                onClick={addAccount}
                disabled={isAdding}
                className="px-4 py-2 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Accounts List - Compact */}
        <div className="bg-[#252350] rounded-lg border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-white mb-3">
            Active Accounts ({accounts.filter(a => a.enabled).length}/{accounts.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No accounts yet. Default accounts will be added automatically.
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Power className={`w-4 h-4 flex-shrink-0 ${account.enabled ? 'text-green-400' : 'text-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-medium text-sm truncate">@{account.username}</span>
                        <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-400 rounded text-xs flex items-center gap-0.5 flex-shrink-0">
                          {getAccountTypeIcon(account.accountType)}
                          {account.accountType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{account.displayName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      account.enabled 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-700 text-gray-500'
                    }`}>
                      {account.enabled ? 'On' : 'Off'}
                    </span>
                    <button
                      onClick={() => deleteAccount(account.id)}
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
