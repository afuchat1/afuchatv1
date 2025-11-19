import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffiliatedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const AffiliatedBadge = ({ size = 'md', className, onClick }: AffiliatedBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 font-medium text-primary hover:bg-primary/20 transition-colors',
        sizeClasses[size],
        className
      )}
      title="Business Affiliate - Click for details"
    >
      <Building2 className={iconSizeClasses[size]} />
      Affiliated
    </button>
  );
};
