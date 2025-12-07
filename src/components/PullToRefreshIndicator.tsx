import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  progress,
}: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        height: pullDistance,
        maxHeight: 120,
      }}
      animate={{
        opacity: pullDistance > 10 ? 1 : 0,
      }}
    >
      <motion.div
        className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 backdrop-blur-sm"
        animate={{
          rotate: isRefreshing ? 360 : progress * 180,
          scale: Math.max(0.8, Math.min(1, progress)),
        }}
        transition={{
          rotate: isRefreshing
            ? { repeat: Infinity, duration: 1, ease: 'linear' }
            : { duration: 0 },
        }}
      >
        <RefreshCw
          className={`h-5 w-5 text-primary ${isRefreshing ? '' : ''}`}
        />
      </motion.div>
    </motion.div>
  );
};
