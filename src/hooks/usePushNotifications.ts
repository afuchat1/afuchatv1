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
