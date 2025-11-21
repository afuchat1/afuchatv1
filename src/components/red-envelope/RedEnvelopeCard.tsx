import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gift, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface RedEnvelopeCardProps {
  envelope: any;
  onClaim: () => void;
}

export const RedEnvelopeCard = ({ envelope, onClaim }: RedEnvelopeCardProps) => {
  const { user } = useAuth();
  const [claiming, setClaiming] = useState(false);

  // Check if user has claimed
  const { data: hasClaimed } = useQuery({
    queryKey: ['red_envelope_claim', envelope.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('red_envelope_claims')
        .select('amount')
        .eq('red_envelope_id', envelope.id)
        .eq('claimer_id', user?.id)
        .single();
      
      return data;
    },
    enabled: !!user?.id
  });

  const handleClaim = async () => {
    if (!user) {
      toast.error('Please sign in to claim');
      return;
    }

    setClaiming(true);

    try {
      const { data, error } = await supabase.rpc('claim_red_envelope', {
        p_envelope_id: envelope.id
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; amount?: number; is_last?: boolean };

      if (result.success) {
        toast.success(
          <div className="space-y-1">
            <p className="font-bold text-lg">🎉 You got {result.amount} Nexa!</p>
            <p className="text-sm">{result.message}</p>
            {result.is_last && <p className="text-xs text-muted-foreground">You claimed the last one!</p>}
          </div>,
          { duration: 5000 }
        );
        onClaim();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error claiming red envelope:', error);
      toast.error('Failed to claim red envelope');
    } finally {
      setClaiming(false);
    }
  };

  const progress = (envelope.claimed_count / envelope.recipient_count) * 100;
  const isFull = envelope.claimed_count >= envelope.recipient_count;

  return (
    <Card className="relative overflow-hidden border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-600/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-red-500">
            <AvatarImage src={envelope.sender?.avatar_url || undefined} />
            <AvatarFallback className="bg-red-500 text-white">
              {envelope.sender?.display_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium">{envelope.sender?.display_name}'s Red Envelope</p>
                <p className="text-sm text-muted-foreground">
                  {envelope.total_amount} Nexa · {envelope.recipient_count} people
                </p>
              </div>
              <Gift className="h-6 w-6 text-red-500" />
            </div>

            {envelope.message && (
              <p className="text-sm italic mb-3 text-muted-foreground">
                "{envelope.message}"
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{envelope.claimed_count} / {envelope.recipient_count} claimed</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-4">
              {hasClaimed ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 text-center">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✓ You claimed {hasClaimed.amount} Nexa!
                  </p>
                </div>
              ) : isFull ? (
                <Button className="w-full" variant="outline" disabled>
                  All Claimed
                </Button>
              ) : (
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600 group"
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? (
                    'Opening...'
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 group-hover:animate-spin" />
                      Open Red Envelope 🧧
                    </>
                  )}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-2">
              Expires: {new Date(envelope.expires_at).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
