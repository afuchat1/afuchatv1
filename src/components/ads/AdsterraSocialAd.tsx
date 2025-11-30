import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const AdsterraSocialAd = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('[AdsterraSocialAd] Loading Adsterra social ad script');
    // Load Adsterra social ad script dynamically
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//pl28165504.effectivegatecpm.com/c8/c1/df/c8c1df713e04eeb218462e699ebdd685.js';
    
    script.onload = () => {
      console.log('[AdsterraSocialAd] Adsterra social ad script loaded successfully');
    };
    
    script.onerror = () => {
      console.error('[AdsterraSocialAd] Failed to load Adsterra social ad script');
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
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Adsterra Social Ad Content */}
      <div ref={adRef} className="relative p-4 min-h-[100px]">
        {/* Sponsored Label - right side */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
          <Badge variant="secondary" className="text-[10px] font-medium bg-accent/40 text-accent-foreground border border-accent/20 backdrop-blur-sm">
            Sponsored
          </Badge>
        </div>
      </div>
    </div>
  );
};
