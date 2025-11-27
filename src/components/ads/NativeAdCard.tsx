import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface NativeAdCardProps {
  slot: string;
}

export const NativeAdCard = ({ slot }: NativeAdCardProps) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <Card className="p-4 mb-4 border border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-xs font-semibold">
          Sponsored
        </Badge>
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </div>
      
      <div ref={adRef} className="min-h-[100px]">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-6547165240467026"
          data-ad-slot={slot}
          data-ad-format="fluid"
          data-full-width-responsive="true"
        />
      </div>
    </Card>
  );
};
