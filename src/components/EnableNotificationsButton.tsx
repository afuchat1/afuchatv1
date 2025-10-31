import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Helper function to convert the VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// The main component
const EnableNotificationsButton = () => {
  const { user } = useAuth();
  
  // Read the public key from your .env file
  const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  const handleSubscribe = async () => {
    if (!user || !VAPID_PUBLIC_KEY) {
      toast.error("Error: Client configuration missing.");
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("Push notifications are not supported by this browser.");
      return;
    }

    try {
      // 1. Get permission from the user
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted');
      }

      // 2. Get the service worker
      const registration = await navigator.serviceWorker.ready;

      // 3. Get the push subscription from the browser
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4. Save the subscription to our 'push_subscriptions' table
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          subscription: subscription.toJSON(),
        });

      if (error) throw error;

      toast.success('Push notifications enabled!');

    } catch (err) {
      console.error('Failed to subscribe to push:', err);
      toast.error('Failed to enable push notifications.');
    }
  };

  return (
    <Button onClick={handleSubscribe}>
      Enable Push Notifications
    </Button>
  );
};

export default EnableNotificationsButton;
