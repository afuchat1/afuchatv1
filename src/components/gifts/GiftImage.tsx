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

  if (isLoading) {
    return <Skeleton className={`${sizeClass} rounded-lg ${className}`} />;
  }

  if (error || !imageUrl) {
    // Fallback to emoji with styled background
    return (
      <div 
        className={`${sizeClass} ${className} flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-border/50`}
      >
        <span className="text-4xl">{emoji}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} ${className} relative`}>
      <img 
        src={imageUrl}
        alt={giftName}
        className="w-full h-full object-contain drop-shadow-lg animate-fade-in"
        loading="lazy"
      />
    </div>
  );
};
