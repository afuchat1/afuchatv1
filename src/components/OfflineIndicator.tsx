import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export const OfflineIndicator = () => {
  const { isOnline, isOfflineReady } = useOfflineStatus();
  const [showOfflineAlert, setShowOfflineAlert] = useState(!navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
      setShowOnlineToast(false);
    } else if (showOfflineAlert) {
      // User just came back online
      setShowOfflineAlert(false);
      setShowOnlineToast(true);
      // Hide online toast after 3 seconds
      const timer = setTimeout(() => setShowOnlineToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineAlert]);

  return (
    <>
      <AnimatePresence>
        {showOfflineAlert && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 shadow-lg"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <WifiOff className="h-5 w-5" />
              </motion.div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-sm font-semibold">You're Offline</span>
                <span className="text-xs opacity-80">
                  {isOfflineReady 
                    ? "Using cached data - browse freely!" 
                    : "Limited functionality available"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnlineToast && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white shadow-lg"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3">
              <Wifi className="h-5 w-5" />
              <span className="text-sm font-semibold">Back Online!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
