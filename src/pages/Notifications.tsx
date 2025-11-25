import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TwitterVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1d9bf0" />
  </svg>
);

const GoldVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#FFD43B" />
  </svg>
);

const VerifiedBadge = ({ isVerified, isOrgVerified }: { isVerified?: boolean; isOrgVerified?: boolean }) => {
  if (isOrgVerified) return <GoldVerifiedBadge />;
  if (isVerified) return <TwitterVerifiedBadge />;
  return null;
};

export interface Notification {
  id: string;
  created_at: string;
  type: 'new_follower' | 'new_like' | 'new_reply' | 'new_mention' | 'gift';
  is_read: boolean;
  post_id: string;
  actor: {
    display_name: string;
    handle: string;
    is_verified?: boolean;
    is_organization_verified?: boolean;
  };
  post?: {
    content: string;
  };
}

const NotificationRow = ({ notification }: { notification: Notification }) => {
  const { actor, post, type, created_at } = notification;

  const renderIcon = () => {
    switch (type) {
      case 'new_like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'new_reply':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'new_follower':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const renderMessage = () => {
    const ActorLink = (
      <Link 
        to={`/profile/${actor.handle}`} 
        className="font-semibold hover:underline flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {actor.display_name}
        <VerifiedBadge isVerified={actor.is_verified} isOrgVerified={actor.is_organization_verified} />
      </Link>
    );

    switch (type) {
      case 'new_like':
        return <div className="flex flex-wrap items-center gap-1">{ActorLink} liked your post</div>;
      case 'new_reply':
        return <div className="flex flex-wrap items-center gap-1">{ActorLink} replied to your post</div>;
      case 'new_follower':
        return <div className="flex flex-wrap items-center gap-1">{ActorLink} started following you</div>;
      default:
        return 'New notification';
    }
  };
  
  return (
    <div className={cn(
      "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border-b border-border relative",
      !notification.is_read && "bg-primary/5"
    )}>
      <div className="mt-1 flex-shrink-0">{renderIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm text-foreground">{renderMessage()}</div>
        
        {type === 'new_follower' && (
          <Link to={`/profile/${actor.handle}`} className="absolute inset-0" aria-label={`View ${actor.display_name}'s profile`} />
        )}

        {post?.content && (
          <Link 
            to={`/post/${notification.post_id}`} 
            className="block relative z-10"
          >
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 p-2 border border-border rounded-md hover:bg-muted/50 transition-colors">
              {post.content.substring(0, 100)}...
            </p>
          </Link>
        )}
        
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
          {new Date(created_at).toLocaleString('en-UG')}
        </p>
      </div>
    </div>
  );
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const markAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.rpc('mark_notifications_as_read');
      if (error) {
        console.error('Error marking notifications as read:', error);
        return;
      }
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      // Load cached notifications first
      const cachedNotifications = sessionStorage.getItem('cachedNotifications');
      if (cachedNotifications) {
        try {
          setNotifications(JSON.parse(cachedNotifications));
          setLoading(false);
        } catch (e) {
          console.error('Failed to parse cached notifications:', e);
        }
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id, created_at, type, is_read, post_id,
            actor:profiles!actor_id ( display_name, handle, is_verified, is_organization_verified ),
            post:posts!post_id ( content )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notifications:', error);
        } else if (data) {
          setNotifications(data);
          sessionStorage.setItem('cachedNotifications', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel('notifications-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    const timer = setTimeout(markAsRead, 1500); 
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };

  }, [user]);
  
  if (loading && notifications.length === 0) {
    return (
      <div className="h-full flex items-center justify-center max-w-4xl mx-auto">
        <CustomLoader size="lg" text="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="p-3 sm:p-4 md:p-5">
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground p-6 sm:p-8 text-xs sm:text-sm">No notifications yet.</p>
        ) : (
          notifications.map(n => <NotificationRow key={n.id} notification={n} />)
        )}
      </div>
    </div>
  );
};

export default Notifications;
