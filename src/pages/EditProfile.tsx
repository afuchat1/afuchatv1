import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// 🚨 NOTE: useAuth now returns 'loading' which we need to access.
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
import { Loader2, User, Lock, Eye, MessageCircle, MapPin, Globe } from 'lucide-react';
import { handleSchema, displayNameSchema, bioSchema } from '@/lib/validation';

// Import Supabase types
import type { Database } from '@/integrations/supabase/types';

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
  // 🚨 FIX 1: Access the 'loading' state from useAuth. This is the global auth status.
  const { user, loading: isLoadingAuth } = useAuth();
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
  // This state tracks profile data fetching, separate from global auth loading.
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true); 
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    // 🚨 FIX 2: Check the global Auth loading state first. Exit if still checking session.
    if (isLoadingAuth) {
        return; 
    }

    // Now that auth check is complete:
    if (!user?.id) {
        // Only show error/redirect if the session check is complete AND no user was found.
        setLoadingProfile(false); 
        toast.error("You must be logged in to edit your profile.");
        // Assuming you have a /login route
        navigate('/login'); 
        return;
    }

    // Verify route matches current user
    if (userId && userId !== user.id) {
      toast.error('Access denied: Can only edit your own profile');
      navigate(`/${user.id}`);
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: ProfileRow | null; error: any };

        if (error) throw error;

        if (data) {
          setProfile({
            display_name: data.display_name,
            handle: data.handle,
            bio: data.bio || '',
            is_private: data.is_private || false,
            show_online_status: data.show_online_status || true,
            show_read_receipts: data.show_read_receipts || true,
          });
        } else {
          setProfile({
            display_name: user.user_metadata?.full_name || '',
            handle: user.user_metadata?.user_name || '',
            bio: '',
            is_private: false,
            show_online_status: true,
            show_read_receipts: true,
          });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        // Set the profile loading state to false
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  // 🚨 FIX 3: Add the global auth loading state to the dependency array
  }, [user, navigate, userId, isLoadingAuth]); 

  // ... (Input handlers and Save handler remain as previously corrected)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'handle') {
      const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: sanitizedValue }));
      return;
    }
    setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: value }));
  };

  const handleToggleChange = (key: keyof Pick<EditProfileForm, 'is_private' | 'show_online_status' | 'show_read_receipts'>) => {
    setProfile((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;

    if (!profile.display_name.trim() || !profile.handle.trim()) {
        toast.error("Display Name and Handle are required.");
        return;
    }
    
    // Validate inputs
    try {
      handleSchema.parse(profile.handle);
      displayNameSchema.parse(profile.display_name);
      if (profile.bio) bioSchema.parse(profile.bio);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || 'Validation failed');
      return;
    }
    
    setSaving(true);
    try {
      const updateData: ProfileUpdate = {
        id: user.id, // CRITICAL: Explicitly include the user ID
        display_name: profile.display_name.trim(),
        handle: profile.handle.trim(),
        bio: profile.bio.trim() || null, 
        is_private: profile.is_private,
        show_online_status: profile.show_online_status,
        show_read_receipts: profile.show_read_receipts,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      navigate(`/${user.id}`);
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.code === '23505') { 
          toast.error('The handle is already taken. Please choose another.');
      } else if (error.code === '42501' || error.message.includes('permission denied')) {
          toast.error('Permission denied. Please ensure RLS policies are correct in Supabase.');
      } else {
          toast.error(`Failed to update profile. Error: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/${user?.id}`);
  };

  // 🚨 FIX 4: Check BOTH the global auth loading and the local profile fetching state.
  if (isLoadingAuth || loadingProfile) {
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
            <User className="h-6 w-6 text-primary" /> Edit Profile
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Update your basic public-facing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            {/* ... rest of the form ... */}
            <div className="space-y-6">
            
            <h3 className="text-lg font-semibold border-b pb-2 text-primary">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-sm font-medium text-foreground">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={profile.display_name}
                onChange={handleInputChange}
                placeholder="Your display name"
                disabled={saving}
                className="text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle" className="text-sm font-medium text-foreground">Handle (Username)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="handle"
                  name="handle"
                  value={profile.handle}
                  onChange={handleInputChange}
                  placeholder="unique_handle"
                  disabled={saving}
                  className="pl-7 text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50" 
                />
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Your public, unique identifier. Only lowercase letters, numbers, and underscores.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-foreground">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself (max 150 chars)"
                rows={4}
                maxLength={150}
                disabled={saving}
                className="text-base resize-none bg-input/50 border border-border/80 focus:border-primary/50" 
              />
              <p className="text-xs text-muted-foreground flex justify-between">
                <span>Keep it short and punchy!</span>
                <span>{profile.bio.length}/150</span>
              </p>
            </div>

            <Separator className="my-8 bg-border/50" />

            <h3 className="text-lg font-semibold border-b pb-2 text-primary">Privacy Settings</h3>

            {/* Private Account Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Private Account
              </Label>
              <div className="flex items-center justify-between p-3 bg-input/50 rounded-md">
                <p className="text-xs text-muted-foreground">Only approved followers can see your posts and profile</p>
                <Switch
                  checked={profile.is_private}
                  onCheckedChange={() => handleToggleChange('is_private')}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Show Online Status Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                Show Online Status
              </Label>
              <div className="flex items-center justify-between p-3 bg-input/50 rounded-md">
                <p className="text-xs text-muted-foreground">Display when you're active on AfuChat</p>
                <Switch
                  checked={profile.show_online_status}
                  onCheckedChange={() => handleToggleChange('show_online_status')}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Show Read Receipts Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Show Read Receipts
              </Label>
              <div className="flex items-center justify-between p-3 bg-input/50 rounded-md">
                <p className="text-xs text-muted-foreground">Let others see when you've read their messages</p>
                <Switch
                  checked={profile.show_read_receipts}
                  onCheckedChange={() => handleToggleChange('show_read_receipts')}
                  disabled={saving}
                />
              </div>
            </div>

            <Separator className="my-8 bg-border/50" />

            <h3 className="text-lg font-semibold border-b pb-2 text-primary">Additional Information</h3>

            {/* Location - Coming Soon */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location
              </Label>
              <div className="h-11 bg-muted/50 flex items-center justify-center rounded-md text-sm text-muted-foreground">
                Coming soon
              </div>
            </div>

            {/* Website - Coming Soon */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Website
              </Label>
              <div className="h-11 bg-muted/50 flex items-center justify-center rounded-md text-sm text-muted-foreground">
                Coming soon
              </div>
            </div>
          </div>
          
          <Separator className="my-8 bg-border/50" />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="px-8 h-12 text-base border-border/80 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 h-12 text-base bg-primary hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
