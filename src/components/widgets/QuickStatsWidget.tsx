import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coins, Bell, MessageSquare, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface QuickStatsWidgetProps {
  className?: string;
}

export const QuickStatsWidget = ({ className }: QuickStatsWidgetProps) => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['quick-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [profileRes, notificationsRes, messagesRes, followersRes] = await Promise.all([
        supabase.from('profiles').select('xp, acoin').eq('id', user.id).single(),
        supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_read', false),
        supabase.from('messages').select('id', { count: 'exact' }).eq('chat_id', user.id).is('read_at', null),
        supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id)
      ]);

      return {
        nexa: profileRes.data?.xp || 0,
        acoin: profileRes.data?.acoin || 0,
        notifications: notificationsRes.count || 0,
        unreadMessages: messagesRes.count || 0,
        followers: followersRes.count || 0
      };
    },
    enabled: !!user?.id,
    staleTime: 30000
  });

  if (!user) return null;

  const statItems = [
    { icon: Coins, label: 'Nexa', value: stats?.nexa || 0, color: 'text-primary' },
    { icon: Bell, label: 'Alerts', value: stats?.notifications || 0, color: 'text-amber-500' },
    { icon: MessageSquare, label: 'Messages', value: stats?.unreadMessages || 0, color: 'text-blue-500' },
    { icon: Users, label: 'Followers', value: stats?.followers || 0, color: 'text-emerald-500' }
  ];

  return (
    <Card className={cn('p-4 bg-card/50 backdrop-blur-sm border-border/50', className)}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))
        ) : (
          statItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn('p-2 rounded-lg bg-background/50', item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value.toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
