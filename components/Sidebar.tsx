'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Radio, TrendingUp, Twitter, Rss, Database, Sparkles, Settings, BarChart3,
  Bot, Bell,
  // Wand2, Shield, DollarSign, Trophy, Users, // restore when re-enabling Market Wizard, Treasury, Competitions, Security, CRM
} from 'lucide-react';

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
    { name: 'Markets', href: '/markets', icon: BarChart3 },
    { name: 'AI Curator', href: '/ai-curator', icon: Bot },
    // --- Commented out for later use ---
    // { name: 'Market Wizard', href: '/market-wizard', icon: Wand2 },
    // { name: 'Treasury & Risk', href: '/treasury', icon: DollarSign },
    // { name: 'Competitions', href: '/competitions', icon: Trophy },
    // { name: 'Security', href: '/security', icon: Shield },
    // { name: 'CRM', href: '/crm', icon: Users },
    // { name: 'Communications', href: '/communications', icon: Bell },
  ];

  return (
    <div className="flex flex-col h-full text-[13px] text-white">
      {/* Logo / Brand */}
      <div className="px-5 pt-6 pb-4">
        {/*
          Layout requirements:
          - Dot #2 slightly raised above dot #1
          - Dots aligned with "STREAK" text baseline/center
          - "News Admin" begins below the first dot
        */}
        <div className="grid grid-cols-[34px_1fr] grid-rows-[auto_auto] items-start">
          {/* Dots column */}
          <div className="row-span-2 relative h-[40px]">
            <div className="sidebar-dot absolute left-0 top-2" />
            <div className="sidebar-dot absolute left-[9px] top-1" />
          </div>

          {/* STREAK title aligned with dots */}
          <div className="flex items-center h-[26px]">
            <span className="sidebar-logo-title">STREAK</span>
          </div>

          {/* News Admin starts under dot #1 */}
          <div className="-mt-1">
            <span className="sidebar-logo-subtitle">News Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-5 pb-6 space-y-1 overflow-y-auto text-[13px]">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium transition-all
                ${isActive 
                  ? 'bg-[#2f2a76] text-[#4DE6B8] shadow-[0_0_0_1px_rgba(122,131,255,0.7)]' 
                  : 'text-white hover:bg-[#27245f]'
                }
              `}
            >
              <Icon className="w-4 h-4" color={isActive ? '#4DE6B8' : '#FFFFFF'} />
              <span className="tracking-[0.04em]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 mt-auto">
        {(() => {
          const isSettingsActive = pathname === '/settings';
          return (
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all ${
            isSettingsActive
              ? 'bg-[#2f2a76] text-[#4DE6B8] shadow-[0_0_0_1px_rgba(122,131,255,0.7)]'
              : 'text-white hover:bg-[#27245f]'
          }`}
        >
          <Settings className="w-4 h-4" color={isSettingsActive ? '#4DE6B8' : '#FFFFFF'} />
          <span>Settings</span>
        </Link>
          );
        })()}
      </div>
    </div>
  );
}
