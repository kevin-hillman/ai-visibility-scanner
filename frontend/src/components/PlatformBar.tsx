'use client';

import { useEffect, useState } from 'react';
import { platformColors, platformNames, platformTextColors } from '@/lib/utils';

interface PlatformBarProps {
  platform: string;
  score: number;
  maxScore?: number;
}

export default function PlatformBar({ platform, score, maxScore = 100 }: PlatformBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = (score / maxScore) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const bgClass = platformColors[platform] || 'bg-gray-500';
  const textClass = platformTextColors[platform] || 'text-gray-600 dark:text-gray-400';
  const displayName = platformNames[platform] || platform;

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 text-right">
        <span className={`font-medium text-sm ${textClass}`}>{displayName}</span>
      </div>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 relative overflow-hidden">
        <div className={`h-full ${bgClass} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${animatedWidth}%` }} />
      </div>
      <div className="w-10 text-right">
        <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{score}</span>
      </div>
    </div>
  );
}
