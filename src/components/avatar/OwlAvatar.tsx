import React from 'react';
import { OwlAvatarConfig, DEFAULT_AVATAR_CONFIG } from '@/types/avatar';
import { EnhancedOwlBody } from './EnhancedOwlBody';
import { OwlEyes } from './OwlEyes';
import { OwlBeak } from './OwlBeak';
import { OwlAccessories } from './OwlAccessories';

interface OwlAvatarProps {
  config?: Partial<OwlAvatarConfig>;
  size?: number;
  className?: string;
}

export const OwlAvatar: React.FC<OwlAvatarProps> = ({ 
  config = {}, 
  size = 120,
  className = '' 
}) => {
  const fullConfig: OwlAvatarConfig = { ...DEFAULT_AVATAR_CONFIG, ...config };
  
  // Calculate feather color (darker shade of body)
  const featherColor = fullConfig.featherColor || adjustColor(fullConfig.color, -20);
  
  // Background gradient
  const getBackground = () => {
    switch (fullConfig.background) {
      case 'gradient':
        return `url(#owlGradient-${size})`;
      case 'light':
        return '#f8fafc';
      case 'transparent':
        return 'transparent';
      default:
        return '#f8fafc';
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`owl-avatar ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`owlGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
        
        {/* Enhanced shadow filter */}
        <filter id={`shadow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Sparkle effect for premium avatars */}
        <filter id={`sparkle-${size}`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow"/>
          <feBlend in="SourceGraphic" in2="glow"/>
        </filter>
      </defs>

      {/* Background with subtle animation on gradient backgrounds */}
      <rect 
        width="120" 
        height="120" 
        fill={getBackground()} 
        rx="60"
        className={fullConfig.background === 'gradient' ? 'animate-pulse' : ''}
        style={{ animationDuration: '3s' }}
      />

      {/* Owl body with enhanced shadow and filter */}
      <g filter={`url(#shadow-${size})`}>
        <EnhancedOwlBody 
          color={fullConfig.color} 
          featherColor={featherColor}
        />
        
        {/* Eyes */}
        <OwlEyes 
          type={fullConfig.eyes}
          eyeColor={fullConfig.eyeColor || '#1a1a1a'}
        />
        
        {/* Beak */}
        <OwlBeak emotion={fullConfig.emotion} />
        
        {/* Accessories with sparkle effect */}
        <g filter={`url(#sparkle-${size})`}>
          <OwlAccessories accessories={fullConfig.accessories} />
        </g>
      </g>
    </svg>
  );
};

// Utility to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const clamp = (val: number) => Math.min(Math.max(val, 0), 255);
  
  const num = parseInt(color.replace('#', ''), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00FF) + amount);
  const b = clamp((num & 0x0000FF) + amount);
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

