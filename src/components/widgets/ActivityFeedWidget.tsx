import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, UserPlus, Gift } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ActivityFeedWidgetProps {
  className?: string;
}

export const ActivityFeedWidget = ({ className }: ActivityFeedWidgetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-feed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          created_at,
          post_id,
          actor:profiles!notifications_actor_id_fkey(
            id,
            display_name,
            handle,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30000
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like': return Heart;
      case 'reply': return MessageCircle;
      case 'follow': return UserPlus;
      case 'gift': return Gift;
      default: return Heart;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'like': return 'text-red-500';
      case 'reply': return 'text-blue-500';
      case 'follow': return 'text-emerald-500';
      case 'gift': return 'text-pink-500';
      default: return 'text-muted-foreground';
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'like': return 'liked your post';
      case 'reply': return 'replied to your post';
      case 'follow': return 'followed you';
      case 'gift': return 'sent you a gift';
      default: return 'interacted with you';
    }
  };

  if (!user) return null;

  return (
    <Card className={cn('p-4 bg-card/50 backdrop-blur-sm border-border/50', className)}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ))
        ) : activities?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          activities?.map((activity: any) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 cursor-pointer hover:bg-accent/30 p-2 -mx-2 rounded-lg transition-colors"
                onClick={() => activity.post_id ? navigate(`/post/${activity.post_id}`) : activity.actor?.handle && navigate(`/profile/${activity.actor.handle}`)}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.actor?.avatar_url || ''} />
                    <AvatarFallback>{activity.actor?.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={cn('absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background', getActivityColor(activity.type))}>
                    <Icon className="h-2.5 w-2.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-semibold">{activity.actor?.display_name}</span>{' '}
                    <span className="text-muted-foreground">{getActivityText(activity.type)}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
