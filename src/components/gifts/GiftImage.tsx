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
    return (
      <div className={`${sizeClass} ${className} flex items-center justify-center`}>
        <Skeleton className={`${sizeClass} rounded-lg`} />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`${sizeClass} ${className} flex items-center justify-center`}>
        <span className="drop-shadow-lg text-5xl">{emoji}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} ${className} flex items-center justify-center`}>
      <img 
        src={imageUrl} 
        alt={giftName}
        className={`${sizeClass} object-contain drop-shadow-lg`}
      />
    </div>
  );
};
