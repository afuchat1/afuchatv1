import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Sparkles, TrendingUp } from 'lucide-react';
import { GiftImage } from './GiftImage';

interface Gift {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  base_xp_cost: number;
  rarity: string;
  season: string | null;
  current_price?: number;
  total_sent?: number;
  price_multiplier?: number;
}

interface GiftPreviewModalProps {
  gift: Gift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendGift?: () => void;
}

export const GiftPreviewModal = ({ gift, open, onOpenChange, onSendGift }: GiftPreviewModalProps) => {
  const [isRotating, setIsRotating] = useState(true);

  if (!gift) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'epic': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'rare': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'uncommon': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'shadow-[0_0_80px_rgba(234,179,8,0.4)]';
      case 'epic': return 'shadow-[0_0_60px_rgba(168,85,247,0.4)]';
      case 'rare': return 'shadow-[0_0_40px_rgba(59,130,246,0.4)]';
      case 'uncommon': return 'shadow-[0_0_30px_rgba(34,197,94,0.3)]';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-background via-background to-primary/5">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 rounded-full bg-background/80 backdrop-blur hover:bg-background"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* 3D Preview Section */}
          <div className="relative h-96 flex items-center justify-center p-8 perspective-1000">
            <div
              className={`relative ${isRotating ? 'animate-[spin_8s_linear_infinite]' : ''}`}
              style={{ transformStyle: 'preserve-3d' }}
              onMouseEnter={() => setIsRotating(false)}
              onMouseLeave={() => setIsRotating(true)}
            >
              <div className={`relative ${getRarityGlow(gift.rarity)}`}>
                <GiftImage
                  giftId={gift.id}
                  giftName={gift.name}
                  emoji={gift.emoji}
                  rarity={gift.rarity}
                  size="xl"
                  className="transform-gpu transition-transform duration-500 hover:scale-110"
                />
              </div>
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-4 border-t border-border bg-background/50 backdrop-blur">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    {gift.name}
                    <Badge className={`${getRarityColor(gift.rarity)} text-xs`}>
                      {gift.rarity}
                    </Badge>
                  </DialogTitle>
                  {gift.description && (
                    <p className="text-sm text-muted-foreground">{gift.description}</p>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="text-xs text-muted-foreground mb-1">Price</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {(gift.current_price || gift.base_xp_cost).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">Nexa</span>
                  {gift.price_multiplier && gift.price_multiplier !== 1 && (
                    <Badge variant="secondary" className="ml-auto">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {((gift.price_multiplier - 1) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>

              {gift.total_sent !== undefined && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-xs text-muted-foreground mb-1">Total Sent</div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">
                      {gift.total_sent.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Season info */}
            {gift.season && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">🎄 Seasonal Item</span>
                  <Badge variant="outline" className="text-xs">
                    {gift.season}
                  </Badge>
                </div>
              </div>
            )}

            {/* Action button */}
            {onSendGift && (
              <Button
                onClick={onSendGift}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Send This Gift
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
