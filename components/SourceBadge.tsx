import { SourceType } from '@/lib/types';
import { Radio, TrendingUp, Twitter, Rss } from 'lucide-react';

interface SourceBadgeProps {
  source: SourceType;
  className?: string;
}

const sourceConfig = {
  telegram: {
    icon: Radio,
    label: 'Telegram',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  polymarket: {
    icon: TrendingUp,
    label: 'Polymarket',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
  },
  twitter: {
    icon: Twitter,
    label: 'Twitter',
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
  },
  rss: {
    icon: Rss,
    label: 'RSS',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
  },
};

export default function SourceBadge({ source, className = '' }: SourceBadgeProps) {
  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${className}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
