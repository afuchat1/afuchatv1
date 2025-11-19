import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import { BusinessBadge } from '@/components/BusinessBadge';

interface BusinessProfile {
  id: string;
  display_name: string;
  handle: string;
  website_url: string | null;
}

const AffiliateRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProfiles, setFetchingProfiles] = useState(true);
  const [existingRequest, setExistingRequest] = useState(false);

  useEffect(() => {
    fetchBusinessProfiles();
    checkExistingRequest();
  }, [user]);

  const fetchBusinessProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, handle, website_url')
        .eq('is_business_mode', true)
        .order('display_name');

      if (error) throw error;
      setBusinessProfiles(data || []);
    } catch (error) {
      console.error('Error fetching business profiles:', error);
      toast.error('Failed to load business profiles');
    } finally {
      setFetchingProfiles(false);
    }
  };

  const checkExistingRequest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('affiliate_requests')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (!error && data) {
        setExistingRequest(true);
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedBusiness) {
      toast.error('Please select a business to affiliate with');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('affiliate_requests')
        .insert({
          user_id: user.id,
          business_profile_id: selectedBusiness,
          notes: notes.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Affiliate request submitted successfully! It will be reviewed by an admin.');
      navigate('/settings');
    } catch (error: any) {
      console.error('Error submitting affiliate request:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (existingRequest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Logo />
          </div>

          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Request Pending</h2>
            <p className="text-muted-foreground mb-6">
              You already have a pending affiliate request. Please wait for an admin to review it.
            </p>
            <Button onClick={() => navigate('/settings')}>
              Back to Settings
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>

        <div className="mb-8">
          <Logo />
        </div>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Apply for Affiliate Status</h1>
            <p className="text-muted-foreground">
              Select a business profile you'd like to affiliate with. Your request will be reviewed by an admin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="business">Business Profile *</Label>
              {fetchingProfiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : businessProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No business profiles available at the moment.
                </p>
              ) : (
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessProfiles.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        <div className="flex items-center gap-2">
                          <BusinessBadge size="sm" />
                          <span className="font-medium">{business.display_name}</span>
                          <span className="text-muted-foreground">@{business.handle}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-muted-foreground">
                Choose the business you want to become an affiliate of
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us why you'd like to affiliate with this business..."
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground">
                {notes.length}/500 characters
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !selectedBusiness || fetchingProfiles}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/settings')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateRequest;
