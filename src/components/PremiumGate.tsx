import { ReactNode } from 'react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  children: ReactNode;
  feature?: string;
  showUpgrade?: boolean;
}

export const PremiumGate = ({ children, feature = 'this feature', showUpgrade = true }: PremiumGateProps) => {
  const { isPremium, loading } = usePremiumStatus();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPremium && showUpgrade) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Crown className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-3 flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            Premium Feature
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Unlock {feature} and many more exclusive features with Premium
          </p>

          <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Verified Badge</p>
                <p className="text-sm text-muted-foreground">Get the verified checkmark on your profile</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Exclusive Features</p>
                <p className="text-sm text-muted-foreground">Access premium-only features and tools</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Priority Support</p>
                <p className="text-sm text-muted-foreground">Get faster response times and dedicated support</p>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => navigate('/premium')}
            className="gap-2"
          >
            <Crown className="h-5 w-5" />
            Upgrade to Premium
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
