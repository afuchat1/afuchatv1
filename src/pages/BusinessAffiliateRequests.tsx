import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

interface AffiliateRequest {
  id: string;
  user_id: string;
  status: string;
  notes: string | null;
  requested_at: string;
  profiles: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
}

const BusinessAffiliateRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AffiliateRequest[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Check if user has business profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, business_name')
        .eq('id', user?.id)
        .single();

      if (profileError || !profile?.business_name) {
        toast.error('Business profile not found. Please set up your business profile first.');
        navigate('/settings');
        return;
      }

      setBusinessId(profile.id);

      // Load affiliate requests
      const { data, error } = await supabase
        .from('affiliate_requests')
        .select(`
          *,
          profiles!affiliate_requests_user_id_fkey (
            display_name,
            handle,
            avatar_url
          )
        `)
        .eq('business_profile_id', profile.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load affiliate requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_affiliate_request', {
        p_request_id: requestId
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast.success('Affiliate request approved!');
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('reject_affiliate_request', {
        p_request_id: requestId,
        p_notes: 'Rejected by business owner'
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast.success('Affiliate request rejected');
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/business/settings')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo size="sm" />
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Affiliate Requests</h1>
            <p className="text-muted-foreground mt-1">
              Manage users who want to become affiliates
            </p>
          </div>

          {requests.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No affiliate requests yet</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {request.profiles.display_name}
                        </h3>
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'default'
                              : request.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{request.profiles.handle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {new Date(request.requested_at).toLocaleDateString()}
                      </p>

                      {request.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BusinessAffiliateRequests;
