import React from 'react';

interface SimpleGiftIconProps {
  emoji: string;
  size?: number;
}

export const SimpleGiftIcon: React.FC<SimpleGiftIconProps> = ({
  emoji,
  size = 48
}) => {
  return (
    <div
      className="flex items-center justify-center transition-transform hover:scale-110"
      style={{ fontSize: `${size}px` }}
    >
      {emoji}
    </div>
  );
};
