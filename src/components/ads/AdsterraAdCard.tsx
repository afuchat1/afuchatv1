import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const AdsterraAdCard = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[AdsterraAdCard] Loading Adsterra native ad script');
    // Load Adsterra script dynamically
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = '//pl28165526.effectivegatecpm.com/3938e39e573566edcbbdc1594b4b1324/invoke.js';
    
    script.onload = () => {
      console.log('[AdsterraAdCard] Adsterra script loaded successfully');
    };
    
    script.onerror = () => {
      console.error('[AdsterraAdCard] Failed to load Adsterra script');
    };
    
    if (adRef.current) {
      adRef.current.appendChild(script);
    }

    return () => {
      if (adRef.current && script.parentNode === adRef.current) {
        adRef.current.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="border-b border-border p-4 bg-accent/5 backdrop-blur-sm">
      {/* Adsterra Ad Content */}
      <div ref={adRef} className="min-h-[120px] relative">
        <div id="container-3938e39e573566edcbbdc1594b4b1324"></div>
        {/* Sponsored Label - right side */}
        <div className="absolute top-0 right-0 flex items-center gap-1.5">
          <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
          <Badge variant="secondary" className="text-[10px] font-medium bg-accent/40 text-accent-foreground border border-accent/20 backdrop-blur-sm">
            Sponsored
          </Badge>
        </div>
      </div>
    </div>
  );
};
