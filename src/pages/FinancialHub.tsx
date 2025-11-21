import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wallet, Send, Mail, TrendingUp, TrendingDown, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: string;
  type: 'transfer' | 'tip' | 'red_envelope' | 'gift';
  amount: number;
  direction: 'sent' | 'received';
  otherParty: {
    id: string;
    name: string;
    avatar: string;
  };
  message?: string;
  created_at: string;
}

const FinancialHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup realtime subscriptions
      supabase.removeAllChannels();
    };
  }, [user]);

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to XP transfers
    const transfersChannel = supabase
      .channel('xp-transfers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'xp_transfers',
          filter: `sender_id=eq.${user.id},receiver_id=eq.${user.id}`
        },
        () => {
          fetchFinancialData();
        }
      )
      .subscribe();

    // Subscribe to tips
    const tipsChannel = supabase
      .channel('tips-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tips',
          filter: `sender_id=eq.${user.id},receiver_id=eq.${user.id}`
        },
        () => {
          fetchFinancialData();
        }
      )
      .subscribe();

    // Subscribe to red envelope claims
    const redEnvelopeChannel = supabase
      .channel('red-envelope-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'red_envelope_claims',
          filter: `claimer_id=eq.${user.id}`
        },
        () => {
          fetchFinancialData();
        }
      )
      .subscribe();

    // Subscribe to gift transactions
    const giftsChannel = supabase
      .channel('gifts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gift_transactions',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchFinancialData();
        }
      )
      .subscribe();

    // Subscribe to profile changes for balance updates
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && 'xp' in payload.new) {
            setBalance(payload.new.xp);
          }
        }
      )
      .subscribe();
  };

  const fetchFinancialData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single();

      if (profile) setBalance(profile.xp);

      // Fetch all transactions
      const [transfers, tips, redEnvelopes, gifts] = await Promise.all([
        fetchTransfers(),
        fetchTips(),
        fetchRedEnvelopes(),
        fetchGifts()
      ]);

      // Combine and sort all transactions
      const allTransactions = [
        ...transfers,
        ...tips,
        ...redEnvelopes,
        ...gifts
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransfers = async (): Promise<Transaction[]> => {
    const { data: sent } = await supabase
      .from('xp_transfers')
      .select(`
        id,
        amount,
        message,
        created_at,
        receiver:profiles!xp_transfers_receiver_id_fkey(id, display_name, avatar_url)
      `)
      .eq('sender_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: received } = await supabase
      .from('xp_transfers')
      .select(`
        id,
        amount,
        message,
        created_at,
        sender:profiles!xp_transfers_sender_id_fkey(id, display_name, avatar_url)
      `)
      .eq('receiver_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const sentTransactions: Transaction[] = (sent || []).map(t => ({
      id: t.id,
      type: 'transfer',
      amount: t.amount,
      direction: 'sent',
      otherParty: {
        id: t.receiver.id,
        name: t.receiver.display_name,
        avatar: t.receiver.avatar_url || ''
      },
      message: t.message,
      created_at: t.created_at
    }));

    const receivedTransactions: Transaction[] = (received || []).map(t => ({
      id: t.id,
      type: 'transfer',
      amount: t.amount,
      direction: 'received',
      otherParty: {
        id: t.sender.id,
        name: t.sender.display_name,
        avatar: t.sender.avatar_url || ''
      },
      message: t.message,
      created_at: t.created_at
    }));

    return [...sentTransactions, ...receivedTransactions];
  };

  const fetchTips = async (): Promise<Transaction[]> => {
    const { data: sent } = await supabase
      .from('tips')
      .select('id, xp_amount, message, created_at, receiver_id')
      .eq('sender_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: received } = await supabase
      .from('tips')
      .select('id, xp_amount, message, created_at, sender_id')
      .eq('receiver_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch profiles for sent tips
    const sentWithProfiles = await Promise.all(
      (sent || []).map(async (t) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', t.receiver_id)
          .single();

        return {
          id: t.id,
          type: 'tip' as const,
          amount: t.xp_amount,
          direction: 'sent' as const,
          otherParty: {
            id: profile?.id || '',
            name: profile?.display_name || 'Unknown',
            avatar: profile?.avatar_url || ''
          },
          message: t.message,
          created_at: t.created_at
        };
      })
    );

    // Fetch profiles for received tips
    const receivedWithProfiles = await Promise.all(
      (received || []).map(async (t) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', t.sender_id)
          .single();

        return {
          id: t.id,
          type: 'tip' as const,
          amount: t.xp_amount,
          direction: 'received' as const,
          otherParty: {
            id: profile?.id || '',
            name: profile?.display_name || 'Unknown',
            avatar: profile?.avatar_url || ''
          },
          message: t.message,
          created_at: t.created_at
        };
      })
    );

    return [...sentWithProfiles, ...receivedWithProfiles];
  };

  const fetchRedEnvelopes = async (): Promise<Transaction[]> => {
    const { data: claims } = await supabase
      .from('red_envelope_claims')
      .select(`
        id,
        amount,
        claimed_at,
        red_envelope:red_envelopes(
          message,
          sender:profiles!red_envelopes_sender_id_fkey(id, display_name, avatar_url)
        )
      `)
      .eq('claimer_id', user!.id)
      .order('claimed_at', { ascending: false })
      .limit(10);

    return (claims || []).map(c => ({
      id: c.id,
      type: 'red_envelope',
      amount: c.amount,
      direction: 'received',
      otherParty: {
        id: c.red_envelope.sender.id,
        name: c.red_envelope.sender.display_name,
        avatar: c.red_envelope.sender.avatar_url || ''
      },
      message: c.red_envelope.message,
      created_at: c.claimed_at
    }));
  };

  const fetchGifts = async (): Promise<Transaction[]> => {
    const { data: received } = await supabase
      .from('gift_transactions')
      .select('id, xp_cost, message, created_at, sender_id')
      .eq('receiver_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const receivedWithProfiles = await Promise.all(
      (received || []).map(async (g) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', g.sender_id)
          .single();

        return {
          id: g.id,
          type: 'gift' as const,
          amount: g.xp_cost,
          direction: 'received' as const,
          otherParty: {
            id: profile?.id || '',
            name: profile?.display_name || 'Unknown',
            avatar: profile?.avatar_url || ''
          },
          message: g.message,
          created_at: g.created_at
        };
      })
    );

    return receivedWithProfiles;
  };

  const getTransactionIcon = (type: string, direction: string) => {
    if (direction === 'sent') {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    } else {
      return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <Send className="h-5 w-5" />;
      case 'tip':
        return <TrendingUp className="h-5 w-5" />;
      case 'red_envelope':
        return <Mail className="h-5 w-5" />;
      case 'gift':
        return <Gift className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold">Financial Hub</h1>
          </div>
          <p className="text-muted-foreground text-lg">Manage your Nexa, transfers, and transactions</p>
        </div>
      </div>

      <main className="container max-w-4xl mx-auto py-6 px-4">
        {/* Balance Card */}
        <Card className="mb-6 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Your Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">{balance.toLocaleString()} Nexa</div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => navigate('/transfer')} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Transfer
              </Button>
              <Button onClick={() => navigate('/red-envelope')} variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Red Envelope
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
                ) : (
                  transactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${transaction.direction === 'sent' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                        {getTransactionTypeIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{transaction.otherParty.name}</span>
                          {getTransactionIcon(transaction.type, transaction.direction)}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{transaction.type}</p>
                        {transaction.message && (
                          <p className="text-xs text-muted-foreground italic mt-1">{transaction.message}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${transaction.direction === 'sent' ? 'text-red-500' : 'text-green-500'}`}>
                          {transaction.direction === 'sent' ? '-' : '+'}{transaction.amount} Nexa
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-3 mt-4">
                {transactions.filter(t => t.direction === 'sent').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No sent transactions</div>
                ) : (
                  transactions.filter(t => t.direction === 'sent').map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-full bg-red-500/10">
                        {getTransactionTypeIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{transaction.otherParty.name}</span>
                          {getTransactionIcon(transaction.type, transaction.direction)}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{transaction.type}</p>
                        {transaction.message && (
                          <p className="text-xs text-muted-foreground italic mt-1">{transaction.message}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-500">-{transaction.amount} Nexa</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="received" className="space-y-3 mt-4">
                {transactions.filter(t => t.direction === 'received').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No received transactions</div>
                ) : (
                  transactions.filter(t => t.direction === 'received').map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-full bg-green-500/10">
                        {getTransactionTypeIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{transaction.otherParty.name}</span>
                          {getTransactionIcon(transaction.type, transaction.direction)}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{transaction.type}</p>
                        {transaction.message && (
                          <p className="text-xs text-muted-foreground italic mt-1">{transaction.message}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-500">+{transaction.amount} Nexa</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FinancialHub;
