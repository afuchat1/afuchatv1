import { Crown, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PremiumBadgeProps {
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function PremiumBadge({ size = 'md', showLabel = true }: PremiumBadgeProps) {
  const { tier, isVIP, isPremium } = useSubscription();

  if (!isPremium) return null;

  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  const Icon = isVIP ? Crown : Sparkles;

  return (
    <Badge 
      variant={isVIP ? 'default' : 'secondary'}
      className={`${
        isVIP 
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
      } text-white border-0`}
    >
      <Icon className={iconSize} />
      {showLabel && <span className="ml-1">{isVIP ? 'VIP' : 'Premium'}</span>}
    </Badge>
  );
}
