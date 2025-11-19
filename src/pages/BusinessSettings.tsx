import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

interface BusinessAccount {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
}

const BusinessSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<BusinessAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    logo_url: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    loadBusinessAccount();
  }, [user]);

  const loadBusinessAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBusiness(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          website_url: data.website_url || '',
          logo_url: data.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading business:', error);
      toast.error('Failed to load business account');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (business) {
        // Update existing business
        const { error } = await supabase
          .from('business_accounts')
          .update({
            name: formData.name,
            description: formData.description || null,
            website_url: formData.website_url || null,
            logo_url: formData.logo_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', business.id);

        if (error) throw error;
        toast.success('Business account updated successfully!');
      } else {
        // Create new business
        const { error } = await supabase
          .from('business_accounts')
          .insert({
            owner_id: user?.id,
            name: formData.name,
            description: formData.description || null,
            website_url: formData.website_url || null,
            logo_url: formData.logo_url || null
          });

        if (error) throw error;
        toast.success('Business account created successfully!');
      }

      loadBusinessAccount();
    } catch (error: any) {
      console.error('Error saving business:', error);
      toast.error(error.message || 'Failed to save business account');
    } finally {
      setSaving(false);
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
              onClick={() => navigate('/settings')}
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
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {business ? 'Business Settings' : 'Create Business Account'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your business profile and information
              </p>
            </div>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter business name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us about your business"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                {formData.logo_url && (
                  <div className="mt-2">
                    <img
                      src={formData.logo_url}
                      alt="Business logo preview"
                      className="h-20 w-20 object-cover rounded-lg border border-border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : business ? 'Update Business' : 'Create Business'}
                </Button>
                {business && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/business/affiliates')}
                  >
                    Manage Affiliates
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BusinessSettings;
