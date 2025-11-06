import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, TrendingUp, Award, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SimpleGiftIcon } from './SimpleGiftIcon';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GiftDetailsModalProps {
  gift: {
    id: string;
    name: string;
    emoji: string;
    base_xp_cost: number;
    rarity: string;
    description: string;
  };
  currentPrice: number;
  totalSent: number;
  priceMultiplier: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: () => void;
  onComboTap: () => void;
  loading: boolean;
  comboCount: number;
  totalCost: number;
  discount: number;
}

export const GiftDetailsModal = ({
  gift,
  currentPrice,
  totalSent,
  priceMultiplier,
  open,
  onOpenChange,
  onSend,
  onComboTap,
  loading,
  comboCount,
  totalCost,
  discount,
}: GiftDetailsModalProps) => {
  const { t } = useTranslation();

  // Mock price history data based on multiplier
  const priceHistory = [
    { time: '7d ago', price: gift.base_xp_cost },
    { time: '5d ago', price: Math.ceil(gift.base_xp_cost * 1.1) },
    { time: '3d ago', price: Math.ceil(gift.base_xp_cost * (priceMultiplier - 0.05)) },
    { time: 'Now', price: currentPrice },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'hsl(var(--chart-1))';
      case 'epic': return 'hsl(var(--chart-2))';
      case 'rare': return 'hsl(var(--chart-3))';
      case 'uncommon': return 'hsl(var(--chart-4))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{gift.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Gift Display */}
          <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
            <SimpleGiftIcon emoji={gift.emoji} size={80} />
            <Badge 
              className="text-xs font-semibold"
              style={{ backgroundColor: getRarityColor(gift.rarity) }}
            >
              <Award className="h-3 w-3 mr-1" />
              {gift.rarity.toUpperCase()}
            </Badge>
          </div>

          {/* Description */}
          {gift.description && (
            <p className="text-sm text-muted-foreground text-center px-2">
              {gift.description}
            </p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t('gifts.currentPrice')}
                </span>
              </div>
              <div className="text-lg font-bold text-primary">{currentPrice} XP</div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-3 w-3 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">
                  {t('gifts.popularity')}
                </span>
              </div>
              <div className="text-lg font-bold text-foreground">{totalSent}</div>
            </div>
          </div>

          {/* Price History Chart */}
          <div className="bg-muted/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold mb-3 text-center">{t('gifts.priceHistory')}</h4>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Combo Info */}
          {comboCount > 0 && (
            <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="text-center space-y-1">
                <div className="text-sm font-bold text-foreground">
                  {comboCount}x {gift.emoji}
                  {comboCount > 1 && <span className="text-primary ml-1">COMBO!</span>}
                </div>
                {discount > 0 && (
                  <div className="text-xs text-primary font-semibold">
                    {t('gifts.comboDiscount', { percent: (discount * 100).toFixed(0) })}
                  </div>
                )}
                <div className="text-base font-bold text-foreground">{totalCost} XP</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={onComboTap}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              {comboCount > 0 ? `+1 (${comboCount + 1}x)` : t('gifts.addToCombo')}
            </Button>
            <Button 
              onClick={onSend}
              disabled={loading || comboCount === 0}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('gifts.sending')}
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  {t('gifts.send')}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {t('gifts.tapToCombo')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
