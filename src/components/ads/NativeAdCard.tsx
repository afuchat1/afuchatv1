import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

interface NativeAdCardProps {
  slot: string;
}

export const NativeAdCard = ({ slot }: NativeAdCardProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const { isPremium, loading } = usePremiumStatus();

  useEffect(() => {
    // Don't load ads for premium users
    if (isPremium || loading) return;

    try {
      console.log('[NativeAdCard] Initializing AdSense for slot:', slot);
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log('[NativeAdCard] AdSense push successful');
    } catch (err) {
      console.error('[NativeAdCard] AdSense error:', err);
    }
  }, [slot, isPremium, loading]);

  // Don't render ads for premium users
  if (loading || isPremium) {
    return null;
  }

  return (
    <div className="border-b border-border p-4 bg-background/50 backdrop-blur-sm">
      {/* Ad Content - seamlessly integrated */}
      <div ref={adRef} className="relative">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-6547165240467026"
          data-ad-slot={slot}
          data-ad-format="fluid"
          data-full-width-responsive="true"
        />
        {/* Sponsored Label - right side */}
        <div className="absolute top-0 right-0 flex items-center gap-1.5">
          <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
          <Badge variant="secondary" className="text-[10px] font-medium bg-muted/60 text-muted-foreground border-0 backdrop-blur-sm">
            Sponsored
          </Badge>
        </div>
      </div>
    </div>
  );
};
