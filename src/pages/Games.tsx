import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Zap, Brain, Puzzle, Gamepad2 } from 'lucide-react';
import Logo from '@/components/Logo';

const Games = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const games = [
    { 
      icon: Zap, 
      title: 'XP Collector', 
      description: 'Click orbs to collect XP and level up', 
      route: '/game', 
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      icon: Brain, 
      title: 'Memory Match', 
      description: 'Test your memory by matching pairs', 
      route: '/memory-game', 
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      icon: Puzzle, 
      title: '15 Puzzle', 
      description: 'Solve the classic sliding puzzle', 
      route: '/puzzle-game', 
      color: 'bg-blue-600',
      gradient: 'from-blue-600 to-cyan-500'
    },
    { 
      icon: Brain, 
      title: 'Trivia Challenge', 
      description: 'Answer questions to test your knowledge', 
      route: '/trivia-game', 
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-purple-600'
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
            <Button variant="ghost" size="icon" onClick={() => navigate('/leaderboard')}>
              <Trophy className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-6 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Games</h1>
          </div>
          <p className="text-muted-foreground">Play games, earn XP, and compete with friends</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((game, idx) => {
            const Icon = game.icon;
            return (
              <div 
                key={idx} 
                className="cursor-pointer group relative overflow-hidden rounded-2xl border border-border bg-card hover:shadow-2xl transition-all duration-300"
                onClick={() => navigate(game.route)}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                
                {/* Content */}
                <div className="relative p-6">
                  <div className={`inline-flex p-4 rounded-2xl ${game.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{game.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                  <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-2 transition-transform">
                    Play Now
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaderboard CTA */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-yellow-500">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1 text-foreground">Compete on the Leaderboard</h3>
              <p className="text-sm text-muted-foreground mb-4">See how you rank against other players</p>
              <Button 
                onClick={() => navigate('/leaderboard')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                View Rankings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Games;
