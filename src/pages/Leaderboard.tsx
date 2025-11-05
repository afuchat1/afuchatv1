import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GradeBadge, type Grade } from '@/components/gamification/GradeBadge';
import { Trophy, TrendingUp, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface LeaderboardUser {
  id: string;
  display_name: string;
  handle: string;
  xp: number;
  current_grade: Grade;
  is_verified: boolean;
  is_organization_verified: boolean;
}

const Leaderboard = () => {
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardUser[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    // All-time leaderboard
    const { data: allTime } = await supabase
      .from('profiles')
      .select('id, display_name, handle, xp, current_grade, is_verified, is_organization_verified')
      .order('xp', { ascending: false })
      .limit(50);

    // Weekly leaderboard (users who gained XP in the last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weeklyActivity } = await supabase
      .from('user_activity_log')
      .select('user_id, xp_earned')
      .gte('created_at', weekAgo.toISOString());

    // Aggregate weekly XP
    const weeklyXP = (weeklyActivity || []).reduce((acc, activity) => {
      acc[activity.user_id] = (acc[activity.user_id] || 0) + activity.xp_earned;
      return acc;
    }, {} as Record<string, number>);

    // Get profiles for top weekly earners
    const topWeeklyUsers = Object.entries(weeklyXP)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([userId]) => userId);

    const { data: weekly } = await supabase
      .from('profiles')
      .select('id, display_name, handle, xp, current_grade, is_verified, is_organization_verified')
      .in('id', topWeeklyUsers);

    if (weekly) {
      const sortedWeekly = weekly.sort((a, b) => 
        (weeklyXP[b.id] || 0) - (weeklyXP[a.id] || 0)
      ).map(user => ({ ...user, current_grade: user.current_grade as Grade }));
      setWeeklyLeaders(sortedWeekly);
    }
    
    setAllTimeLeaders((allTime || []).map(user => ({ ...user, current_grade: user.current_grade as Grade })));
    setLoading(false);
  };

  const LeaderboardList = ({ users }: { users: LeaderboardUser[] }) => (
    <div className="space-y-2">
      {users.map((user, index) => (
        <Card
          key={user.id}
          className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
            index < 3 ? 'border-primary/50' : ''
          }`}
          onClick={() => navigate(`/profile/${user.id}`)}
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
              index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
              index === 1 ? 'bg-gray-400/20 text-gray-400' :
              index === 2 ? 'bg-orange-500/20 text-orange-500' :
              'bg-muted text-muted-foreground'
            }`}>
              {index < 3 ? <Trophy className="h-5 w-5" /> : index + 1}
            </div>
            
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
              <User className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{user.display_name}</h3>
                <GradeBadge grade={user.current_grade} size="sm" animated={false} />
              </div>
              <p className="text-xs text-muted-foreground">@{user.handle}</p>
            </div>

            <div className="text-right">
              <div className="font-bold text-primary">{user.xp.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">Top XP earners on AfuChat</p>
      </div>

      <Tabs defaultValue="all-time" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-time">
            <Trophy className="h-4 w-4 mr-2" />
            All Time
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <TrendingUp className="h-4 w-4 mr-2" />
            This Week
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-time" className="mt-6">
          <LeaderboardList users={allTimeLeaders} />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          {weeklyLeaders.length > 0 ? (
            <LeaderboardList users={weeklyLeaders} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity this week yet. Be the first!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;