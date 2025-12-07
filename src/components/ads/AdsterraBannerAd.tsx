import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

export const AdsterraBannerAd = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const { isPremium, loading } = usePremiumStatus();

  useEffect(() => {
    // Don't load ads for premium users
    if (isPremium || loading) return;

    console.log('[AdsterraBannerAd] Loading Adsterra banner ad script');
    
    // Set up atOptions configuration
    // @ts-ignore
    window.atOptions = {
      'key': '5da10adaf8215e79d435ad6104d7c874',
      'format': 'iframe',
      'height': 250,
      'width': 300,
      'params': {}
    };

    // Load Adsterra banner ad script dynamically
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//www.highperformanceformat.com/5da10adaf8215e79d435ad6104d7c874/invoke.js';
    
    script.onload = () => {
      console.log('[AdsterraBannerAd] Adsterra banner ad script loaded successfully');
    };
    
    script.onerror = () => {
      console.error('[AdsterraBannerAd] Failed to load Adsterra banner ad script');
    };
    
    if (adRef.current) {
      adRef.current.appendChild(script);
    }

    return () => {
      if (adRef.current && script.parentNode === adRef.current) {
        adRef.current.removeChild(script);
      }
    };
  }, [isPremium, loading]);

  // Don't render ads for premium users
  if (loading || isPremium) {
    return null;
  }

  return (
    <div className="border-b border-border p-4 bg-accent/5 backdrop-blur-sm">
      {/* Adsterra Banner Ad Content */}
      <div ref={adRef} className="relative min-h-[250px] flex items-center justify-center">
        {/* Sponsored Label - right side */}
        <div className="absolute top-0 right-0 flex items-center gap-1.5 z-10">
          <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
          <Badge variant="secondary" className="text-[10px] font-medium bg-accent/40 text-accent-foreground border border-accent/20 backdrop-blur-sm">
            Sponsored
          </Badge>
        </div>
      </div>
    </div>
  );
};
