import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wallet as WalletIcon, TrendingUp, TrendingDown, Gift, Heart, ShoppingBag, Trophy, Mail, Send, Crown, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ACoinConverter } from '@/components/currency/ACoinConverter';

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const [gifts, tips, purchases, transfers, redEnvSent, redEnvClaimed] = await Promise.all([
        supabase
          .from('gift_transactions')
          .select('*, sender:profiles!gift_transactions_sender_id_fkey(display_name, handle), receiver:profiles!gift_transactions_receiver_id_fkey(display_name, handle), gift:gifts(*)')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('tips')
          .select('*, sender:profiles!tips_sender_id_fkey(display_name, handle), receiver:profiles!tips_receiver_id_fkey(display_name, handle)')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('user_shop_purchases')
          .select('*, item:shop_items(*)')
          .eq('user_id', user?.id)
          .order('purchased_at', { ascending: false })
          .limit(20),
        supabase
          .from('xp_transfers')
          .select('*, sender:profiles!xp_transfers_sender_id_fkey(display_name, handle), receiver:profiles!xp_transfers_receiver_id_fkey(display_name, handle)')
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('red_envelopes')
          .select('*')
          .eq('sender_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('red_envelope_claims')
          .select('*, envelope:red_envelopes(*, sender:profiles(display_name, handle))')
          .eq('claimer_id', user?.id)
          .order('claimed_at', { ascending: false })
          .limit(20)
      ]);

      const all: any[] = [
        ...(gifts.data || []).map(t => ({ ...t, type: 'gift', timestamp: t.created_at })),
        ...(tips.data || []).map(t => ({ ...t, type: 'tip', timestamp: t.created_at })),
        ...(purchases.data || []).map(t => ({ ...t, type: 'purchase', timestamp: t.purchased_at })),
        ...(transfers.data || []).map(t => ({ ...t, type: 'transfer', timestamp: t.created_at })),
        ...(redEnvSent.data || []).map(t => ({ ...t, type: 'red_envelope_sent', timestamp: t.created_at })),
        ...(redEnvClaimed.data || []).map(t => ({ ...t, type: 'red_envelope_claimed', timestamp: t.claimed_at }))
      ];

      return all.sort((a, b) => 
        new Date(b.timestamp).getTime() - 
        new Date(a.timestamp).getTime()
      );
    },
    enabled: !!user?.id
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'gift': return <Gift className="h-5 w-5 text-pink-500" />;
      case 'tip': return <Heart className="h-5 w-5 text-red-500" />;
      case 'purchase': return <ShoppingBag className="h-5 w-5 text-purple-500" />;
      case 'transfer': return <Send className="h-5 w-5 text-indigo-500" />;
      case 'red_envelope_sent': return <Mail className="h-5 w-5 text-red-500" />;
      case 'red_envelope_claimed': return <Mail className="h-5 w-5 text-green-500" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getTransactionLabel = (transaction: any) => {
    if (transaction.type === 'gift') {
      const isSender = transaction.sender_id === user?.id;
      return isSender 
        ? `Sent ${transaction.gift?.name} to @${transaction.receiver?.handle}`
        : `Received ${transaction.gift?.name} from @${transaction.sender?.handle}`;
    }
    if (transaction.type === 'tip') {
      const isSender = transaction.sender_id === user?.id;
      return isSender 
        ? `Tipped @${transaction.receiver?.handle}`
        : `Received tip from @${transaction.sender?.handle}`;
    }
    if (transaction.type === 'transfer') {
      const isSender = transaction.sender_id === user?.id;
      return isSender 
        ? `Transferred to @${transaction.receiver?.handle}`
        : `Received from @${transaction.sender?.handle}`;
    }
    if (transaction.type === 'red_envelope_sent') {
      return `Red Envelope - ${transaction.recipient_count} recipients`;
    }
    if (transaction.type === 'red_envelope_claimed') {
      return `Claimed from @${transaction.envelope?.sender?.handle}'s Red Envelope`;
    }
    return `Purchased ${transaction.item?.name}`;
  };

  const getTransactionAmount = (transaction: any) => {
    if (transaction.type === 'red_envelope_sent') {
      return -transaction.total_amount;
    }
    if (transaction.type === 'red_envelope_claimed') {
      return transaction.amount;
    }
    if (transaction.type === 'transfer') {
      const isSender = transaction.sender_id === user?.id;
      return isSender ? -transaction.amount : transaction.amount;
    }
    
    const amount = transaction.xp_cost || transaction.xp_amount || transaction.xp_paid;
    const isSender = transaction.sender_id === user?.id;
    
    if (transaction.type === 'purchase' || (transaction.type !== 'purchase' && isSender)) {
      return -amount;
    }
    return amount;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo size="sm" />
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WalletIcon className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Wallet</CardTitle>
                  <CardDescription>Your Nexa & ACoin balance</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {profile?.current_grade || 'Rookie'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-4">
              {profile?.xp?.toLocaleString() || 0} Nexa
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => navigate('/shop')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop
              </Button>
              <Button variant="outline" onClick={() => navigate('/leaderboard')}>
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Premium CTA Card */}
        <Card className="mb-8 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    Get Premium & Verified
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </h3>
                  <p className="text-sm text-muted-foreground">Subscribe with ACoin and get verified instantly</p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/premium')}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              >
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ACoin Converter */}
        <div className="mb-8">
          <ACoinConverter 
            currentNexa={profile?.xp || 0}
            currentACoin={profile?.acoin || 0}
            onConversionSuccess={() => {
              // Refetch profile to update balances
              window.location.reload();
            }}
          />
        </div>

        {/* Transaction History */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        </div>

        <div className="space-y-3">
          {transactions?.map((transaction, index) => {
            const amount = getTransactionAmount(transaction);
            const isNegative = amount < 0;

            return (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {getTransactionLabel(transaction)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                      {isNegative ? '-' : '+'}{Math.abs(amount).toLocaleString()} Nexa
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}

          {transactions?.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wallet;
