'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Radio, TrendingUp, Twitter, Rss, Database, Sparkles, Send, Settings } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Telegram', href: '/sources/telegram', icon: Radio },
    { name: 'Polymarket', href: '/sources/polymarket', icon: TrendingUp },
    { name: 'Twitter', href: '/sources/twitter', icon: Twitter },
    { name: 'RSS Feeds', href: '/sources/rss', icon: Rss },
    { name: 'All Data', href: '/data', icon: Database },
    { name: 'Questions', href: '/questions', icon: Sparkles },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Logo - Compact */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-cyan-400">
          News Admin
        </h1>
        <p className="text-xs text-gray-500">Multi-Source Tracker</p>
      </div>

      {/* Navigation - Compact */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-cyan-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Compact */}
      <div className="p-3 border-t border-gray-800">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
