import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-push')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new;
          
          // Check user's notification preferences before sending
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          // Check if push notifications are enabled globally
          if (!prefs?.push_enabled) return;

          // Check quiet hours
          if (prefs?.quiet_hours_enabled) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const start = prefs.quiet_hours_start?.slice(0, 5);
            const end = prefs.quiet_hours_end?.slice(0, 5);
            
            if (start && end) {
              // Check if current time is within quiet hours
              if (start < end) {
                // Normal case: start before end (e.g., 22:00 to 08:00)
                if (currentTime >= start && currentTime <= end) return;
              } else {
                // Wrap case: end before start (e.g., 22:00 to 02:00)
                if (currentTime >= start || currentTime <= end) return;
              }
            }
          }

          // Check specific notification type preferences
          const notifType = notification.type;
          if (
            (notifType === 'new_follower' && !prefs?.push_follows) ||
            (notifType === 'new_like' && !prefs?.push_likes) ||
            (notifType === 'new_reply' && !prefs?.push_replies) ||
            (notifType === 'new_mention' && !prefs?.push_mentions) ||
            (notifType === 'gift' && !prefs?.push_gifts)
          ) {
            return;
          }
          
          // Send push notification via edge function
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: user.id,
              title: getNotificationTitle(notification.type),
              body: getNotificationBody(notification),
              url: getNotificationUrl(notification),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};

function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    new_follower: 'New Follower',
    new_like: 'New Like',
    new_reply: 'New Reply',
    new_mention: 'New Mention',
  };
  return titles[type] || 'New Notification';
}

function getNotificationBody(notification: any): string {
  return 'You have a new notification on AfuChat';
}

function getNotificationUrl(notification: any): string {
  if (notification.post_id) {
    return `/post/${notification.post_id}`;
  }
  return '/notifications';
}
