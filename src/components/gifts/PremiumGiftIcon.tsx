import React from 'react';

interface PremiumGiftIconProps {
  emoji: string;
  rarity: string;
  season?: string;
  size?: number;
}

export const PremiumGiftIcon: React.FC<PremiumGiftIconProps> = ({
  emoji,
  rarity,
  season,
  size = 64
}) => {
  const getRarityGradient = () => {
    switch (rarity) {
      case 'legendary':
        return 'from-purple-600 via-pink-600 to-yellow-500';
      case 'rare':
        return 'from-blue-500 via-cyan-500 to-teal-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getSeasonalEffect = () => {
    switch (season) {
      case 'Valentine':
        return (
          <div className="absolute inset-0 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute text-pink-400 opacity-40 animate-bounce"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${10 + i * 15}%`,
                  animationDelay: `${i * 0.2}s`,
                  fontSize: `${size * 0.15}px`
                }}
              >
                💕
              </div>
            ))}
          </div>
        );
      case 'Halloween':
        return (
          <div className="absolute inset-0">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute text-orange-500 opacity-30 animate-pulse"
                style={{
                  left: `${15 + i * 25}%`,
                  top: `${5 + i * 20}%`,
                  animationDelay: `${i * 0.3}s`,
                  fontSize: `${size * 0.1}px`
                }}
              >
                🦇
              </div>
            ))}
          </div>
        );
      case 'Christmas':
        return (
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute text-white opacity-50 animate-bounce"
                style={{
                  left: `${10 + i * 20}%`,
                  top: `${Math.random() * 70}%`,
                  animationDelay: `${i * 0.2}s`,
                  fontSize: `${size * 0.12}px`
                }}
              >
                ❄️
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${getRarityGradient()} opacity-20 blur-xl animate-pulse`}
      />
      
      {/* Seasonal effects */}
      {getSeasonalEffect()}
      
      {/* Gift container with shimmer */}
      <div className="relative">
        {rarity === 'legendary' && (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 animate-spin-slow opacity-30 blur-md" />
            <div className="absolute -inset-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                  style={{
                    left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                    top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}
        
        {rarity === 'rare' && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 animate-pulse opacity-25 blur-md" />
        )}
        
        {/* Main emoji */}
        <div
          className="relative drop-shadow-2xl transform hover:scale-110 transition-transform duration-300"
          style={{ fontSize: `${size * 0.6}px` }}
        >
          {emoji}
        </div>
      </div>
      
      {/* Sparkle effects for legendary */}
      {rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-300 animate-ping opacity-75"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.15}s`,
                fontSize: `${size * 0.15}px`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
