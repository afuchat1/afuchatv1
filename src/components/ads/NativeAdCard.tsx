import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface NativeAdCardProps {
  slot: string;
}

export const NativeAdCard = ({ slot }: NativeAdCardProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      
      // Check if ad loaded after a short delay
      const checkAdLoad = setTimeout(() => {
        if (adRef.current) {
          const ins = adRef.current.querySelector('ins');
          // Check if AdSense populated the ad slot
          if (ins && ins.getAttribute('data-ad-status') === 'filled') {
            setAdLoaded(true);
          } else if (ins && ins.clientHeight > 0) {
            // Fallback: check if ad has height
            setAdLoaded(true);
          }
        }
      }, 1000);

      return () => clearTimeout(checkAdLoad);
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  // Don't render anything if ad didn't load
  if (!adLoaded) {
    return null;
  }

  return (
    <div className="border-b border-border p-4">
      {/* Sponsored Label - subtle and matches feed style */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-[10px] font-medium bg-muted/50 text-muted-foreground border-0">
          Sponsored
        </Badge>
        <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
      </div>
      
      {/* Ad Content - seamlessly integrated */}
      <div ref={adRef} className="min-h-[120px]">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-6547165240467026"
          data-ad-slot={slot}
          data-ad-format="fluid"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
