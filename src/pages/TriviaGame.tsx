import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Brain, Check, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

const questions: Question[] = [
  {
    question: "What does XP stand for?",
    options: ["Experience Points", "Extra Power", "Expert Player", "eXtra Privilege"],
    correctAnswer: 0
  },
  {
    question: "Which component is used for navigation in React?",
    options: ["Router", "Navigator", "Link", "Route"],
    correctAnswer: 0
  },
  {
    question: "What is the purpose of a leaderboard?",
    options: ["Store data", "Rank users", "Send messages", "Edit profile"],
    correctAnswer: 1
  },
  {
    question: "Which icon represents achievements?",
    options: ["Star", "Trophy", "Medal", "Crown"],
    correctAnswer: 1
  },
  {
    question: "What does API stand for?",
    options: ["Advanced Programming Interface", "Application Program Interface", "Application Programming Interface", "Advanced Program Integration"],
    correctAnswer: 2
  }
];

const TriviaGame = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const startGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameStarted(true);
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        endGame(isCorrect ? score + 1 : score);
      }
    }, 1500);
  };

  const endGame = async (finalScore: number) => {
    setGameStarted(false);
    setShowResult(true);
    
    if (finalScore > bestScore) {
      setBestScore(finalScore);
    }

    if (user) {
      const xpEarned = finalScore * 20;
      try {
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_action_type: 'game_played',
          p_xp_amount: xpEarned,
          p_metadata: { score: finalScore, total: questions.length, game: 'trivia' }
        });
        toast.success(`Trivia Complete! You earned ${xpEarned} XP with ${finalScore}/${questions.length} correct!`);
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
            <Brain className="h-8 w-8 text-indigo-500" />
            Trivia Challenge
          </h1>
          <p className="text-muted-foreground">Test your knowledge!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Score</p>
            <p className="text-2xl font-bold text-foreground">{score}/{questions.length}</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Best Score</p>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {bestScore}/{questions.length}
            </p>
          </div>
        </div>

        {!gameStarted && !showResult ? (
          <div className="text-center mb-6">
            <Button size="lg" onClick={startGame}>
              Start Trivia
            </Button>
          </div>
        ) : showResult ? (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Game Over!</h2>
            <p className="text-lg text-muted-foreground mb-6">
              You scored {score} out of {questions.length}
            </p>
            <Button size="lg" onClick={startGame}>
              Play Again
            </Button>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQuestion + 1}/{questions.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-6">
              {questions[currentQuestion].question}
            </h3>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-lg text-left transition-all flex items-center justify-between ${
                    selectedAnswer === null
                      ? 'bg-muted hover:bg-muted/80 hover:scale-102'
                      : selectedAnswer === index
                      ? index === questions[currentQuestion].correctAnswer
                        ? 'bg-green-500/20 border-2 border-green-500'
                        : 'bg-red-500/20 border-2 border-red-500'
                      : index === questions[currentQuestion].correctAnswer
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-muted opacity-50'
                  }`}
                >
                  <span className="text-foreground">{option}</span>
                  {selectedAnswer !== null && (
                    index === questions[currentQuestion].correctAnswer ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : selectedAnswer === index ? (
                      <X className="h-5 w-5 text-red-500" />
                    ) : null
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Answer {questions.length} trivia questions</li>
            <li>• Each correct answer gives you 20 XP</li>
            <li>• Try to get all questions right!</li>
            <li>• Beat your best score!</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default TriviaGame;
