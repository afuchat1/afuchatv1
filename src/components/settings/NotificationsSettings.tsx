import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, MessageSquare, Heart, UserPlus, Gift, AtSign } from 'lucide-react';
import EnableNotificationsButton from '@/components/EnableNotificationsButton';

export const NotificationsSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [likeNotifs, setLikeNotifs] = useState(true);
  const [followNotifs, setFollowNotifs] = useState(true);
  const [giftNotifs, setGiftNotifs] = useState(true);
  const [mentionNotifs, setMentionNotifs] = useState(true);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Push Notifications</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Enable push notifications to receive alerts even when the app is closed
        </p>
        <EnableNotificationsButton />
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">In-App Notifications</p>
              </div>
              <p className="text-sm text-muted-foreground">Show notifications while using the app</p>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Activity Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Messages</p>
              </div>
              <p className="text-sm text-muted-foreground">New messages and replies</p>
            </div>
            <Switch checked={messageNotifs} onCheckedChange={setMessageNotifs} />
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Likes & Reactions</p>
              </div>
              <p className="text-sm text-muted-foreground">When someone likes your post</p>
            </div>
            <Switch checked={likeNotifs} onCheckedChange={setLikeNotifs} />
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">New Followers</p>
              </div>
              <p className="text-sm text-muted-foreground">When someone follows you</p>
            </div>
            <Switch checked={followNotifs} onCheckedChange={setFollowNotifs} />
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Gifts & Tips</p>
              </div>
              <p className="text-sm text-muted-foreground">When you receive gifts or tips</p>
            </div>
            <Switch checked={giftNotifs} onCheckedChange={setGiftNotifs} />
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Mentions</p>
              </div>
              <p className="text-sm text-muted-foreground">When someone mentions you</p>
            </div>
            <Switch checked={mentionNotifs} onCheckedChange={setMentionNotifs} />
          </div>
        </div>
      </Card>
    </div>
  );
};
