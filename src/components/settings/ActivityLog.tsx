import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Calendar, TrendingUp, Trophy, MessageSquare, Gift, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface ActivityLogEntry {
  id: string;
  action_type: string;
  xp_earned: number;
  created_at: string;
  metadata: any;
}

export const ActivityLog = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalXP: 0,
    todayXP: 0,
    weekXP: 0,
  });

  useEffect(() => {
    if (user) {
      loadActivityLog();
    }
  }, [user]);

  const loadActivityLog = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setActivities(data || []);

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalXP = data?.reduce((sum, act) => sum + (act.xp_earned || 0), 0) || 0;
      const todayXP = data
        ?.filter(act => new Date(act.created_at) >= todayStart)
        .reduce((sum, act) => sum + (act.xp_earned || 0), 0) || 0;
      const weekXP = data
        ?.filter(act => new Date(act.created_at) >= weekStart)
        .reduce((sum, act) => sum + (act.xp_earned || 0), 0) || 0;

      setStats({ totalXP, todayXP, weekXP });
    } catch (error) {
      console.error('Error loading activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'daily_login': return Calendar;
      case 'tip_sent':
      case 'tip_received': return Gift;
      case 'post_created': return MessageSquare;
      case 'referral_reward': return Trophy;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'daily_login': return 'bg-blue-500/10 text-blue-500';
      case 'tip_sent': return 'bg-red-500/10 text-red-500';
      case 'tip_received': return 'bg-green-500/10 text-green-500';
      case 'post_created': return 'bg-purple-500/10 text-purple-500';
      case 'referral_reward': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getActivityLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-muted-foreground">Loading activity log...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total XP Earned</p>
              <p className="text-2xl font-bold">{stats.totalXP.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-bold">{stats.todayXP.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{stats.weekXP.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Log */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Recent Activity</h3>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No activity yet</p>
            ) : (
              activities.map((activity) => {
                const Icon = getActivityIcon(activity.action_type);
                const colorClass = getActivityColor(activity.action_type);

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">
                          {getActivityLabel(activity.action_type)}
                        </p>
                        <Badge variant={activity.xp_earned > 0 ? 'default' : 'secondary'}>
                          {activity.xp_earned > 0 ? '+' : ''}{activity.xp_earned} XP
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(activity.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
