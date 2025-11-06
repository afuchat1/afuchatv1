import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, Gift, TrendingUp, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GradeBadge, type Grade } from '@/components/gamification/GradeBadge';
import { OwlAvatar } from '@/components/avatar/OwlAvatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';

const UserAvatar = ({ userId }: { userId: string }) => {
  const { avatarConfig } = useUserAvatar(userId);
  return <OwlAvatar config={avatarConfig} size={40} />;
};

interface LeaderUser {
  id: string;
  display_name: string;
  handle: string;
  xp: number;
  current_grade: Grade;
  is_verified?: boolean;
  total_xp_spent?: number;
  total_gifts_sent?: number;
  total_gifts_received?: number;
}

type TimeFilter = 'week' | 'month' | 'all-time';

const GiftLeaderboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [senderLeaders, setSenderLeaders] = useState<LeaderUser[]>([]);
  const [receiverLeaders, setReceiverLeaders] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  useEffect(() => {
    fetchLeaderboards();
  }, [timeFilter]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date | null = null;

      if (timeFilter === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Fetch top senders
      let sendersQuery = supabase
        .from('gift_transactions')
        .select('sender_id, xp_cost');

      if (startDate) {
        sendersQuery = sendersQuery.gte('created_at', startDate.toISOString());
      }

      const { data: senderData } = await sendersQuery;

      // Aggregate sender data
      const senderMap = new Map<string, { totalXP: number; count: number }>();
      senderData?.forEach((tx) => {
        const current = senderMap.get(tx.sender_id) || { totalXP: 0, count: 0 };
        senderMap.set(tx.sender_id, {
          totalXP: current.totalXP + tx.xp_cost,
          count: current.count + 1,
        });
      });

      // Get top 10 senders
      const topSenders = Array.from(senderMap.entries())
        .sort((a, b) => b[1].totalXP - a[1].totalXP)
        .slice(0, 10);

      // Fetch sender profiles
      if (topSenders.length > 0) {
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, handle, xp, current_grade, is_verified')
          .in('id', topSenders.map(([id]) => id));

        const sendersWithStats = senderProfiles?.map((profile) => {
          const stats = senderMap.get(profile.id)!;
          return {
            ...profile,
            current_grade: profile.current_grade as Grade,
            total_xp_spent: stats.totalXP,
            total_gifts_sent: stats.count,
          };
        }) || [];

        setSenderLeaders(sendersWithStats);
      } else {
        setSenderLeaders([]);
      }

      // Fetch top receivers
      let receiversQuery = supabase
        .from('gift_transactions')
        .select('receiver_id, xp_cost');

      if (startDate) {
        receiversQuery = receiversQuery.gte('created_at', startDate.toISOString());
      }

      const { data: receiverData } = await receiversQuery;

      // Aggregate receiver data
      const receiverMap = new Map<string, { totalXP: number; count: number }>();
      receiverData?.forEach((tx) => {
        const current = receiverMap.get(tx.receiver_id) || { totalXP: 0, count: 0 };
        receiverMap.set(tx.receiver_id, {
          totalXP: current.totalXP + tx.xp_cost,
          count: current.count + 1,
        });
      });

      // Get top 10 receivers
      const topReceivers = Array.from(receiverMap.entries())
        .sort((a, b) => b[1].totalXP - a[1].totalXP)
        .slice(0, 10);

      // Fetch receiver profiles
      if (topReceivers.length > 0) {
        const { data: receiverProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, handle, xp, current_grade, is_verified')
          .in('id', topReceivers.map(([id]) => id));

        const receiversWithStats = receiverProfiles?.map((profile) => {
          const stats = receiverMap.get(profile.id)!;
          return {
            ...profile,
            current_grade: profile.current_grade as Grade,
            total_gifts_received: stats.count,
            total_xp_spent: stats.totalXP,
          };
        }) || [];

        setReceiverLeaders(receiversWithStats);
      } else {
        setReceiverLeaders([]);
      }
    } catch (error) {
      console.error('Error fetching gift leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const LeaderboardList = ({ users, type }: { users: LeaderUser[]; type: 'sender' | 'receiver' }) => {
    return (
      <div className="space-y-2">
        {users.map((user, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <Card
              key={user.id}
              className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                isTopThree ? 'border-primary/50 bg-primary/5' : ''
              }`}
              onClick={() => navigate(`/${user.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                  {rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                  {rank === 2 && <Trophy className="h-4 w-4 text-gray-400" />}
                  {rank === 3 && <Trophy className="h-4 w-4 text-orange-600" />}
                  {rank > 3 && <span className="text-muted-foreground">{rank}</span>}
                </div>

                <UserAvatar userId={user.id} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold truncate">{user.display_name}</span>
                    {user.is_verified && (
                      <svg viewBox="0 0 22 22" className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0]">
                        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>@{user.handle}</span>
                    <GradeBadge grade={user.current_grade} size="sm" />
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    {type === 'sender' && <TrendingUp className="h-3 w-3" />}
                    {type === 'receiver' && <Star className="h-3 w-3" />}
                    {user.total_xp_spent?.toLocaleString() || 0} XP
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {type === 'sender' && `${user.total_gifts_sent} ${t('giftLeaderboard.giftsSent')}`}
                    {type === 'receiver' && `${user.total_gifts_received} ${t('giftLeaderboard.giftsReceived')}`}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('giftLeaderboard.noActivity')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {t('giftLeaderboard.title')}
            </h1>
            <p className="text-xs text-muted-foreground">{t('giftLeaderboard.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={timeFilter === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('week')}
          >
            {t('giftLeaderboard.thisWeek')}
          </Button>
          <Button
            variant={timeFilter === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('month')}
          >
            {t('giftLeaderboard.thisMonth')}
          </Button>
          <Button
            variant={timeFilter === 'all-time' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('all-time')}
          >
            {t('giftLeaderboard.allTime')}
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="senders">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="senders" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('giftLeaderboard.topSenders')}
              </TabsTrigger>
              <TabsTrigger value="receivers" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                {t('giftLeaderboard.topReceivers')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="senders">
              <LeaderboardList users={senderLeaders} type="sender" />
            </TabsContent>

            <TabsContent value="receivers">
              <LeaderboardList users={receiverLeaders} type="receiver" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default GiftLeaderboard;
