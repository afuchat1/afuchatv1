import { Lock, UserX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PrivateProfileOverlayProps {
  handle: string;
  isFollowing?: boolean;
  onFollowRequest?: () => void;
}

export const PrivateProfileOverlay = ({ 
  handle, 
  isFollowing = false,
  onFollowRequest 
}: PrivateProfileOverlayProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="p-8 text-center bg-muted/30 border-dashed border-2 border-muted-foreground/20">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-muted/50">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">This Account is Private</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Follow @{handle} to see their posts, photos, and other content.
          </p>
        </div>
        {user ? (
          !isFollowing && onFollowRequest && (
            <Button 
              onClick={onFollowRequest}
              className="mt-2 rounded-full px-6"
            >
              Request to Follow
            </Button>
          )
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            className="mt-2 rounded-full px-6"
          >
            Sign in to Follow
          </Button>
        )}
        {isFollowing && (
          <p className="text-sm text-muted-foreground italic">
            Your follow request is pending approval
          </p>
        )}
      </div>
    </Card>
  );
};

// Masked placeholder for private profile data
export const PrivateDataPlaceholder = ({ type }: { type: 'avatar' | 'name' | 'bio' | 'stats' }) => {
  switch (type) {
    case 'avatar':
      return (
        <div className="w-full h-full rounded-full bg-muted/50 flex items-center justify-center">
          <UserX className="h-8 w-8 text-muted-foreground/50" />
        </div>
      );
    case 'name':
      return (
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />
          <Lock className="h-4 w-4 text-muted-foreground/50" />
        </div>
      );
    case 'bio':
      return (
        <div className="space-y-2 mt-3">
          <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
        </div>
      );
    case 'stats':
      return (
        <div className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-muted-foreground/50">Hidden</span>
        </div>
      );
    default:
      return null;
  }
};
