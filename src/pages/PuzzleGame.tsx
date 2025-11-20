import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Puzzle } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PuzzleGame = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const initializeGame = () => {
    const numbers = Array.from({ length: 15 }, (_, i) => i + 1);
    numbers.push(0); // 0 represents the empty tile
    const shuffled = shuffleArray(numbers);
    setTiles(shuffled);
    setMoves(0);
    setGameStarted(true);
  };

  const shuffleArray = (array: number[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const canMove = (index: number) => {
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / 4);
    const col = index % 4;
    const emptyRow = Math.floor(emptyIndex / 4);
    const emptyCol = emptyIndex % 4;

    return (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1)
    );
  };

  const moveTile = (index: number) => {
    if (!gameStarted || !canMove(index)) return;

    const newTiles = [...tiles];
    const emptyIndex = tiles.indexOf(0);
    [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
    setTiles(newTiles);
    setMoves(moves + 1);
  };

  const isSolved = () => {
    return tiles.every((tile, index) => index === tiles.length - 1 || tile === index + 1);
  };

  useEffect(() => {
    if (gameStarted && isSolved()) {
      endGame();
    }
  }, [tiles]);

  const endGame = async () => {
    setGameStarted(false);
    if (!bestScore || moves < bestScore) {
      setBestScore(moves);
    }

    if (user) {
      const xpEarned = Math.max(100 - moves, 20);
      try {
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_action_type: 'game_played',
          p_xp_amount: xpEarned,
          p_metadata: { moves, game: '15_puzzle' }
        });
        toast.success(`Puzzle Solved! You earned ${xpEarned} XP in ${moves} moves!`);
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
            <Puzzle className="h-8 w-8 text-blue-500" />
            15 Puzzle
          </h1>
          <p className="text-muted-foreground">Arrange the tiles in order!</p>
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

        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto bg-muted p-2 rounded-lg">
          {tiles.map((tile, index) => (
            <button
              key={index}
              onClick={() => moveTile(index)}
              disabled={!gameStarted || tile === 0}
              className={`aspect-square rounded-lg text-2xl font-bold flex items-center justify-center transition-all ${
                tile === 0
                  ? 'bg-muted cursor-default'
                  : canMove(index)
                  ? 'bg-primary text-primary-foreground hover:scale-105 cursor-pointer'
                  : 'bg-secondary text-secondary-foreground cursor-not-allowed opacity-60'
              }`}
            >
              {tile !== 0 ? tile : ''}
            </button>
          ))}
        </div>

        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click on tiles adjacent to the empty space to move them</li>
            <li>• Arrange numbers in order from 1 to 15</li>
            <li>• Complete the puzzle in fewer moves for more XP</li>
            <li>• Beat your best score!</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default PuzzleGame;
