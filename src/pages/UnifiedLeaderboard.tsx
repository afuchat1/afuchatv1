import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, TrendingUp, Gift, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const UnifiedLeaderboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('xp');

  // Fetch XP Leaderboard
  const { data: xpLeaderboard, isLoading: xpLoading } = useQuery({
    queryKey: ['xp-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url, xp, current_grade')
        .order('xp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  // Fetch Gift Leaderboard
  const { data: giftLeaderboard, isLoading: giftLoading } = useQuery({
    queryKey: ['gift-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_transactions')
        .select(`
          receiver_id,
          xp_cost,
          profiles:receiver_id (
            id,
            display_name,
            handle,
            avatar_url
          )
        `);

      if (error) throw error;

      // Aggregate gifts by receiver
      const giftCounts = data.reduce((acc: any, transaction: any) => {
        const receiverId = transaction.receiver_id;
        if (!acc[receiverId]) {
          acc[receiverId] = {
            ...transaction.profiles,
            total_xp: 0,
            gift_count: 0
          };
        }
        acc[receiverId].total_xp += transaction.xp_cost;
        acc[receiverId].gift_count += 1;
        return acc;
      }, {});

      return Object.values(giftCounts).sort((a: any, b: any) => b.total_xp - a.total_xp).slice(0, 100);
    }
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>;
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
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground">Top contributors and receivers</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="xp" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              XP Leaders
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Gift Leaders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="xp" className="space-y-3">
            {xpLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              xpLeaderboard?.map((user, index) => (
                <Card 
                  key={user.id}
                  className={cn(
                    "p-4 cursor-pointer hover:shadow-md transition-all",
                    index < 3 && "border-2",
                    index === 0 && "border-yellow-500/50 bg-yellow-500/5",
                    index === 1 && "border-gray-400/50 bg-gray-400/5",
                    index === 2 && "border-amber-600/50 bg-amber-600/5"
                  )}
                  onClick={() => navigate(`/${user.handle}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 flex flex-col items-center">
                      {getRankIcon(index)}
                      <span className="text-xs text-muted-foreground mt-1">
                        Rank {index + 1}
                      </span>
                    </div>
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-base">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.handle}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-2">
                        {user.current_grade || 'Rookie'}
                      </Badge>
                      <p className="text-lg font-bold text-primary">{user.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="gifts" className="space-y-3">
            {giftLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              giftLeaderboard?.map((user: any, index) => (
                <Card 
                  key={user.id}
                  className={cn(
                    "p-4 cursor-pointer hover:shadow-md transition-all",
                    index < 3 && "border-2",
                    index === 0 && "border-yellow-500/50 bg-yellow-500/5",
                    index === 1 && "border-gray-400/50 bg-gray-400/5",
                    index === 2 && "border-amber-600/50 bg-amber-600/5"
                  )}
                  onClick={() => navigate(`/${user.handle}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 flex flex-col items-center">
                      {getRankIcon(index)}
                      <span className="text-xs text-muted-foreground mt-1">
                        Rank {index + 1}
                      </span>
                    </div>
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-base">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.handle}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2 gap-1">
                        <Gift className="h-3 w-3" />
                        {user.gift_count} {user.gift_count === 1 ? 'gift' : 'gifts'}
                      </Badge>
                      <p className="text-lg font-bold text-pink-500">
                        {user.total_xp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UnifiedLeaderboard;
