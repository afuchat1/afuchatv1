import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const BusinessBadge = ({ size = 'md', className, showLabel = false }: BusinessBadgeProps) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (showLabel) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20',
          className
        )}
        title="Verified Business Account"
      >
        <Briefcase className={cn('text-blue-600', sizeClasses[size])} />
        <span className="text-xs font-semibold text-blue-600">Business</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-1 border border-blue-500/20',
        className
      )}
      title="Verified Business Account"
    >
      <Briefcase className={cn('text-blue-600', sizeClasses[size])} />
    </div>
  );
};
