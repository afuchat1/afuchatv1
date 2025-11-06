import React from 'react';

interface EnhancedOwlBodyProps {
  color: string;
  featherColor: string;
}

export const EnhancedOwlBody: React.FC<EnhancedOwlBodyProps> = ({ 
  color, 
  featherColor 
}) => {
  return (
    <g>
      {/* Enhanced body with gradient and texture */}
      <defs>
        <radialGradient id={`bodyGradient-${color}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="70%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={featherColor} stopOpacity="1" />
        </radialGradient>
        
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Feather texture pattern */}
        <pattern id={`featherPattern-${color}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 5 5 Q 7 10, 5 15" stroke={featherColor} strokeWidth="1" fill="none" opacity="0.2"/>
          <path d="M 10 5 Q 12 10, 10 15" stroke={featherColor} strokeWidth="1" fill="none" opacity="0.2"/>
          <path d="M 15 5 Q 17 10, 15 15" stroke={featherColor} strokeWidth="1" fill="none" opacity="0.2"/>
        </pattern>
      </defs>

      {/* Main body with enhanced gradient */}
      <ellipse 
        cx="60" 
        cy="70" 
        rx="35" 
        ry="40" 
        fill={`url(#bodyGradient-${color})`}
        filter="url(#softGlow)"
      />
      
      {/* Feather texture overlay */}
      <ellipse 
        cx="60" 
        cy="70" 
        rx="35" 
        ry="40" 
        fill={`url(#featherPattern-${color})`}
      />

      {/* Wing hints with subtle animation */}
      <g className="opacity-70">
        {/* Left wing */}
        <path
          d="M 30 65 Q 20 70, 25 80 Q 28 75, 30 70 Z"
          fill={featherColor}
          opacity="0.5"
        />
        {/* Right wing */}
        <path
          d="M 90 65 Q 100 70, 95 80 Q 92 75, 90 70 Z"
          fill={featherColor}
          opacity="0.5"
        />
      </g>

      {/* Belly patch with lighter color */}
      <ellipse
        cx="60"
        cy="80"
        rx="20"
        ry="25"
        fill="white"
        opacity="0.2"
      />

      {/* Subtle shine effect */}
      <ellipse
        cx="50"
        cy="60"
        rx="15"
        ry="20"
        fill="white"
        opacity="0.15"
      />
    </g>
  );
};
