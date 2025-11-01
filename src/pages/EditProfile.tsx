import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; // **NEW IMPORT for clean visual breaks**
import { Loader2, User, Link, MapPin } from 'lucide-react'; // **NEW ICONS**

// Import Supabase types (assuming types/supabase.ts exists)
import type { Database } from '@/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface EditProfileForm {
  display_name: string;
  handle: string;
  bio: string;
}

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<EditProfileForm>({
    display_name: '',
    handle: '',
    bio: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // --- Data Fetching Logic (Unchanged for optimization) ---
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      // NOTE: Added a check to ensure user.id exists before fetching
      if (!user.id) {
          setLoading(false);
          toast.error("User ID not found.");
          return;
      }

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
          });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    // NOTE: Conditional fetch based on user presence and ID consistency (though id is from useParams and user.id is from context)
    // For simplicity, sticking to user.id for the fetch, assuming the route param is for viewing, but edit is always for the logged in user.
    if (user.id) {
        fetchProfile();
    }
  }, [user, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Simple client-side validation for handle: ensure no spaces/special chars (optional but good UX)
    if (name === 'handle') {
      const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: sanitizedValue }));
      return;
    }
    setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Quick validation check
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
      navigate(`/profile/${user.id}`);
    } catch (error: any) {
      console.error('Update error:', error);
      // More specific error for handle conflict
      if (error.code === '23505') { // PostgreSQL unique violation code
          toast.error('The handle is already taken. Please choose another.');
      } else {
          toast.error('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/profile/${user.id}`);
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
      <Card className="w-full max-w-4xl border-none md:border md:shadow-none bg-card/80 backdrop-blur-sm"> {/* Wider for two columns */}
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-3xl font-extrabold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" /> Edit Profile
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Update your personal and public-facing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* --- PRIMARY INFO COLUMN (Col 1-2) --- */}
            <div className="md:col-span-2 space-y-6">
              
              <h3 className="text-lg font-semibold border-b pb-2 text-primary">Basic Information</h3>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-sm font-medium text-foreground">Display Name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={profile.display_name}
                  onChange={handleInputChange}
                  placeholder="Your display name"
                  disabled={saving}
                  className="text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50" // Flat style
                />
              </div>

              {/* Handle (Username) */}
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
                    className="pl-7 text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50" // Flat style
                  />
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Your public, unique identifier. Only lowercase letters, numbers, and underscores.
                </p>
              </div>

              {/* Bio */}
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
                  className="text-base resize-none bg-input/50 border border-border/80 focus:border-primary/50" // Flat style
                />
                <p className="text-xs text-muted-foreground flex justify-between">
                  <span>Keep it short and punchy!</span>
                  <span>{profile.bio.length}/150</span>
                </p>
              </div>
            </div>

            {/* --- SECONDARY INFO COLUMN (Col 3) --- */}
            <div className="md:col-span-1 space-y-6 md:border-l md:pl-8 border-border/50">
              <h3 className="text-lg font-semibold border-b pb-2 text-primary">Additional Details</h3>
              
              {/* Location - Coming Soon (Improved UX) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Location
                </Label>
                <div className="p-3 bg-muted/50 flex items-center justify-start rounded-lg text-sm text-muted-foreground border border-dashed border-border/80">
                  Feature coming soon to allow users to set their location.
                </div>
              </div>

              {/* Website - Coming Soon (Improved UX) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Link className="h-4 w-4" /> Website/Portfolio
                </Label>
                <div className="p-3 bg-muted/50 flex items-center justify-start rounded-lg text-sm text-muted-foreground border border-dashed border-border/80">
                  Link your personal website or portfolio.
                </div>
              </div>
            </div>
            
          </div>
          
          <Separator className="my-8 bg-border/50" />
          
          {/* Actions */}
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
