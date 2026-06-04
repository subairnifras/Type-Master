import React from 'react';
import { Award } from 'lucide-react';

interface TierBadgeProps {
  wpm: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface TierInfo {
  name: string;
  color: string;
  glow: string;
  gradient: string;
}

export function getTierInfo(wpm: number): TierInfo {
  if (wpm < 30) {
    return {
      name: 'Bronze',
      color: '#b45309', // Amber-700
      glow: 'rgba(180, 83, 9, 0.4)',
      gradient: 'linear-gradient(135deg, #b45309, #d97706)',
    };
  }
  if (wpm < 50) {
    return {
      name: 'Silver',
      color: '#94a3b8', // Slate-400
      glow: 'rgba(148, 163, 184, 0.4)',
      gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
    };
  }
  if (wpm < 70) {
    return {
      name: 'Gold',
      color: '#fbbf24', // Yellow-400
      glow: 'rgba(251, 191, 36, 0.5)',
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    };
  }
  if (wpm < 90) {
    return {
      name: 'Platinum',
      color: '#38bdf8', // Sky-400
      glow: 'rgba(56, 189, 248, 0.5)',
      gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    };
  }
  if (wpm < 110) {
    return {
      name: 'Diamond',
      color: '#06b6d4', // Cyan-500
      glow: 'rgba(6, 182, 212, 0.6)',
      gradient: 'linear-gradient(135deg, #0891b2, #06b6d4, #a78bfa)',
    };
  }
  if (wpm < 130) {
    return {
      name: 'Master',
      color: '#d946ef', // Fuchsia-500
      glow: 'rgba(217, 70, 239, 0.7)',
      gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef, #ec4899)',
    };
  }
  return {
    name: 'Grandmaster',
    color: '#ef4444', // Red-500
    glow: 'rgba(239, 68, 68, 0.8)',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316, #eab308)',
  };
}

export default function TierBadge({ wpm, showText = true, size = 'md' }: TierBadgeProps) {
  const tier = getTierInfo(wpm);

  const sizeStyles = {
    sm: {
      padding: '4px 8px',
      fontSize: '0.75rem',
      iconSize: 12,
      gap: '4px',
    },
    md: {
      padding: '6px 12px',
      fontSize: '0.85rem',
      iconSize: 16,
      gap: '6px',
    },
    lg: {
      padding: '10px 20px',
      fontSize: '1.1rem',
      iconSize: 22,
      gap: '8px',
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        padding: currentSize.padding,
        borderRadius: 'var(--border-radius-full)',
        background: tier.gradient,
        color: '#ffffff',
        fontWeight: 700,
        fontSize: currentSize.fontSize,
        boxShadow: `0 0 15px ${tier.glow}, 0 4px 6px rgba(0, 0, 0, 0.2)`,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <Award size={currentSize.iconSize} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
      {showText && <span>{tier.name}</span>}
    </div>
  );
}
