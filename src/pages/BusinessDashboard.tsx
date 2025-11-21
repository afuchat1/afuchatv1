import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMode } from '@/contexts/AccountModeContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Users, TrendingUp, DollarSign, UserCheck, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AffiliateRequest {
  id: string;
  user_id: string;
  notes: string | null;
  requested_at: string;
  status: string;
  profiles: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
}

interface Affiliate {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  xp: number;
}

interface BusinessStats {
  totalAffiliates: number;
  pendingRequests: number;
  totalEngagement: number;
}

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode, canUseBusiness } = useAccountMode();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BusinessStats>({ totalAffiliates: 0, pendingRequests: 0, totalEngagement: 0 });
  const [affiliateRequests, setAffiliateRequests] = useState<AffiliateRequest[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'approve' | 'reject'; requestId: string | null }>({
    open: false,
    type: 'approve',
    requestId: null
  });
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; requestId: string | null }>({
    open: false,
    requestId: null
  });
  const [commissionRate, setCommissionRate] = useState<string>('10');
  const [paymentTerms, setPaymentTerms] = useState<string>('Monthly payment based on affiliate performance');

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch pending affiliate requests
      const { data: requests, error: requestsError } = await supabase
        .from('affiliate_requests')
        .select(`
          id,
          user_id,
          notes,
          requested_at,
          status,
          profiles!affiliate_requests_user_id_fkey (
            display_name,
            handle,
            avatar_url
          )
        `)
        .eq('business_profile_id', user.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;
      setAffiliateRequests(requests as any || []);

      // Fetch current affiliates
      const { data: affiliateData, error: affiliatesError } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url, xp')
        .eq('affiliated_business_id', user.id)
        .eq('is_affiliate', true)
        .order('display_name');

      if (affiliatesError) throw affiliatesError;
      setAffiliates(affiliateData || []);

      // Calculate stats
      const totalEngagement = affiliateData?.reduce((sum, affiliate) => sum + affiliate.xp, 0) || 0;
      setStats({
        totalAffiliates: affiliateData?.length || 0,
        pendingRequests: requests?.length || 0,
        totalEngagement
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!approveDialog.requestId) return;
    
    const commissionValue = parseFloat(commissionRate);
    if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100) {
      toast.error('Please enter a valid commission rate between 0 and 100');
      return;
    }

    setProcessingRequest(approveDialog.requestId);
    try {
      const { data, error } = await supabase.rpc('approve_affiliate_by_business', {
        p_request_id: approveDialog.requestId,
        p_commission_rate: commissionValue,
        p_payment_terms: paymentTerms
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast.success('Affiliate request approved!');
        fetchDashboardData();
        setApproveDialog({ open: false, requestId: null });
        // Reset form
        setCommissionRate('10');
        setPaymentTerms('Monthly payment based on affiliate performance');
      } else {
        toast.error(result.message || 'Failed to approve request');
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const { data, error } = await supabase.rpc('reject_affiliate_by_business', {
        p_request_id: requestId,
        p_notes: null
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast.success('Affiliate request rejected');
        fetchDashboardData();
      } else {
        toast.error(result.message || 'Failed to reject request');
      }
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setProcessingRequest(null);
      setConfirmDialog({ open: false, type: 'reject', requestId: null });
    }
  };

  if (!canUseBusiness) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Business features are not enabled for your account.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Feed
        </Button>

        <div className="mb-8">
          <Logo />
          <h1 className="text-3xl font-bold mt-4">Business Dashboard</h1>
          <p className="text-muted-foreground">Manage your affiliates and track business performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Affiliates</p>
                <p className="text-2xl font-bold">{stats.totalAffiliates}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Nexa Generated</p>
                <p className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs for Requests and Affiliates */}
        <Card className="p-6">
          <Tabs defaultValue="requests">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">
                Affiliate Requests
                {stats.pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-2">{stats.pendingRequests}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="affiliates">
                My Affiliates ({stats.totalAffiliates})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : affiliateRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending affiliate requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {affiliateRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{request.profiles.display_name}</h3>
                              <span className="text-muted-foreground">@{request.profiles.handle}</span>
                            </div>
                            {request.notes && (
                              <p className="text-sm text-muted-foreground mb-2">{request.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Requested {new Date(request.requested_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setApproveDialog({ open: true, requestId: request.id })}
                            disabled={processingRequest === request.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDialog({ open: true, type: 'reject', requestId: request.id })}
                            disabled={processingRequest === request.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="affiliates" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : affiliates.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No affiliates yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Approve affiliate requests to grow your network
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {affiliates.map((affiliate) => (
                    <Card key={affiliate.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{affiliate.display_name}</h3>
                              <span className="text-muted-foreground">@{affiliate.handle}</span>
                              <Badge variant="secondary">Affiliate</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {affiliate.xp.toLocaleString()} Nexa
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/${affiliate.id}`)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Approval Dialog with Commission Configuration */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ ...approveDialog, open })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve Affiliate Request</DialogTitle>
            <DialogDescription>
              Configure commission rate and payment terms for this affiliate partnership.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Commission Rate (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="10"
              />
              <p className="text-sm text-muted-foreground">
                Percentage of earnings the affiliate will receive
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-terms">Payment Terms</Label>
              <Textarea
                id="payment-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Monthly payment based on affiliate performance"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Describe how and when affiliates will be paid
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialog({ open: false, requestId: null })}
              disabled={processingRequest !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveRequest}
              disabled={processingRequest !== null}
            >
              {processingRequest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Affiliate Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this affiliate request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.requestId) {
                  handleRejectRequest(confirmDialog.requestId);
                }
              }}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BusinessDashboard;
