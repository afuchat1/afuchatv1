import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

// Adsterra native ad card using official container ID snippet
// This component assumes Adsterra will fill the container when the script runs.
export const AdsterraNativeAdCard = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the script only once globally
    const globalKey = '__adsterra_native_loaded__';
    const w = window as any;

    if (!w[globalKey]) {
      try {
        console.log('[AdsterraNativeAdCard] Loading Adsterra native script');
        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = '//pl28165526.effectivegatecpm.com/3938e39e573566edcbbdc1594b4b1324/invoke.js';

        script.onload = () => {
          console.log('[AdsterraNativeAdCard] Native script loaded');
        };

        script.onerror = () => {
          console.error('[AdsterraNativeAdCard] Failed to load native script');
        };

        document.body.appendChild(script);
        w[globalKey] = true;
      } catch (err) {
        console.error('[AdsterraNativeAdCard] Error injecting script', err);
      }
    }
  }, []);

  return (
    <div className="border-b border-border p-4 bg-background/50 backdrop-blur-sm">
      {/* Ad Content - seamlessly integrated */}
      <div ref={adRef} className="relative">
        {/* Official Adsterra native container ID */}
        <div id="container-3938e39e573566edcbbdc1594b4b1324" />

        {/* Sponsored Label - right side */}
        <div className="absolute top-0 right-0 flex items-center gap-1.5 z-10">
          <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
          <Badge
            variant="secondary"
            className="text-[10px] font-medium bg-muted/60 text-muted-foreground border-0 backdrop-blur-sm"
          >
            Sponsored
          </Badge>
        </div>
      </div>
    </div>
  );
};
