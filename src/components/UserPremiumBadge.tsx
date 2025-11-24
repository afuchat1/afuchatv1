import { Crown } from 'lucide-react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

interface UserPremiumBadgeProps {
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserPremiumBadge = ({ userId, size = 'md', className = '' }: UserPremiumBadgeProps) => {
  const { isPremium, loading } = usePremiumStatus(userId);

  if (loading || !isPremium) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={`inline-flex items-center ${className}`} title="Premium Member">
      <Crown className={`${sizeClasses[size]} text-amber-500 fill-amber-500/20`} />
    </div>
  );
};
