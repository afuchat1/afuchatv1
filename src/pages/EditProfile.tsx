import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Lock, Eye, MessageCircle, MapPin, Globe, AlertCircle } from 'lucide-react';

// Import Supabase types
import type { Database } from '@/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface EditProfileForm {
  display_name: string;
  handle: string;
  bio: string;
  is_private: boolean;
  show_online_status: boolean;
  show_read_receipts: boolean;
}

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState<EditProfileForm>({
    display_name: '',
    handle: '',
    bio: '',
    is_private: false,
    show_online_status: true,
    show_read_receipts: true,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState<boolean>(false);

  // Debounced handle availability check
  useEffect(() => {
    if (!user?.id || !profile.handle || profile.handle.length < 3) {
      setHandleAvailable(null);
      return;
    }

    const checkHandle = async () => {
      setCheckingHandle(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .neq('id', user.id)
          .eq('handle', profile.handle.toLowerCase())
          .maybeSingle();

        setHandleAvailable(!data);
      } catch (err) {
        console.error('Handle check failed:', err);
        setHandleAvailable(null);
      } finally {
        setCheckingHandle(false);
      }
    };

    const timeout = setTimeout(checkHandle, 500);
    return () => clearTimeout(timeout);
  }, [profile.handle, user?.id]);

  // Fetch profile on mount
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      toast.error("User not authenticated.");
      return;
    }

    // Security: Only allow editing own profile
    if (userId && userId !== user.id) {
      toast.error('Access denied: You can only edit your own profile.');
      navigate(`/${user.id}`);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setProfile({
            display_name: data.display_name || '',
            handle: data.handle || '',
            bio: data.bio || '',
            is_private: data.is_private || false,
            show_online_status: data.show_online_status ?? true,
            show_read_receipts: data.show_read_receipts ?? true,
          });
        } else {
          // New user: pre-fill from auth metadata
          setProfile(prev => ({
            ...prev,
            display_name: user.user_metadata?.full_name || '',
            handle: (user.user_metadata?.user_name || '').toLowerCase().replace(/[^a-z0-9_]/g, ''),
          }));
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userId, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'handle') {
      const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
      setProfile(prev => ({ ...prev, handle: sanitized }));
      return;
    }

    if (name === 'display_name') {
      setProfile(prev => ({ ...prev, display_name: value.slice(0, 50) }));
      return;
    }

    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (
    key: keyof Pick<EditProfileForm, 'is_private' | 'show_online_status' | 'show_read_receipts'>
  ) => {
    setProfile(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;

    const trimmedName = profile.display_name.trim();
    const trimmedHandle = profile.handle.trim();

    if (!trimmedName || !trimmedHandle) {
      toast.error("Display Name and Handle are required.");
      return;
    }

    if (trimmedHandle.length < 3) {
      toast.error("Handle must be at least 3 characters.");
      return;
    }

    if (handleAvailable === false) {
      toast.error("This handle is already taken.");
      return;
    }

    setSaving(true);
    try {
      const upsertData: ProfileUpdate & { id: string } = {
        id: user.id,
        display_name: trimmedName,
        handle: trimmedHandle,
        bio: profile.bio.trim() || null,
        is_private: profile.is_private,
        show_online_status: profile.show_online_status,
        show_read_receipts: profile.show_read_receipts,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(upsertData, {
          onConflict: 'id',
        });

      if (error) throw error;

      toast.success('Profile updated successfully!');
      navigate(`/${user.id}`);
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.code === '23505') {
        toast.error('Handle already taken. Please choose another.');
        setHandleAvailable(false);
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/${user?.id || ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl border-none md:border md:shadow-none bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-3xl font-extrabold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Edit Profile
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Update your public information and privacy settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-6">

            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 text-primary">Basic Information</h3>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    value={profile.display_name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    disabled={saving}
                    maxLength={50}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">{profile.display_name.length}/50</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handle">Handle (Username)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="handle"
                      name="handle"
                      value={profile.handle}
                      onChange={handleInputChange}
                      placeholder="unique_handle"
                      disabled={saving}
                      className="pl-7 h-11"
                      maxLength={30}
                    />
                    {checkingHandle && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">
                      Only lowercase letters, numbers, and underscores.
                    </span>
                    {handleAvailable === true && (
                      <span className="text-green-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Available
                      </span>
                    )}
                    {handleAvailable === false && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Taken
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself (max 150 chars)"
                    rows={4}
                    maxLength={150}
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {profile.bio.length}/150
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Privacy Settings */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 text-primary">Privacy Settings</h3>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Private Account</p>
                      <p className="text-xs text-muted-foreground">Only approved followers can see your posts</p>
                    </div>
                  </div>
                  <Switch
                    checked={profile.is_private}
                    onCheckedChange={() => handleToggleChange('is_private')}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Show Online Status</p>
                      <p className="text-xs text-muted-foreground">Let others see when you're active</p>
                    </div>
                  </div>
                  <Switch
                    checked={profile.show_online_status}
                    onCheckedChange={() => handleToggleChange('show_online_status')}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Show Read Receipts</p>
                      <p className="text-xs text-muted-foreground">Others see when you've read messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={profile.show_read_receipts}
                    onCheckedChange={() => handleToggleChange('show_read_receipts')}
                    disabled={saving}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Coming Soon */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 text-primary">Additional Information</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </Label>
                  <div className="h-11 bg-muted/50 rounded-md flex items-center justify-center text-sm text-muted-foreground">
                    Coming soon
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Website
                  </Label>
                  <div className="h-11 bg-muted/50 rounded-md flex items-center justify-center text-sm text-muted-foreground">
                    Coming soon
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="px-8 h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || handleAvailable === false || checkingHandle}
                className="px-8 h-12"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
