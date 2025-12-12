import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  showSuccess?: boolean;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  progress,
  showSuccess = false,
}: PullToRefreshIndicatorProps) => {
  const isVisible = pullDistance > 0 || isRefreshing || showSuccess;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none pt-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            height: isRefreshing || showSuccess ? 60 : Math.max(pullDistance, 40),
          }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            opacity: { duration: 0.2 }
          }}
        >
          <motion.div
            className={`flex items-center justify-center h-11 w-11 rounded-full shadow-lg backdrop-blur-md border transition-colors duration-300 ${
              showSuccess 
                ? 'bg-green-500/20 border-green-500/30' 
                : progress >= 1 
                  ? 'bg-primary/20 border-primary/40' 
                  : 'bg-background/80 border-border/50'
            }`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: showSuccess ? 1.1 : isRefreshing ? 1 : Math.max(0.7, Math.min(1, 0.7 + progress * 0.3)),
              opacity: 1,
              rotate: showSuccess ? 0 : isRefreshing ? 0 : progress * 180,
            }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
          >
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Check className="h-5 w-5 text-green-500" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="refresh"
                  animate={{
                    rotate: isRefreshing ? 360 : 0,
                  }}
                  transition={{
                    rotate: isRefreshing
                      ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
                      : { duration: 0 },
                  }}
                >
                  <RefreshCw
                    className={`h-5 w-5 transition-colors duration-200 ${
                      progress >= 1 ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    strokeWidth={2.5}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Pull progress text */}
          <AnimatePresence>
            {!isRefreshing && !showSuccess && pullDistance > 30 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`ml-3 text-xs font-medium transition-colors duration-200 ${
                  progress >= 1 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </motion.span>
            )}
            {isRefreshing && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 text-xs font-medium text-primary"
              >
                Refreshing...
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
