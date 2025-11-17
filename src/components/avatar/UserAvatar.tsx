import { DefaultAvatar } from './DefaultAvatar';
import { OwlAvatar } from './OwlAvatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';

interface UserAvatarProps {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  showOwlFallback?: boolean;
}

export const UserAvatar = ({ 
  userId, 
  name, 
  avatarUrl, 
  size = 40, 
  className = '',
  showOwlFallback = false 
}: UserAvatarProps) => {
  const { avatarConfig } = useUserAvatar(userId);

  // Priority: avatar_url > DefaultAvatar > OwlAvatar (if enabled)
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (name) {
    return <DefaultAvatar name={name} size={size} className={className} />;
  }

  if (showOwlFallback) {
    return <OwlAvatar config={avatarConfig} size={size} className={className} />;
  }

  return <DefaultAvatar name="?" size={size} className={className} />;
};
