import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useMemo } from 'react';

interface AdsterraNativeAdCardProps {
  index: number;
}

export const AdsterraNativeAdCard = ({ index }: AdsterraNativeAdCardProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  
  // Generate unique container ID for this ad instance
  const containerId = useMemo(() => `adsterra-native-${index}`, [index]);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    try {
      console.log(`[AdsterraNativeAdCard] Loading Adsterra native ad script for ${containerId}`);
      
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = '//pl28165526.effectivegatecpm.com/3938e39e573566edcbbdc1594b4b1324/invoke.js';
      
      script.onload = () => {
        console.log(`[AdsterraNativeAdCard] Adsterra native ad script loaded for ${containerId}`);
      };
      
      script.onerror = () => {
        console.error(`[AdsterraNativeAdCard] Failed to load Adsterra native ad script for ${containerId}`);
      };

      if (adRef.current) {
        adRef.current.appendChild(script);
      }
      
      scriptLoadedRef.current = true;
    } catch (err) {
      console.error('[AdsterraNativeAdCard] Adsterra native ad error:', err);
    }
  }, [containerId]);

  return (
    <div className="border-b border-border p-4 bg-background/50 backdrop-blur-sm">
      {/* Ad Content - seamlessly integrated */}
      <div ref={adRef} className="relative">
        <div id={containerId}></div>
        
        {/* Sponsored Label - right side */}
        <div className="absolute top-0 right-0 flex items-center gap-1.5 z-10">
          <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
          <Badge variant="secondary" className="text-[10px] font-medium bg-muted/60 text-muted-foreground border-0 backdrop-blur-sm">
            Sponsored
          </Badge>
        </div>
      </div>
    </div>
  );
};
