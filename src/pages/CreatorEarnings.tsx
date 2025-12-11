import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, Eye, Heart, Phone, AlertCircle, CheckCircle, Clock, Ban, Timer } from 'lucide-react';
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
            <p>📊 Earnings based on your engagement (views + likes)</p>
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