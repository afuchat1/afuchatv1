import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export const UserAvatar = memo(({ userId, avatarUrl, name, size = 40, className = '' }: UserAvatarProps) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar style={{ width: size, height: size }} className={className}>
      <AvatarImage 
        src={avatarUrl || undefined} 
        alt={name}
        loading="lazy"
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
});