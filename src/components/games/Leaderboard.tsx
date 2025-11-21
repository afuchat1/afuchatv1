import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  metadata: any;
  created_at: string;
  profiles: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
}

interface LeaderboardProps {
  gameType: string;
  difficulty: string;
  limit?: number;
}

const Leaderboard = ({ gameType, difficulty, limit = 10 }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [gameType, difficulty]);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select(`
          *,
          profiles (
            display_name,
            handle,
            avatar_url
          )
        `)
        .eq('game_type', gameType)
        .eq('difficulty', difficulty)
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading leaderboard...</div>;
  }

  if (entries.length === 0) {
    return <div className="text-center text-muted-foreground">No scores yet. Be the first!</div>;
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        Leaderboard - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(index) || (
                  <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{entry.profiles.display_name}</p>
                <p className="text-xs text-muted-foreground">@{entry.profiles.handle}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-foreground">{entry.score} Nexa</p>
                {entry.metadata?.moves && (
                  <p className="text-xs text-muted-foreground">{entry.metadata.moves} moves</p>
                )}
                {entry.metadata?.time && (
                  <p className="text-xs text-muted-foreground">{entry.metadata.time}s</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default Leaderboard;
