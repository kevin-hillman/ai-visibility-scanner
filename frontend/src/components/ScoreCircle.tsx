'use client';

import { useEffect, useState } from 'react';
import { getScoreColor, getScoreLabel } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ScoreCircle({ score, size = 200, label }: ScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = score / 60;
      const interval = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, 16);
      return () => clearInterval(interval);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const scoreColorClass = getScoreColor(score);
  const strokeColor = score >= 70 ? '#10b981' : score >= 40 ? '#eab308' : '#f43f5e';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth={strokeWidth} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl font-semibold ${scoreColorClass}`}>{animatedScore}</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">von 100</div>
        </div>
      </div>
      {label && (
        <div className="mt-4 text-center">
          <div className="text-gray-600 dark:text-gray-300 font-medium">{label}</div>
          <div className={`text-sm font-medium mt-1 ${scoreColorClass}`}>{getScoreLabel(score)}</div>
        </div>
      )}
    </div>
  );
}
