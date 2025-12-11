import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, Eye, Heart, Phone, AlertCircle, CheckCircle, Clock, Ban, Timer, BarChart3, Trophy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PageHeader } from '@/components/PageHeader';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';

interface Eligibility {
  eligible: boolean;
  reason?: string;
  follower_count?: number;
  weekly_views?: number;
  current_followers?: number;
  current_views?: number;
}

interface Earning {
  id: string;
  amount_ugx: number;
  earned_date: string;
  engagement_score: number;
  views_count: number;
  likes_count: number;
}

interface Withdrawal {
  id: string;
  amount_ugx: number;
  phone_number: string;
  mobile_network: string;
  status: string;
  requested_at: string;
  processed_at: string | null;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface TopPost {
  id: string;
  content: string;
  view_count: number;
  likes_count: number;
  replies_count: number;
  created_at: string;
  engagement_score: number;
  total_views: number;
  total_likes: number;
  total_replies: number;
  total_engagement_score: number;
  days_active: number;
  estimated_total_earnings: number;
}

export default function CreatorEarnings() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState<string>('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSheetOpen, setWithdrawSheetOpen] = useState(false);
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isWeekendNow, setIsWeekendNow] = useState(false);

  // Calculate countdown to next weekend or end of weekend
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = day === 0 || day === 6;
      setIsWeekendNow(isWeekend);

      let targetDate: Date;

      if (isWeekend) {
        // Weekend active - countdown to Sunday midnight (end of weekend)
        if (day === 6) {
          // Saturday - target is end of Sunday (Monday 00:00)
          targetDate = new Date(now);
          targetDate.setDate(now.getDate() + 2);
          targetDate.setHours(0, 0, 0, 0);
        } else {
          // Sunday - target is Monday 00:00
          targetDate = new Date(now);
          targetDate.setDate(now.getDate() + 1);
          targetDate.setHours(0, 0, 0, 0);
        }
      } else {
        // Weekday - countdown to Saturday 00:00
        const daysUntilSaturday = (6 - day + 7) % 7 || 7;
        targetDate = new Date(now);
        targetDate.setDate(now.getDate() + daysUntilSaturday);
        targetDate.setHours(0, 0, 0, 0);
      }

      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check eligibility
  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: ['creator-eligibility', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_creator_eligibility', {
        p_user_id: user?.id
      });
      if (error) throw error;
      return data as unknown as Eligibility;
    },
    enabled: !!user?.id
  });

  // Get balance
  const { data: balance, refetch: refetchBalance } = useQuery({
    queryKey: ['creator-balance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('available_balance_ugx')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data?.available_balance_ugx || 0;
    },
    enabled: !!user?.id
  });

  // Get earnings history
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['creator-earnings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('user_id', user?.id)
        .order('earned_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Earning[];
    },
    enabled: !!user?.id
  });

  // Get withdrawals
  const { data: withdrawals, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery({
    queryKey: ['creator-withdrawals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Withdrawal[];
    },
    enabled: !!user?.id
  });

  // Get top performing posts - DAILY engagement only to prevent cheating
  const { data: topPosts, isLoading: topPostsLoading } = useQuery({
    queryKey: ['creator-top-posts', user?.id, new Date().toDateString()], // Refresh daily
    queryFn: async () => {
      // Get today's date range (UTC)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      // Get user's posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, content, created_at, view_count')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return [];

      const dailyPool = 5000; // UGX daily pool

      // Get BOTH daily and all-time engagement for each post
      const postsWithEngagement = await Promise.all(
        posts.map(async (post) => {
          const [
            todayViewsResult, todayLikesResult, todayRepliesResult,
            totalLikesResult, totalRepliesResult
          ] = await Promise.all([
            // Today's views only
            supabase
              .from('post_views')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .gte('viewed_at', startOfDay)
              .lt('viewed_at', endOfDay),
            // Today's likes only
            supabase
              .from('post_acknowledgments')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .gte('created_at', startOfDay)
              .lt('created_at', endOfDay),
            // Today's replies only
            supabase
              .from('post_replies')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .gte('created_at', startOfDay)
              .lt('created_at', endOfDay),
            // ALL-TIME likes
            supabase
              .from('post_acknowledgments')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            // ALL-TIME replies
            supabase
              .from('post_replies')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id)
          ]);

          // Today's stats (for daily earnings)
          const daily_views = todayViewsResult.count || 0;
          const daily_likes = todayLikesResult.count || 0;
          const daily_replies = todayRepliesResult.count || 0;
          const daily_engagement_score = (daily_views * 1) + (daily_likes * 3) + (daily_replies * 5);

          // All-time stats (for total earnings estimate)
          const total_views = post.view_count || 0;
          const total_likes = totalLikesResult.count || 0;
          const total_replies = totalRepliesResult.count || 0;
          const total_engagement_score = (total_views * 1) + (total_likes * 3) + (total_replies * 5);

          // Calculate days since post was created
          const createdDate = new Date(post.created_at);
          const daysActive = Math.max(1, Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

          // Estimate total earnings (assuming consistent daily share)
          // This is an estimate: (avg daily score / assumed pool share) * days active
          const avgDailyScore = total_engagement_score / daysActive;
          const estimatedDailyEarning = Math.round((avgDailyScore / Math.max(avgDailyScore * 10, 100)) * dailyPool * 0.1); // Conservative estimate
          const estimated_total_earnings = estimatedDailyEarning * daysActive;

          return {
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            // Today's stats
            view_count: daily_views,
            likes_count: daily_likes,
            replies_count: daily_replies,
            engagement_score: daily_engagement_score,
            // All-time stats
            total_views,
            total_likes,
            total_replies,
            total_engagement_score,
            days_active: daysActive,
            estimated_total_earnings
          } as TopPost;
        })
      );

      // Sort by total engagement score (best performing posts on top)
      return postsWithEngagement
        .filter(post => post.total_engagement_score > 0)
        .sort((a, b) => b.total_engagement_score - a.total_engagement_score);
    },
    enabled: !!user?.id
  });

  const handleWithdraw = async () => {
    if (!phoneNumber || !network) {
      toast.error('Please enter phone number and select network');
      return;
    }

    setWithdrawing(true);
    try {
      const { data, error } = await supabase.rpc('request_creator_withdrawal', {
        p_phone_number: phoneNumber,
        p_mobile_network: network
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; message?: string; error?: string; net_amount?: number; fee?: number };
      if (result.success) {
        toast.success(`Withdrawal request submitted! Net: ${result.net_amount?.toLocaleString()} UGX (Fee: ${result.fee?.toLocaleString()} UGX)`);
        setPhoneNumber('');
        setNetwork('');
        setWithdrawSheetOpen(false);
        refetchBalance();
        refetchWithdrawals();
      } else {
        toast.error(result.error || 'Failed to request withdrawal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to request withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatCountdownUnit = (value: number) => value.toString().padStart(2, '0');

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view creator earnings</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <PageHeader title="Creator Earnings" subtitle="Daily 5,000 UGX Giveaway" />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Eligibility Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Eligibility Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eligibilityLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : eligibility?.eligible ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You're eligible for the creator program!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Followers: {eligibility.follower_count}</div>
                  <div>Weekly Views: {eligibility.weekly_views}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <Ban className="h-5 w-5" />
                  <span className="font-medium">Not Eligible</span>
                </div>
                <p className="text-sm text-muted-foreground">{eligibility?.reason}</p>
                {eligibility?.current_followers !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Current followers: {eligibility.current_followers}/10
                  </p>
                )}
                {eligibility?.current_views !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Current weekly views: {eligibility.current_views}/500
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance Card with Withdraw Button */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold">{(balance || 0).toLocaleString()} UGX</p>
              </div>
              <Wallet className="h-10 w-10 text-primary opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Minimum withdrawal: 5,000 UGX • Weekends only • 10% fee
            </p>

            {/* Withdraw Button with Countdown - Visible to all */}
            <div className="mt-4">
              {isWeekendNow ? (
                <Sheet open={withdrawSheetOpen} onOpenChange={setWithdrawSheetOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50" 
                      size="lg"
                      disabled={!eligibility?.eligible || (balance || 0) < 5000}
                    >
                      <Wallet className="h-5 w-5 mr-2" />
                      {eligibility?.eligible ? 'Withdraw Now' : 'Withdraw (Not Eligible)'}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[70vh]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Withdraw to Mobile Money
                      </SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          <span>Withdrawals are open!</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Window closes in: {formatCountdownUnit(countdown.hours)}:{formatCountdownUnit(countdown.minutes)}:{formatCountdownUnit(countdown.seconds)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Mobile Network</Label>
                        <Select value={network} onValueChange={setNetwork}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                            <SelectItem value="Airtel">Airtel Money</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="07XXXXXXXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={handleWithdraw}
                        disabled={(balance || 0) < 5000 || withdrawing}
                      >
                        {withdrawing ? 'Processing...' : `Withdraw ${(balance || 0).toLocaleString()} UGX`}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        10% platform fee will be deducted
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    size="lg" 
                    disabled 
                    variant="secondary"
                  >
                    <Timer className="h-5 w-5 mr-2" />
                    {eligibility?.eligible ? 'Withdraw (Opens Weekend)' : 'Withdraw (Not Eligible)'}
                  </Button>
                  
                  {/* Countdown Display */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground text-center mb-2">
                      Opens in
                    </p>
                    <div className="flex justify-center gap-2">
                      <div className="bg-background rounded-lg px-3 py-2 min-w-[60px] text-center">
                        <p className="text-xl font-bold">{formatCountdownUnit(countdown.days)}</p>
                        <p className="text-xs text-muted-foreground">Days</p>
                      </div>
                      <div className="bg-background rounded-lg px-3 py-2 min-w-[60px] text-center">
                        <p className="text-xl font-bold">{formatCountdownUnit(countdown.hours)}</p>
                        <p className="text-xs text-muted-foreground">Hours</p>
                      </div>
                      <div className="bg-background rounded-lg px-3 py-2 min-w-[60px] text-center">
                        <p className="text-xl font-bold">{formatCountdownUnit(countdown.minutes)}</p>
                        <p className="text-xs text-muted-foreground">Mins</p>
                      </div>
                      <div className="bg-background rounded-lg px-3 py-2 min-w-[60px] text-center">
                        <p className="text-xl font-bold">{formatCountdownUnit(countdown.seconds)}</p>
                        <p className="text-xs text-muted-foreground">Secs</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Available Saturday & Sunday only
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post Performance & Total Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Post Earnings Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPostsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : topPosts && topPosts.length > 0 ? (
              <div className="space-y-3">
                {/* Info Box */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground">
                    📊 <strong>Ranked by total earnings</strong> — Posts with highest lifetime engagement are on top. Daily payouts are still based on TODAY's engagement only.
                  </p>
                </div>

                {topPosts.slice(0, 10).map((post, index) => {
                  const maxScore = topPosts[0]?.total_engagement_score || 1;
                  const scorePercent = (post.total_engagement_score / maxScore) * 100;
                  
                  return (
                    <div key={post.id} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-yellow-950' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-amber-50' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index === 0 ? <Trophy className="h-4 w-4" /> : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">
                            {post.content.slice(0, 80)}{post.content.length > 80 ? '...' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {post.days_active} day{post.days_active !== 1 ? 's' : ''} active
                          </p>
                        </div>
                      </div>

                      {/* Total Stats (All-time) */}
                      <div className="bg-background/50 rounded-lg p-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Total (All-time)</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {post.total_views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {post.total_likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {post.total_replies.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Today's Stats */}
                      {post.engagement_score > 0 && (
                        <div className="bg-green-500/10 rounded-lg p-2">
                          <p className="text-xs font-medium text-green-600 mb-1">Today's Activity</p>
                          <div className="flex items-center gap-3 text-xs text-green-700">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> +{post.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> +{post.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> +{post.replies_count}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <Progress value={scorePercent} className="h-2 flex-1" />
                        <span className="text-xs font-medium text-primary min-w-[70px] text-right">
                          {post.total_engagement_score.toLocaleString()} pts
                        </span>
                      </div>

                      {/* Estimated Total Earnings */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          Est. Total Earned
                        </span>
                        <span className="text-base font-bold text-green-600">
                          ~{post.estimated_total_earnings.toLocaleString()} UGX
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {/* Info Legend */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium mb-2">How Earnings Work</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>📅 <strong>Daily payouts:</strong> Based only on TODAY's engagement (no cheating)</p>
                    <p>📊 <strong>Total estimated:</strong> Cumulative earnings since post was created</p>
                    <p>⚡ Score = Views×1 + Likes×3 + Replies×5</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No posts with engagement yet. Create content to see earnings analysis!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earningsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : earnings && earnings.length > 0 ? (
              <div className="space-y-2">
                {earnings.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-600">+{earning.amount_ugx.toLocaleString()} UGX</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(earning.earned_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {earning.views_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {earning.likes_count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No earnings yet. Keep creating great content!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawalsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : withdrawals && withdrawals.length > 0 ? (
              <div className="space-y-2">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{withdrawal.amount_ugx.toLocaleString()} UGX</p>
                      <p className="text-xs text-muted-foreground">
                        {withdrawal.mobile_network} • {withdrawal.phone_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(withdrawal.requested_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 capitalize">
                      {getStatusIcon(withdrawal.status)}
                      <span className="text-sm">{withdrawal.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No withdrawals yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Program Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>🇺🇬 Available for <strong>Uganda creators</strong></p>
            <p>💰 <strong>5,000 UGX</strong> distributed daily to active creators</p>
            <p>📊 Earnings based on <strong>today's engagement only</strong> (views + likes + replies)</p>
            <p>🔄 Engagement resets daily at midnight — no cheating with old posts!</p>
            <p>💵 Withdraw to <strong>MTN or Airtel Money</strong></p>
            <p className="text-xs pt-2">
              Questions? Ask <strong>AfuAI</strong> for full program details
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}