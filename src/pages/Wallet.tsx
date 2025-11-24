import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Wallet as WalletIcon, TrendingUp, Gift, Heart, ShoppingBag, Mail, Send, Sparkles, ArrowUpRight, ArrowDownRight, Coins, Eye, EyeOff, RefreshCw, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ACoinConverter } from '@/components/currency/ACoinConverter';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
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

  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const [gifts, tips, purchases, transfers, redEnvSent, redEnvClaimed, conversions] = await Promise.all([
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
          .limit(20),
        supabase
          .from('acoin_transactions')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      const all: any[] = [
        ...(gifts.data || []).map(t => ({ ...t, type: 'gift', timestamp: t.created_at })),
        ...(tips.data || []).map(t => ({ ...t, type: 'tip', timestamp: t.created_at })),
        ...(purchases.data || []).map(t => ({ ...t, type: 'purchase', timestamp: t.purchased_at })),
        ...(transfers.data || []).map(t => ({ ...t, type: 'transfer', timestamp: t.created_at })),
        ...(redEnvSent.data || []).map(t => ({ ...t, type: 'red_envelope_sent', timestamp: t.created_at })),
        ...(redEnvClaimed.data || []).map(t => ({ ...t, type: 'red_envelope_claimed', timestamp: t.claimed_at })),
        ...(conversions.data || []).map(t => ({ ...t, type: 'conversion', timestamp: t.created_at }))
      ];

      return all.sort((a, b) => 
        new Date(b.timestamp).getTime() - 
        new Date(a.timestamp).getTime()
      );
    },
    enabled: !!user?.id
  });

  const getTransactionIcon = (type: string) => {
    const iconClasses = "h-3.5 w-3.5";
    const wrapperClasses = "p-1.5 rounded-lg";
    
    switch (type) {
      case 'gift': 
        return <div className={`${wrapperClasses} bg-pink-500/10`}><Gift className={`${iconClasses} text-pink-500`} /></div>;
      case 'tip': 
        return <div className={`${wrapperClasses} bg-red-500/10`}><Heart className={`${iconClasses} text-red-500`} /></div>;
      case 'purchase': 
        return <div className={`${wrapperClasses} bg-purple-500/10`}><ShoppingBag className={`${iconClasses} text-purple-500`} /></div>;
      case 'transfer': 
        return <div className={`${wrapperClasses} bg-indigo-500/10`}><Send className={`${iconClasses} text-indigo-500`} /></div>;
      case 'red_envelope_sent': 
        return <div className={`${wrapperClasses} bg-red-500/10`}><Mail className={`${iconClasses} text-red-500`} /></div>;
      case 'red_envelope_claimed': 
        return <div className={`${wrapperClasses} bg-green-500/10`}><Mail className={`${iconClasses} text-green-500`} /></div>;
      case 'conversion': 
        return <div className={`${wrapperClasses} bg-yellow-500/10`}><Coins className={`${iconClasses} text-yellow-600`} /></div>;
      default: 
        return <div className={`${wrapperClasses} bg-primary/10`}><TrendingUp className={`${iconClasses} text-primary`} /></div>;
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
        : `Received from @${transaction.receiver?.handle}`;
    }
    if (transaction.type === 'red_envelope_sent') {
      return `Red Envelope - ${transaction.recipient_count} recipients`;
    }
    if (transaction.type === 'red_envelope_claimed') {
      return `Claimed from @${transaction.envelope?.sender?.handle}'s Red Envelope`;
    }
    if (transaction.type === 'conversion') {
      return transaction.transaction_type === 'nexa_to_acoin' 
        ? 'Converted Nexa to ACoin'
        : 'Currency Conversion';
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
    if (transaction.type === 'conversion') {
      return -(transaction.nexa_spent || 0);
    }
    
    const amount = transaction.xp_cost || transaction.xp_amount || transaction.xp_paid;
    const isSender = transaction.sender_id === user?.id;
    
    if (transaction.type === 'purchase' || (transaction.type !== 'purchase' && isSender)) {
      return -amount;
    }
    return amount;
  };

  const totalReceived = transactions?.filter(t => getTransactionAmount(t) > 0)
    .reduce((sum, t) => sum + getTransactionAmount(t), 0) || 0;
  
  const totalSent = transactions?.filter(t => getTransactionAmount(t) < 0)
    .reduce((sum, t) => sum + Math.abs(getTransactionAmount(t)), 0) || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchTransactions()
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
    toast({
      title: "Refreshed",
      description: "Wallet data updated successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="shrink-0 rounded-full h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo size="sm" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="shrink-0 rounded-full h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
        {/* Balance Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {/* Nexa Balance */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm hover:shadow-md transition-all rounded-xl">
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-md hover:shadow-lg transition-all rounded-xl">
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <WalletIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={() => setShowBalance(!showBalance)}
                    >
                      {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <Badge variant="outline" className="text-[10px] font-semibold rounded-full px-1.5 py-0 h-5">
                      {profile?.current_grade || 'Newcomer'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">Nexa Balance</p>
                {showBalance ? (
                  <p className="text-2xl font-bold text-primary">
                    {profile?.xp?.toLocaleString() || 0}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    ••••••
                  </p>
                )}
              </CardContent>
            </Card>
          </Card>

          {/* ACoin Balance */}
          <Card className="relative overflow-hidden border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 via-background to-background shadow-sm hover:shadow-md transition-all rounded-xl">
            <Card className="relative overflow-hidden border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 via-background to-background shadow-md hover:shadow-lg transition-all rounded-xl">
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="p-1.5 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
                    <Coins className="h-4 w-4 text-yellow-600" />
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => navigate('/premium')}
                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10 h-6 rounded-full text-[10px] px-2"
                  >
                    <Sparkles className="h-3 w-3 mr-0.5" />
                    Premium
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">ACoin Balance</p>
                {showBalance ? (
                  <p className="text-2xl font-bold text-yellow-600">
                    {profile?.acoin?.toLocaleString() || 0}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-yellow-600">
                    ••••••
                  </p>
                )}
              </CardContent>
            </Card>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-sm rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2.5">
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="flex items-center justify-center mb-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-1.5 bg-green-500/10 rounded-xl">
                      <ArrowDownRight className="h-3.5 w-3.5 text-green-500" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-1">Received</p>
                  <motion.p 
                    className="text-lg font-bold text-green-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    +{totalReceived.toLocaleString()}
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="flex items-center justify-center mb-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-1.5 bg-red-500/10 rounded-xl">
                      <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-1">Sent</p>
                  <motion.p 
                    className="text-lg font-bold text-red-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    -{totalSent.toLocaleString()}
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div 
                    className="flex items-center justify-center mb-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-1.5 bg-primary/10 rounded-xl">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                  <motion.p 
                    className="text-lg font-bold text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    {transactions?.length || 0}
                  </motion.p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ACoin Converter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <ACoinConverter 
            currentNexa={profile?.xp || 0}
            currentACoin={profile?.acoin || 0}
            onConversionSuccess={() => {
              refetchProfile();
              toast({
                title: "Success!",
                description: "Nexa converted to ACoin successfully",
              });
            }}
          />
        </motion.div>

        {/* Quick Actions - Transfer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Button 
            onClick={() => navigate('/transfer')} 
            className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-sm font-semibold shadow-sm bg-primary hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Transfer Nexa</span>
          </Button>
        </motion.div>


        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="shadow-sm rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Recent Activity</h2>
                <Button variant="ghost" size="sm" className="gap-1 h-6 rounded-lg text-[10px] px-2">
                  <Filter className="h-3 w-3" />
                  Filter
                </Button>
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-3 rounded-lg h-8 bg-muted/50">
                  <TabsTrigger value="all" className="text-[10px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">All</TabsTrigger>
                  <TabsTrigger value="received" className="text-[10px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Received</TabsTrigger>
                  <TabsTrigger value="sent" className="text-[10px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Sent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-2 mt-0">
                  <AnimatePresence>
                    {transactions?.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="inline-flex p-2.5 bg-muted rounded-xl mb-2">
                          <WalletIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium text-xs">No transactions yet</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Start by sending gifts or tips to friends
                        </p>
                      </div>
                    ) : (
                      transactions?.map((transaction, index) => {
                        const amount = getTransactionAmount(transaction);
                        const isNegative = amount < 0;

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/40 hover:border-border hover:bg-accent/50 transition-all cursor-pointer"
                          >
                            {getTransactionIcon(transaction.type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[11px] truncate leading-tight">
                                {getTransactionLabel(transaction)}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-bold ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                                {isNegative ? '' : '+'}{Math.abs(amount).toLocaleString()}
                              </p>
                              <p className="text-[9px] text-muted-foreground">Nexa</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="received" className="space-y-2 mt-0">
                  <AnimatePresence>
                    {transactions?.filter(t => getTransactionAmount(t) > 0).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        No received transactions
                      </div>
                    ) : (
                      transactions?.filter(t => getTransactionAmount(t) > 0).map((transaction, index) => {
                        const amount = getTransactionAmount(transaction);

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/40 hover:border-border hover:bg-accent/50 transition-all cursor-pointer"
                          >
                            {getTransactionIcon(transaction.type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[11px] truncate leading-tight">
                                {getTransactionLabel(transaction)}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-green-500">
                                +{amount.toLocaleString()}
                              </p>
                              <p className="text-[9px] text-muted-foreground">Nexa</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="sent" className="space-y-2 mt-0">
                  <AnimatePresence>
                    {transactions?.filter(t => getTransactionAmount(t) < 0).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        No sent transactions
                      </div>
                    ) : (
                      transactions?.filter(t => getTransactionAmount(t) < 0).map((transaction, index) => {
                        const amount = getTransactionAmount(transaction);

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/40 hover:border-border hover:bg-accent/50 transition-all cursor-pointer"
                          >
                            {getTransactionIcon(transaction.type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[11px] truncate leading-tight">
                                {getTransactionLabel(transaction)}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-red-500">
                                {amount.toLocaleString()}
                              </p>
                              <p className="text-[9px] text-muted-foreground">Nexa</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Wallet;
