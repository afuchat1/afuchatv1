import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Brain } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const emojis = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryGame = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const initializeGame = () => {
    const shuffledEmojis = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(true);
  };

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(id) || cards[id].isMatched) return;

    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      const [firstId, secondId] = newFlippedCards;
      
      if (cards[firstId].emoji === cards[secondId].emoji) {
        setCards(prev => prev.map(card => 
          card.id === firstId || card.id === secondId 
            ? { ...card, isMatched: true } 
            : card
        ));
        setMatches(matches + 1);
        setFlippedCards([]);
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  useEffect(() => {
    if (matches === emojis.length && gameStarted) {
      endGame();
    }
  }, [matches]);

  const endGame = async () => {
    setGameStarted(false);
    if (!bestScore || moves < bestScore) {
      setBestScore(moves);
    }

    if (user) {
      const xpEarned = Math.max(50 - moves * 2, 10);
      try {
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_action_type: 'game_played',
          p_xp_amount: xpEarned,
          p_metadata: { moves, game: 'memory_match' }
        });
        toast.success(`Game Complete! You earned ${xpEarned} XP in ${moves} moves!`);
      } catch (error) {
        console.error('Error awarding XP:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            Memory Match
          </h1>
          <p className="text-muted-foreground">Match all the pairs to win!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Moves</p>
            <p className="text-2xl font-bold text-foreground">{moves}</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Best Score</p>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {bestScore || '-'}
            </p>
          </div>
        </div>

        {!gameStarted ? (
          <div className="text-center mb-6">
            <Button size="lg" onClick={initializeGame}>
              {moves === 0 ? 'Start Game' : 'Play Again'}
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={!gameStarted}
              className={`aspect-square rounded-lg text-4xl flex items-center justify-center transition-all transform ${
                flippedCards.includes(card.id) || card.isMatched
                  ? 'bg-primary text-primary-foreground scale-105'
                  : 'bg-muted hover:bg-muted/80 hover:scale-105'
              }`}
            >
              {flippedCards.includes(card.id) || card.isMatched ? card.emoji : '?'}
            </button>
          ))}
        </div>

        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click on cards to flip them over</li>
            <li>• Match pairs of identical emojis</li>
            <li>• Complete the game in fewer moves for more XP</li>
            <li>• Beat your best score!</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default MemoryGame;
