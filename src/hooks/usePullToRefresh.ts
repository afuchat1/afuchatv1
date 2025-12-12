import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
  successMessage?: string;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 70,
  maxPull = 140,
  disabled = false,
  successMessage = 'Refreshed!',
}: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const startY = useRef(0);
  const currentPullDistance = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const rafId = useRef<number>();
  const velocityRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Keep ref updated
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Smooth spring animation for releasing
  const animatePullBack = useCallback(() => {
    const animate = () => {
      const current = currentPullDistance.current;
      if (current <= 0.5) {
        currentPullDistance.current = 0;
        setPullDistance(0);
        return;
      }
      
      // Spring physics - ease back to 0
      const springForce = current * 0.15;
      currentPullDistance.current = current - springForce;
      setPullDistance(Math.max(0, currentPullDistance.current));
      
      rafId.current = requestAnimationFrame(animate);
    };
    
    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of page
      if (window.scrollY <= 5 && !isRefreshingRef.current) {
        startY.current = e.touches[0].pageY;
        lastYRef.current = e.touches[0].pageY;
        lastTimeRef.current = Date.now();
        isPullingRef.current = true;
        velocityRef.current = 0;
        
        // Cancel any existing animation
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshingRef.current) return;

      const currentY = e.touches[0].pageY;
      const currentTime = Date.now();
      
      // Calculate velocity for smoother feel
      const deltaTime = currentTime - lastTimeRef.current;
      if (deltaTime > 0) {
        velocityRef.current = (currentY - lastYRef.current) / deltaTime;
      }
      lastYRef.current = currentY;
      lastTimeRef.current = currentTime;
      
      // Apply resistance curve for more natural feel
      const rawDistance = currentY - startY.current;
      const resistance = 0.5; // Higher = more resistance
      const resistedDistance = rawDistance > 0 
        ? Math.pow(rawDistance, 1 - resistance * 0.3) * 2
        : 0;
      
      const distance = Math.min(Math.max(0, resistedDistance), maxPull);

      if (distance > 0 && window.scrollY <= 5) {
        e.preventDefault();
        currentPullDistance.current = distance;
        
        // Use RAF for smooth 60fps updates
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

      if (distance >= threshold && !isRefreshingRef.current) {
        // Trigger refresh
        setIsRefreshing(true);
        isRefreshingRef.current = true;
        
        // Keep indicator visible during refresh
        currentPullDistance.current = 60;
        setPullDistance(60);
        
        try {
          await onRefreshRef.current();
          
          // Show success state
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
          }, 800);
          
        } catch (error) {
          console.error('Pull to refresh error:', error);
          toast.error('Failed to refresh');
        } finally {
          setIsRefreshing(false);
          isRefreshingRef.current = false;
          
          // Animate back to 0
          currentPullDistance.current = 60;
          animatePullBack();
        }
      } else {
        // Didn't reach threshold, spring back
        animatePullBack();
      }
      
      startY.current = 0;
      velocityRef.current = 0;
    };

    const options: AddEventListenerOptions = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [disabled, maxPull, threshold, animatePullBack]);

  const progress = Math.min(pullDistance / threshold, 1);

  // Manual refresh trigger
  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    setIsRefreshing(true);
    isRefreshingRef.current = true;
    setPullDistance(60);
    
    try {
      await onRefreshRef.current();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 800);
    } catch (error) {
      console.error('Manual refresh error:', error);
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
      animatePullBack();
    }
  }, [animatePullBack]);

  return {
    isPulling: isPullingRef.current,
    isRefreshing,
    pullDistance,
    progress,
    showSuccess,
    refresh,
  };
};
