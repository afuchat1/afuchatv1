import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Gift, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ReferralSystem = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    if (user) {
      generateReferralCode();
      fetchReferrals();
    }
  }, [user]);

  const generateReferralCode = () => {
    if (user) {
      // Generate a unique referral code based on user ID
      const code = `AFU-${user.id.substring(0, 8).toUpperCase()}`;
      setReferralCode(code);
    }
  };

  const fetchReferrals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*, profiles!referred_id(display_name, handle)')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
      const rewardedCount = data?.filter((r) => r.rewarded).length || 0;
      setTotalXP(rewardedCount * 20);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!', {
      description: 'Share it with friends to earn 20 Nexa per signup',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invite Friends
        </CardTitle>
        <CardDescription>
          Earn 20 Nexa for each friend who signs up with your link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code Section */}
        <div className="flex gap-2">
          <Input
            value={`${window.location.origin}/?ref=${referralCode}`}
            readOnly
            className="flex-1"
          />
          <Button onClick={copyReferralLink} size="icon">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="text-2xl font-bold">{referrals.length}</div>
            <div className="text-xs text-muted-foreground">Total Referrals</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-primary">{totalXP} Nexa</div>
            <div className="text-xs text-muted-foreground">Earned from Referrals</div>
          </Card>
        </div>

        {/* Referral List */}
        {referrals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Your Referrals</h4>
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      @{referral.profiles?.handle || 'User'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {referral.rewarded && (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    +20 Nexa
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Share your referral link on social media or with friends
            directly. You'll earn 20 Nexa once they complete their signup!
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
