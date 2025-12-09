import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquare, Heart, UserPlus, Gift, AtSign, Mail, Moon, Clock, Bell, BellRing, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export const NotificationsSettings = () => {
  const { user } = useAuth();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [loading, setLoading] = useState(true);
  
  // Email preferences
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailMessages, setEmailMessages] = useState(true);
  const [emailLikes, setEmailLikes] = useState(true);
  const [emailFollows, setEmailFollows] = useState(true);
  const [emailGifts, setEmailGifts] = useState(true);
  const [emailMentions, setEmailMentions] = useState(true);
  const [emailReplies, setEmailReplies] = useState(true);
  const [emailDigestFrequency, setEmailDigestFrequency] = useState<string>('instant');
  
  // Quiet hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  const handleEnablePushNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Push notifications enabled!');
    } else {
      toast.error('Permission denied. Please enable notifications in your browser settings.');
    }
  };

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Email preferences
        setEmailEnabled(data.email_enabled);
        setEmailMessages(data.email_messages);
        setEmailLikes(data.email_likes);
        setEmailFollows(data.email_follows);
        setEmailGifts(data.email_gifts);
        setEmailMentions(data.email_mentions);
        setEmailReplies(data.email_replies);
        setEmailDigestFrequency(data.email_digest_frequency);
        
        // Quiet hours
        setQuietHoursEnabled(data.quiet_hours_enabled);
        setQuietHoursStart(data.quiet_hours_start?.slice(0, 5) || '22:00');
        setQuietHoursEnd(data.quiet_hours_end?.slice(0, 5) || '08:00');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: any) => {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-muted-foreground">Loading preferences...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BellRing className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">Push Notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Receive notifications on your device
            </p>
          </div>
        </div>

        {!isSupported ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported in this browser
            </p>
          </div>
        ) : permission === 'granted' ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-600 dark:text-green-400">
              Push notifications are enabled. You'll receive alerts for new messages, likes, follows, and more.
            </p>
          </div>
        ) : permission === 'denied' ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-destructive">
                Push notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enable push notifications to get instant alerts for new messages, likes, follows, gifts, and mentions directly on your device.
            </p>
            <Button onClick={handleEnablePushNotifications} className="w-full gap-2">
              <Bell className="h-4 w-4" />
              Enable Push Notifications
            </Button>
          </div>
        )}
      </Card>

      {/* Email Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">Email Notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Receive notifications via email
            </p>
          </div>
          <Switch 
            checked={emailEnabled} 
            onCheckedChange={(checked) => {
              setEmailEnabled(checked);
              updatePreferences({ email_enabled: checked });
            }} 
          />
        </div>

        {emailEnabled && (
          <>
            <div className="space-y-4 mb-6">
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">Messages</p>
                  </div>
                  <p className="text-sm text-muted-foreground">New direct messages</p>
                </div>
                <Switch 
                  checked={emailMessages} 
                  onCheckedChange={(checked) => {
                    setEmailMessages(checked);
                    updatePreferences({ email_messages: checked });
                  }} 
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">Likes & Reactions</p>
                  </div>
                  <p className="text-sm text-muted-foreground">When someone likes your post</p>
                </div>
                <Switch 
                  checked={emailLikes} 
                  onCheckedChange={(checked) => {
                    setEmailLikes(checked);
                    updatePreferences({ email_likes: checked });
                  }} 
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">New Followers</p>
                  </div>
                  <p className="text-sm text-muted-foreground">When someone follows you</p>
                </div>
                <Switch 
                  checked={emailFollows} 
                  onCheckedChange={(checked) => {
                    setEmailFollows(checked);
                    updatePreferences({ email_follows: checked });
                  }} 
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">Gifts & Tips</p>
                  </div>
                  <p className="text-sm text-muted-foreground">When you receive gifts or tips</p>
                </div>
                <Switch 
                  checked={emailGifts} 
                  onCheckedChange={(checked) => {
                    setEmailGifts(checked);
                    updatePreferences({ email_gifts: checked });
                  }} 
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">Mentions</p>
                  </div>
                  <p className="text-sm text-muted-foreground">When someone mentions you</p>
                </div>
                <Switch 
                  checked={emailMentions} 
                  onCheckedChange={(checked) => {
                    setEmailMentions(checked);
                    updatePreferences({ email_mentions: checked });
                  }} 
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">Replies</p>
                  </div>
                  <p className="text-sm text-muted-foreground">When someone replies to your post</p>
                </div>
                <Switch 
                  checked={emailReplies} 
                  onCheckedChange={(checked) => {
                    setEmailReplies(checked);
                    updatePreferences({ email_replies: checked });
                  }} 
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="digest-frequency" className="text-sm font-semibold mb-3 block">
                Email Digest Frequency
              </Label>
              <Select 
                value={emailDigestFrequency} 
                onValueChange={(value) => {
                  setEmailDigestFrequency(value);
                  updatePreferences({ email_digest_frequency: value });
                }}
              >
                <SelectTrigger id="digest-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant (as they happen)</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                  <SelectItem value="never">Never (disable all email)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Moon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">Quiet Hours</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Pause notifications during specific hours
            </p>
          </div>
          <Switch 
            checked={quietHoursEnabled} 
            onCheckedChange={(checked) => {
              setQuietHoursEnabled(checked);
              updatePreferences({ quiet_hours_enabled: checked });
            }} 
          />
        </div>

        {quietHoursEnabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="quiet-start" className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Start Time
                </Label>
                <input
                  id="quiet-start"
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => {
                    setQuietHoursStart(e.target.value);
                    updatePreferences({ quiet_hours_start: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-md border bg-background"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="quiet-end" className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  End Time
                </Label>
                <input
                  id="quiet-end"
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => {
                    setQuietHoursEnd(e.target.value);
                    updatePreferences({ quiet_hours_end: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-md border bg-background"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You won't receive push notifications between {quietHoursStart} and {quietHoursEnd}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
