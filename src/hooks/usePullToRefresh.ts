import { useState, useRef, useEffect, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
}: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const startY = useRef(0);
  const currentPullDistance = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const rafId = useRef<number>();

  // Keep ref updated
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !isRefreshingRef.current) {
        startY.current = e.touches[0].pageY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshingRef.current) return;

      const currentY = e.touches[0].pageY;
      const distance = Math.min(Math.max(0, currentY - startY.current), maxPull);

      if (distance > 0 && window.scrollY <= 0) {
        e.preventDefault();
        currentPullDistance.current = distance;
        
        // Use RAF for smooth updates
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }
        rafId.current = requestAnimationFrame(() => {
          setPullDistance(currentPullDistance.current);
        });
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;

      const distance = currentPullDistance.current;
      isPullingRef.current = false;
      currentPullDistance.current = 0;

      if (distance >= threshold && !isRefreshingRef.current) {
        setIsRefreshing(true);
        isRefreshingRef.current = true;
        
        try {
          await onRefreshRef.current();
        } catch (error) {
          console.error('Pull to refresh error:', error);
        } finally {
          setIsRefreshing(false);
          isRefreshingRef.current = false;
        }
      }
      
      setPullDistance(0);
      startY.current = 0;
    };

    const options: AddEventListenerOptions = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [disabled, maxPull, threshold]);

  const progress = Math.min(pullDistance / threshold, 1);

  return {
    isPulling: isPullingRef.current,
    isRefreshing,
    pullDistance,
    progress,
  };
};
