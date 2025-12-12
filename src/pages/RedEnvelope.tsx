import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Gift, Users, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { RedEnvelopeCard } from '@/components/red-envelope/RedEnvelopeCard';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

const RedEnvelope = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, tier, hasTierAccess } = usePremiumStatus();
  const canCreateRedEnvelopes = hasTierAccess('platinum');
  const [totalAmount, setTotalAmount] = useState('');
  const [recipientCount, setRecipientCount] = useState('');
  const [message, setMessage] = useState('');
  const [envelopeType, setEnvelopeType] = useState<'random' | 'equal'>('random');
  const [loading, setLoading] = useState(false);

  // Fetch user's Nexa
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch active red envelopes
  const { data: activeEnvelopes, refetch } = useQuery({
    queryKey: ['red_envelopes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('red_envelopes')
        .select(`
          *,
          sender:profiles!red_envelopes_sender_id_fkey(display_name, avatar_url, handle)
        `)
        .eq('is_expired', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch my sent envelopes
  const { data: myEnvelopes } = useQuery({
    queryKey: ['my_red_envelopes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('red_envelopes')
        .select(`
          *,
          claims:red_envelope_claims(count)
        `)
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const handleCreateEnvelope = async () => {
    if (!user) {
      toast.error('Please sign in');
      return;
    }

    const amount = parseInt(totalAmount);
    const count = parseInt(recipientCount);

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!count || count <= 0 || count > 100) {
      toast.error('Recipient count must be between 1 and 100');
      return;
    }

    if (amount < count) {
      toast.error('Total amount must be at least equal to recipient count');
      return;
    }

    if (amount > (profile?.xp || 0)) {
      toast.error('Insufficient Nexa balance');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('create_red_envelope', {
        p_total_amount: amount,
        p_recipient_count: count,
        p_message: message.trim() || null,
        p_envelope_type: envelopeType
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; envelope_id?: string };

      if (result.success) {
        toast.success('Red envelope created! Share it with friends!');
        setTotalAmount('');
        setRecipientCount('');
        setMessage('');
        refetch();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating red envelope:', error);
      toast.error('Failed to create red envelope');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto">
        {/* Balance Card */}
        <div className="p-4">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold">{profile?.xp?.toLocaleString() || 0} Nexa</p>
                </div>
                <Gift className="h-12 w-12 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="create" className="px-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">
              <Sparkles className="h-4 w-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger value="active">
              <TrendingUp className="h-4 w-4 mr-2" />
              Active
            </TabsTrigger>
            <TabsTrigger value="my">
              <Users className="h-4 w-4 mr-2" />
              My History
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-4">
            {canCreateRedEnvelopes ? (
              <Card>
                <CardHeader>
                  <CardTitle>Create Red Envelope</CardTitle>
                  <CardDescription>
                    Share Nexa with multiple friends - they'll get random amounts!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Total Nexa Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="100"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="count">Number of Recipients</Label>
                    <Input
                      id="count"
                      type="number"
                      placeholder="5"
                      value={recipientCount}
                      onChange={(e) => setRecipientCount(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Distribution Type</Label>
                    <Select value={envelopeType} onValueChange={(v: 'random' | 'equal') => setEnvelopeType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random Amount (Lucky Draw)</SelectItem>
                        <SelectItem value="equal">Equal Split</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {envelopeType === 'random' 
                        ? 'Each person gets a random amount - more exciting!' 
                        : 'Everyone gets the same amount'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Happy holidays! 🎉"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      maxLength={100}
                    />
                  </div>

                  <Button 
                    className="w-full bg-red-500 hover:bg-red-600" 
                    onClick={handleCreateEnvelope}
                    disabled={loading || !totalAmount || !recipientCount}
                  >
                    {loading ? 'Creating...' : 'Create Red Envelope 🧧'}
                  </Button>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium">How it works:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Your Nexa is immediately deducted when you create the envelope</li>
                      <li>Others can claim until all portions are taken or 24 hours pass</li>
                      <li>Random mode: Each claim gets a different random amount</li>
                      <li>Equal mode: Everyone gets exactly the same amount</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/20">
                <CardContent className="py-12 text-center space-y-4">
                  <Gift className="h-16 w-16 mx-auto text-red-500" />
                  <div>
                    <h3 className="text-lg font-semibold">Platinum Feature</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Creating red envelopes requires a Platinum subscription.
                      {tier !== 'none' && (
                        <span className="block mt-1">Your current tier: <span className="font-medium">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span></span>
                      )}
                    </p>
                  </div>
                  <Button onClick={() => navigate('/premium')} className="bg-gradient-to-r from-primary to-primary/80">
                    {tier !== 'none' ? 'Upgrade to Platinum' : 'View Premium Plans'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    You can still claim red envelopes from others
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Active Tab */}
          <TabsContent value="active">
            <div className="space-y-3">
              {activeEnvelopes && activeEnvelopes.length > 0 ? (
                activeEnvelopes.map((envelope) => (
                  <RedEnvelopeCard
                    key={envelope.id}
                    envelope={envelope}
                    onClaim={refetch}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active red envelopes</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* My History Tab */}
          <TabsContent value="my">
            <div className="space-y-3">
              {myEnvelopes && myEnvelopes.length > 0 ? (
                myEnvelopes.map((envelope) => (
                  <Card key={envelope.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium">
                            {envelope.total_amount} Nexa · {envelope.recipient_count} people
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {envelope.claimed_count} / {envelope.recipient_count} claimed
                          </p>
                          {envelope.message && (
                            <p className="text-sm mt-1 italic">"{envelope.message}"</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{new Date(envelope.created_at).toLocaleDateString()}</p>
                          <p className={envelope.is_expired ? 'text-muted-foreground' : 'text-green-500'}>
                            {envelope.is_expired ? 'Completed' : 'Active'}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${(envelope.claimed_count / envelope.recipient_count) * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No red envelopes sent yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RedEnvelope;
