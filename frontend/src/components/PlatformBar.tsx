'use client';

import { useEffect, useState } from 'react';
import { platformColors, platformNames } from '@/lib/utils';

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

  const gradientClass = platformColors[platform] || 'from-gray-500 to-gray-600';
  const displayName = platformNames[platform] || platform;

  return (
    <div className="flex items-center gap-4">
      {/* Platform name */}
      <div className="w-28 text-right">
        <span className="text-white font-medium">{displayName}</span>
      </div>

      {/* Bar container */}
      <div className="flex-1 bg-white/5 rounded-full h-8 relative overflow-hidden border border-white/10">
        {/* Animated bar */}
        <div
          className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3`}
          style={{ width: `${animatedWidth}%` }}
        >
          {animatedWidth > 20 && (
            <span className="text-white text-sm font-semibold">{score}</span>
          )}
        </div>
      </div>

      {/* Score number (outside bar if bar is too small) */}
      <div className="w-12 text-left">
        {animatedWidth <= 20 && (
          <span className="text-white text-sm font-semibold">{score}</span>
        )}
      </div>
    </div>
  );
}
