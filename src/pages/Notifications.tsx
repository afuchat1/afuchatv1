import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames

// Define the notification type
export interface Notification {
  id: string;
  created_at: string;
  type: 'new_follower' | 'new_like' | 'new_reply' | 'new_mention';
  is_read: boolean;
  post_id: string;
  actor: {
    display_name: string;
    handle: string;
  };
  post?: {
    content: string;
  };
}

// --- Component for a single notification row ---
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
    switch (type) {
      case 'new_like':
        return <><span className="font-semibold">{actor.display_name}</span> liked your post</>;
      case 'new_reply':
        return <><span className="font-semibold">{actor.display_name}</span> replied to your post</>;
      case 'new_follower':
        return <><span className="font-semibold">{actor.display_name}</span> started following you</>;
      default:
        return 'New notification';
    }
  };

  // Link to the user's profile for a follow, or the post for a like/reply
  const linkTo = type === 'new_follower' ? `/profile/${actor.handle}` : `/post/${notification.post_id}`;

  return (
    <Link to={linkTo} className="block">
      <div className={cn(
        "flex items-start gap-4 p-4 border-b border-border transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-primary/5" // Highlight unread
      )}>
        <div className="mt-1">{renderIcon()}</div>
        <div className="flex-1">
          <p className="text-sm text-foreground">{renderMessage()}</p>
          {/* Show a snippet of the post if it's a like or reply */}
          {post?.content && (
            <p className="text-sm text-muted-foreground mt-1 p-2 border border-border rounded-md">
              {post.content.substring(0, 100)}...
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(created_at).toLocaleString('en-UG')}
          </p>
        </div>
      </div>
    </Link>
  );
};

// --- The main Notifications Page Component ---
const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const markAsRead = async () => {
    if (!user) return;
    try {
      await supabase.rpc('mark_notifications_as_read');
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
      setLoading(true);
      try {
        
        // --- THIS IS THE CORRECTED QUERY ---
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id, created_at, type, is_read, post_id,
            actor:actor_id ( display_name, handle ),
            post:post_id ( content )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        // ------------------------------------

        if (error) throw error;
        setNotifications(data as any);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const timer = setTimeout(markAsRead, 1500); 
    return () => clearTimeout(timer);

  }, [user]);
  
  if (loading) {
    // Skeleton loading state
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <h1 className="text-xl font-extrabold text-foreground">Notifications</h1>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h1 className="text-xl font-extrabold text-foreground">Notifications</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground p-8">No notifications yet.</p>
        ) : (
          notifications.map(n => <NotificationRow key={n.id} notification={n} />)
        )}
      </div>
    </div>
  );
};

export default Notifications;
