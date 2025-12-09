import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const permissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      permissionRef.current = currentPermission;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      permissionRef.current = result;
      console.log('Push notification permission:', result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions & { data?: { url?: string } }) => {
    // Check directly from browser API instead of state
    const currentPermission = 'Notification' in window ? Notification.permission : 'denied';
    
    if (!('Notification' in window) || currentPermission !== 'granted') {
      console.log('Cannot show notification - permission:', currentPermission);
      return null;
    }

    try {
      console.log('Showing notification:', title, options?.body);
      const notification = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: options?.tag || 'afuchat-notification',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;
    
    // Check permission directly from browser
    const currentPermission = 'Notification' in window ? Notification.permission : 'denied';
    if (currentPermission !== 'granted') {
      console.log('Push notifications not enabled, skipping subscription');
      return;
    }

    console.log('Setting up push notification subscriptions for user:', user.id);

    const channel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New notification received:', payload);
          const notification = payload.new as any;
          
          // Don't show if triggered by current user
          if (notification.actor_id === user.id) return;
          
          // Fetch actor details
          const { data: actor } = await supabase
            .from('profiles')
            .select('display_name, handle, avatar_url')
            .eq('id', notification.actor_id)
            .single();

          const actorName = actor?.display_name || actor?.handle || 'Someone';
          
          let title = 'AfuChat';
          let body = 'You have a new notification';
          let url = '/notifications';

          switch (notification.type) {
            case 'like':
              title = 'New Like';
              body = `${actorName} liked your post`;
              url = notification.post_id ? `/post/${notification.post_id}` : '/notifications';
              break;
            case 'follow':
              title = 'New Follower';
              body = `${actorName} started following you`;
              url = `/${notification.actor_id}`;
              break;
            case 'reply':
              title = 'New Reply';
              body = `${actorName} replied to your post`;
              url = notification.post_id ? `/post/${notification.post_id}` : '/notifications';
              break;
            case 'mention':
              title = 'New Mention';
              body = `${actorName} mentioned you in a post`;
              url = notification.post_id ? `/post/${notification.post_id}` : '/notifications';
              break;
            case 'gift':
              title = 'New Gift';
              body = `${actorName} sent you a gift`;
              url = '/gifts';
              break;
            case 'follow_request':
              title = 'Follow Request';
              body = `${actorName} wants to follow you`;
              url = '/notifications';
              break;
          }

          showNotification(title, {
            body,
            icon: actor?.avatar_url || '/favicon.png',
            tag: `notification-${notification.id}`,
            data: { url },
          });
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    // Also subscribe to new messages
    const messageChannel = supabase
      .channel('push-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('New message received for push:', payload);
          const message = payload.new as any;
          
          // Don't notify for own messages
          if (message.sender_id === user.id) return;
          
          // Check if user is part of this chat
          const { data: membership } = await supabase
            .from('chat_members')
            .select('id')
            .eq('chat_id', message.chat_id)
            .eq('user_id', user.id)
            .single();
          
          if (!membership) return;
          
          // Fetch sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name, handle, avatar_url')
            .eq('id', message.sender_id)
            .single();

          const senderName = sender?.display_name || sender?.handle || 'Someone';
          
          showNotification('New Message', {
            body: `${senderName}: ${message.encrypted_content.substring(0, 50)}${message.encrypted_content.length > 50 ? '...' : ''}`,
            icon: sender?.avatar_url || '/favicon.png',
            tag: `message-${message.id}`,
            data: { url: `/chat/${message.chat_id}` },
          });
        }
      )
      .subscribe((status) => {
        console.log('Message subscription status:', status);
      });

    return () => {
      console.log('Cleaning up push notification subscriptions');
      supabase.removeChannel(channel);
      supabase.removeChannel(messageChannel);
    };
  }, [user, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
};
