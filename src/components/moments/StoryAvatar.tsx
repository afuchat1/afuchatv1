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

export const StoryAvatar = ({
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

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }

    if (hasActiveStories && showStoryRing) {
      e.stopPropagation();
      navigate(`/moments?user=${userId}`);
    }
  };

  const avatarContent = (
    <Avatar className={cn(sizeMap[size], 'flex-shrink-0')}>
      <AvatarImage src={avatarUrl || undefined} alt={name} />
      <AvatarFallback className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
        {name?.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  if (hasActiveStories && showStoryRing) {
    return (
      <div
        className={cn(
          'rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 cursor-pointer transition-all duration-200 hover:scale-105',
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
};
