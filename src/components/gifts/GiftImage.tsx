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

  const sizeClasses = {
    xs: 'w-4 h-4 sm:w-6 sm:h-6',
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
        animate={{
          rotateY: [0, 360],
        }}
        transition={{
          rotateY: {
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }
        }}
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
