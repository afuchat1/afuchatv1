import { useMemo } from 'react';

interface DefaultAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

// Generate a consistent color based on the name
const getColorFromName = (name: string): string => {
  const colors = [
    'hsl(200, 98%, 39%)', // Blue
    'hsl(142, 76%, 36%)', // Green
    'hsl(262, 83%, 58%)', // Purple
    'hsl(346, 77%, 50%)', // Red
    'hsl(24, 100%, 50%)', // Orange
    'hsl(173, 80%, 40%)', // Teal
    'hsl(280, 67%, 55%)', // Violet
    'hsl(45, 93%, 47%)',  // Yellow
  ];
  
  // Create a hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const DefaultAvatar = ({ name, size = 40, className = '' }: DefaultAvatarProps) => {
  const initials = useMemo(() => {
    if (!name || name.trim() === '') return '?';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }, [name]);

  const backgroundColor = useMemo(() => getColorFromName(name), [name]);
  
  const fontSize = size * 0.4;

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        fontSize: `${fontSize}px`,
      }}
    >
      {initials}
    </div>
  );
};
