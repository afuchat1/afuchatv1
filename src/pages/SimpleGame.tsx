import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SimpleGame = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState<{ id: number; x: number; y: number }[]>([]);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameActive) {
      endGame();
    }
  }, [timeLeft, gameActive]);

  useEffect(() => {
    if (gameActive) {
      const interval = setInterval(() => {
        spawnTarget();
      }, 800);
      return () => clearInterval(interval);
    }
  }, [gameActive]);

  const spawnTarget = () => {
    const newTarget = {
      id: Date.now(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
    };
    setTargets((prev) => [...prev, newTarget]);
    
    setTimeout(() => {
      setTargets((prev) => prev.filter((t) => t.id !== newTarget.id));
    }, 1500);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    setTargets([]);
  };

  const endGame = async () => {
    setGameActive(false);
    setTargets([]);
    
    if (score > highScore) {
      setHighScore(score);
    }

    if (user && score > 0) {
      const xpEarned = Math.floor(score / 10);
      if (xpEarned > 0) {
        try {
          const { error } = await supabase.rpc('award_xp', {
            p_user_id: user.id,
            p_action_type: 'game_played',
            p_xp_amount: xpEarned,
            p_metadata: { score, game: 'xp_collector' }
          });

          if (!error) {
            toast.success(`Game Over! You earned ${xpEarned} XP!`);
          }
        } catch (error) {
          console.error('Error awarding XP:', error);
        }
      } else {
        toast.info(`Game Over! Score: ${score}`);
      }
    } else {
      toast.info(`Game Over! Score: ${score}`);
    }
  };

  const handleTargetClick = (targetId: number) => {
    setScore((prev) => prev + 10);
    setTargets((prev) => prev.filter((t) => t.id !== targetId));
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
            <Zap className="h-8 w-8 text-yellow-500" />
            XP Collector
          </h1>
          <p className="text-muted-foreground">Click the XP orbs as fast as you can!</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Score</p>
            <p className="text-2xl font-bold text-foreground">{score}</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Time</p>
            <p className="text-2xl font-bold text-foreground">{timeLeft}s</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Best</p>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {highScore}
            </p>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-lg border-2 border-border overflow-hidden" style={{ height: '400px' }}>
          {!gameActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <Button size="lg" onClick={startGame} className="mb-4">
                  {score === 0 ? 'Start Game' : 'Play Again'}
                </Button>
                <p className="text-sm text-muted-foreground">Earn XP based on your score!</p>
              </div>
            </div>
          )}

          {gameActive && targets.map((target) => (
            <button
              key={target.id}
              onClick={() => handleTargetClick(target.id)}
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg animate-scale-in cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
            >
              <Zap className="h-6 w-6 text-white" />
            </button>
          ))}
        </div>

        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click on the XP orbs before they disappear</li>
            <li>• Each orb is worth 10 points</li>
            <li>• You have 30 seconds to get the highest score</li>
            <li>• Earn XP rewards based on your performance!</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default SimpleGame;
