// src/pages/EditProfile.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// NOTE: Assuming your AuthContext provides 'user' and 'isLoading'
import { useAuth } from '@/contexts/AuthContext'; 
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; 
import { Loader2, User } from 'lucide-react'; 

import type { Database } from '@/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface EditProfileForm {
  display_name: string;
  handle: string;
  bio: string;
}

const EditProfile: React.FC = () => {
  // 💡 ASSUMPTION: useAuth now provides an isLoading flag for initial authentication check
  const { user, isLoading: authLoading } = useAuth(); 
  const navigate = useNavigate();

  const [profile, setProfile] = useState<EditProfileForm>({
    display_name: '',
    handle: '',
    bio: '',
  });
  const [profileLoading, setProfileLoading] = useState<boolean>(true); // Renamed internal loading state
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    // 1. Do nothing if auth is still loading (authLoading = true)
    if (authLoading) return;

    // 2. Redirect if no user is found after auth loads (Unauthenticated)
    if (!user) {
        toast.error("You must be logged in to edit your profile.");
        // Redirect to a safe place (e.g., login page)
        navigate('/login'); 
        return;
    }

    const fetchProfile = async () => {
      setProfileLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, handle, bio') 
          .eq('id', user.id)
          .single() as { data: ProfileRow | null; error: any };

        if (error) throw error;

        if (data) {
          setProfile({
            display_name: data.display_name,
            handle: data.handle,
            bio: data.bio || '',
          });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate, authLoading]); // Dependency array includes user and authLoading

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | React.TextareaHTMLAttributes<HTMLTextAreaElement>>
  ) => {
    const { name, value } = e.target;
    if (name === 'handle') {
      const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: sanitizedValue }));
      return;
    }
    setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: value }));
  };

  const handleSave = async () => {
    if (!user) return; // Should be handled by the useEffect redirect, but good defensive programming

    if (!profile.display_name.trim() || !profile.handle.trim()) {
        toast.error("Display Name and Handle are required.");
        return;
    }
    
    setSaving(true);
    try {
      const updateData: ProfileUpdate = {
        display_name: profile.display_name.trim(),
        handle: profile.handle.trim(),
        bio: profile.bio.trim() || null, 
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      // Assuming you want to navigate to the user's profile view
      navigate(`/${user.id}`); 
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.code === '23505') { 
          toast.error('The handle is already taken. Please choose another.');
      } else {
          toast.error('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/${user?.id}`);
  };

  // Show a spinner while AUTH is loading OR the PROFILE data is fetching
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // NOTE: If we reached here without a 'user' object, the useEffect redirect should have fired.
  // This return statement ensures the component still doesn't crash if the redirect is slow.
  if (!user) return null; 


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
