import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BusinessBadge = ({ size = 'md', className }: BusinessBadgeProps) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-blue-500/10 p-1',
        className
      )}
      title="Business Account"
    >
      <Building2 className={cn('text-blue-600', sizeClasses[size])} />
    </div>
  );
};
