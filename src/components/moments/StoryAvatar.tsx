import { memo, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserStories } from '@/hooks/useUserStories';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface StoryAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStoryRing?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  sm: 'h-6 w-6 sm:h-7 sm:w-7',
  md: 'h-8 w-8 sm:h-10 sm:w-10',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20 sm:h-28 sm:w-28'
};

const ringMap = {
  sm: 'p-[1.5px]',
  md: 'p-[2px]',
  lg: 'p-[2px]',
  xl: 'p-[2.5px]'
};

export const StoryAvatar = memo(({
  userId,
  avatarUrl,
  name,
  size = 'md',
  className = '',
  showStoryRing = true,
  onClick
}: StoryAvatarProps) => {
  const { hasActiveStories } = useUserStories(userId);
  const navigate = useNavigate();

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }

    if (hasActiveStories && showStoryRing) {
      e.stopPropagation();
      navigate(`/moments?user=${userId}`);
    }
  }, [onClick, hasActiveStories, showStoryRing, navigate, userId]);

  const initials = name?.substring(0, 2).toUpperCase() || '';

  const avatarContent = (
    <Avatar className={cn(sizeMap[size], 'flex-shrink-0')}>
      <AvatarImage 
        src={avatarUrl || undefined} 
        alt={name}
        loading="lazy"
      />
      <AvatarFallback className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (hasActiveStories && showStoryRing) {
    return (
      <div
        className={cn(
          'rounded-full bg-gradient-to-tr from-cyan-400 to-teal-500 cursor-pointer transition-all duration-200 hover:scale-105',
          ringMap[size],
          className
        )}
        onClick={handleClick}
      >
        {avatarContent}
      </div>
    );
  }

  return (
    <div className={className} onClick={handleClick}>
      {avatarContent}
    </div>
  );
});
