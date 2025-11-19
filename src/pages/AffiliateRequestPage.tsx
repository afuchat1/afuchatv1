import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessAccount {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
}

export default function AffiliateRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredBusinesses(
        businesses.filter(b => 
          b.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredBusinesses(businesses);
    }
  }, [searchQuery, businesses]);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('is_verified', true)
        .order('name');

      if (error) throw error;
      setBusinesses(data || []);
      setFilteredBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAffiliation = async (businessId: string) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('affiliate_requests')
        .insert({
          user_id: user.id,
          business_id: businessId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a request for this business');
        } else {
          throw error;
        }
      } else {
        toast.success('Affiliation request submitted! Waiting for admin approval.');
        navigate('/profile/' + user.id);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit affiliation request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-center text-muted-foreground">Please sign in to request affiliation</p>
          <Button onClick={() => navigate('/signin')} className="w-full mt-4">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Request Business Affiliation</h1>
            <p className="text-sm text-muted-foreground">Get verified with a business account</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Search Businesses</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by business name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No businesses found</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBusinesses.map(business => (
              <Card key={business.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{business.name}</h3>
                    {business.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {business.description}
                      </p>
                    )}
                    {business.website_url && (
                      <a
                        href={business.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        {business.website_url}
                      </a>
                    )}
                  </div>

                  <Button
                    onClick={() => handleRequestAffiliation(business.id)}
                    disabled={submitting}
                  >
                    Request
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}