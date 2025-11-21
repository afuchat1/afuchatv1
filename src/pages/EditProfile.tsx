import { useState, useEffect } from 'react';
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
import { Loader2, User, Lock, Eye, MessageCircle, Upload, X, Building2 } from 'lucide-react';
import { handleSchema, displayNameSchema, bioSchema } from '@/lib/validation';
import { useNexa } from '@/hooks/useNexa';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Import Supabase types
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface EditProfileForm {
  display_name: string;
  handle: string;
  bio: string;
  website_url: string;
  is_private: boolean;
  show_online_status: boolean;
  show_read_receipts: boolean;
  avatar_url: string | null;
}

const EditProfile: React.FC = () => {
  // 🚨 FIX 1: Access the 'loading' state from useAuth. This is the global auth status.
  const { user, loading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { checkProfileCompletion } = useNexa();

  const [profile, setProfile] = useState<EditProfileForm>({
    display_name: '',
    handle: '',
    bio: '',
    website_url: '',
    is_private: false,
    show_online_status: true,
    show_read_receipts: true,
    avatar_url: null,
  });
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true); 
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);

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
            website_url: data.website_url || '',
            is_private: data.is_private || false,
            show_online_status: data.show_online_status || true,
            show_read_receipts: data.show_read_receipts || true,
            avatar_url: data.avatar_url || null,
          });
          setIsBusiness(data.is_business_mode || false);
          setIsAffiliate(data.is_affiliate || false);
        } else {
          setProfile({
            display_name: user.user_metadata?.full_name || '',
            handle: user.user_metadata?.user_name || '',
            bio: '',
            website_url: '',
            is_private: false,
            show_online_status: true,
            show_read_receipts: true,
            avatar_url: null,
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
        id: user.id,
        display_name: profile.display_name.trim(),
        handle: profile.handle.trim(),
        bio: profile.bio.trim() || null,
        website_url: profile.website_url.trim() || null,
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
      
      // Check for profile completion reward
      await checkProfileCompletion();
      
      navigate(`/${user.id}`);
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.code === '23505' || error.message.includes('already taken')) { 
          toast.error('Username is already taken (usernames are case-insensitive)');
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileName = `${user.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      // Remove from storage if exists
      if (profile.avatar_url) {
        const fileName = profile.avatar_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('avatars').remove([`${user.id}/${fileName}`]);
        }
      }

      // Update profile
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);

      setProfile((prev) => ({ ...prev, avatar_url: null }));
      toast.success('Avatar removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveAvatar = async (blob: Blob) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldFileName}`]);
        }
      }

      // Upload new avatar
      const fileName = `${user.id}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // Update profile
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
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
        <CardContent className="p-6 space-y-8">
          {/* Avatar Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 text-primary">Profile Picture</h3>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                <AvatarFallback className="bg-muted text-2xl">
                  {profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  <Label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingAvatar}
                      asChild
                    >
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                      </span>
                    </Button>
                  </Label>
                  {profile.avatar_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, or GIF (max 5MB). Square images work best.
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-border/50" />

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

            {/* Website URL - Only for business/affiliate users */}
            {(isBusiness || isAffiliate) && (
              <>
                <h3 className="text-lg font-semibold border-b pb-2 text-primary">Additional Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="website_url" className="text-sm font-medium text-foreground">
                    Business Website
                  </Label>
                  <Input
                    id="website_url"
                    name="website_url"
                    value={profile.website_url}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                    disabled={saving}
                    className="text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your business website or portfolio
                  </p>
                </div>
              </>
            )}
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
