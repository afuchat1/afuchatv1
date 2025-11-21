import { useGiftImage } from '@/hooks/useGiftImage';
import { Skeleton } from '@/components/ui/skeleton';

interface GiftImageProps {
  giftId: string;
  giftName: string;
  emoji: string;
  rarity: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GiftImage = ({ 
  giftId, 
  giftName, 
  emoji, 
  rarity, 
  size = 'md',
  className = '' 
}: GiftImageProps) => {
  const { imageUrl, isLoading, error } = useGiftImage(giftId, giftName, emoji, rarity);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const sizeClass = sizeClasses[size];

  // Always show emoji first, then overlay the image when loaded
  return (
    <div className={`${sizeClass} ${className} relative flex items-center justify-center`}>
      {/* Emoji - always visible as fallback */}
      <span 
        className={`text-5xl drop-shadow-lg transition-opacity duration-300 ${
          imageUrl && !error ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {emoji}
      </span>
      
      {/* Generated image - fades in when loaded */}
      {imageUrl && !error && (
        <img 
          src={imageUrl}
          alt={giftName}
          className="absolute inset-0 w-full h-full object-contain animate-fade-in"
          loading="lazy"
        />
      )}
    </div>
  );
};
