import { useState } from 'react';
import { useGiftImage } from '@/hooks/useGiftImage';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface GiftImageProps {
  giftId: string;
  giftName: string;
  emoji: string;
  rarity: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const emojiSizes = {
    xs: 'text-xl',
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
    xl: 'text-9xl'
  };

  const sizeClass = sizeClasses[size];
  const emojiSize = emojiSizes[size];

  if (isLoading) {
    return (
      <div className={`${sizeClass} ${className} flex items-center justify-center`}>
        <Skeleton className={`${sizeClass} rounded-full`} />
      </div>
    );
  }

  if (error || !imageUrl || imgError) {
    return (
      <div className={`${sizeClass} ${className} flex items-center justify-center`}>
        <span className={`drop-shadow-lg ${emojiSize}`}>{emoji}</span>
      </div>
    );
  }

  return (
    <motion.div 
      className={`${sizeClass} ${className} flex items-center justify-center`}
      style={{ perspective: '1000px' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        y: [0, -5, 0]
      }}
      transition={{ 
        scale: { type: 'spring', stiffness: 300, damping: 20 },
        opacity: { duration: 0.3 },
        y: {
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }
      }}
    >
      <motion.img 
        src={imageUrl} 
        alt={giftName}
        className={`${sizeClass} object-contain drop-shadow-lg`}
        style={{ transformStyle: 'preserve-3d' }}
        onError={() => setImgError(true)}
        whileHover={{ 
          scale: 1.2,
          rotateX: 15,
          rotateZ: 5,
          transition: { type: 'spring', stiffness: 400, damping: 10 }
        }}
      />
    </motion.div>
  );
};
