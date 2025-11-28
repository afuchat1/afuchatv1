import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { countries } from '@/lib/countries';

const CompleteProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    handle: '',
    phone_number: '',
    country: '',
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validation
    if (!formData.display_name || !formData.handle || !formData.phone_number || !formData.country) {
      toast.error('All fields are required');
      return;
    }
    
    if (!avatarFile) {
      toast.error('Profile picture is required');
      return;
    }

    setLoading(true);

    try {
      // Upload avatar
      const avatarUrl = await uploadAvatar();
      
      if (!avatarUrl) {
        toast.error('Failed to upload profile picture');
        setLoading(false);
        return;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          handle: formData.handle,
          phone_number: formData.phone_number,
          country: formData.country,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile completed successfully!');
      window.location.href = '/home';
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast.error(error.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide the following information to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-2">
              <Label>Profile Picture *</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="flex items-center justify-center w-24 h-24 rounded-full bg-muted cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </label>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Your display name"
                required
              />
            </div>

            {/* Username/Handle */}
            <div className="space-y-2">
              <Label htmlFor="handle">Username *</Label>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="username"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1234567890"
                required
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing Profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
