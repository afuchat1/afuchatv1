import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, Check, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { countries } from '@/lib/countries';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getCountryFlag } from '@/lib/countryFlags';

const CompleteProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    display_name: '',
    handle: '',
    phone_number: '',
    country: '',
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string>('');

  // Load existing profile data on mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, handle, phone_number, country, avatar_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData({
            display_name: profile.display_name || '',
            handle: profile.handle || '',
            phone_number: profile.phone_number || '',
            country: profile.country || '',
          });
          
          if (profile.avatar_url) {
            setExistingAvatarUrl(profile.avatar_url);
            setAvatarPreview(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadExistingProfile();
  }, [user]);

  useEffect(() => {
    calculateProgress();
  }, [formData, avatarFile, existingAvatarUrl, avatarPreview]);

  const calculateProgress = () => {
    let completed = 0;
    const total = 5; // 5 fields total
    
    if (formData.display_name) completed++;
    if (formData.handle) completed++;
    if (avatarFile || existingAvatarUrl) completed++;
    if (formData.phone_number) completed++;
    if (formData.country) completed++;
    
    setProgress((completed / total) * 100);
  };

  const getStepStatus = (fieldName: string) => {
    switch (fieldName) {
      case 'avatar':
        return (avatarFile || existingAvatarUrl) ? 'complete' : 'pending';
      case 'display_name':
        return formData.display_name ? 'complete' : 'pending';
      case 'handle':
        return formData.handle ? 'complete' : 'pending';
      case 'phone_number':
        return formData.phone_number ? 'complete' : 'pending';
      case 'country':
        return formData.country ? 'complete' : 'pending';
      default:
        return 'pending';
    }
  };

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
    
    // Validation - only require essential fields
    if (!formData.display_name || !formData.handle) {
      toast.error('Display name and username are required');
      return;
    }
    
    // Check if we have an avatar (either new file or existing)
    const hasAvatar = avatarFile || existingAvatarUrl;
    if (!hasAvatar) {
      toast.error('Profile picture is required');
      return;
    }

    setLoading(true);

    try {
      // Upload avatar only if new file selected
      let avatarUrl = existingAvatarUrl;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (!uploadedUrl) {
          toast.error('Failed to upload profile picture');
          setLoading(false);
          return;
        }
        avatarUrl = uploadedUrl;
      }

      // Check if user has already been rewarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completion_rewarded, xp')
        .eq('id', user.id)
        .single();

      const isFullyCompleted = formData.phone_number && formData.country;
      const shouldReward = isFullyCompleted && !profile?.profile_completion_rewarded;

      // Update profile
      const updateData: any = {
        display_name: formData.display_name,
        handle: formData.handle,
        avatar_url: avatarUrl,
      };

      if (formData.phone_number) updateData.phone_number = formData.phone_number;
      if (formData.country) updateData.country = formData.country;

      // Award XP if fully completed and not rewarded before
      if (shouldReward) {
        updateData.xp = (profile?.xp || 0) + 100;
        updateData.profile_completion_rewarded = true;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      if (shouldReward) {
        setShowRewardModal(true);
        setTimeout(() => {
          setShowRewardModal(false);
          window.location.href = '/home';
        }, 3000);
      } else {
        toast.success('Profile completed successfully!');
        window.location.href = '/home';
      }
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast.error(error.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Required: Profile picture, display name, and username. Phone and country are optional but earn rewards!
            </CardDescription>
            
            {/* Progress Indicator */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profile Progress</span>
                <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {/* Progress Steps */}
              <div className="grid grid-cols-5 gap-2 mt-4">
                {[
                  { name: 'avatar', label: 'Photo', icon: Camera },
                  { name: 'display_name', label: 'Name', icon: Check },
                  { name: 'handle', label: 'Username', icon: Check },
                  { name: 'phone_number', label: 'Phone', icon: Sparkles },
                  { name: 'country', label: 'Country', icon: Sparkles },
                ].map((step) => {
                  const StepIcon = step.icon;
                  const status = getStepStatus(step.name);
                  return (
                    <div
                      key={step.name}
                      className={`flex flex-col items-center gap-1 transition-all ${
                        status === 'complete' ? 'opacity-100' : 'opacity-40'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          status === 'complete'
                            ? 'bg-primary text-primary-foreground scale-110'
                            : 'bg-muted'
                        }`}
                      >
                        {status === 'complete' ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <span className="text-xs text-center">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
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
              <Label htmlFor="phone_number">Phone Number (Optional)</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1234567890"
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country (Optional)</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger className="h-12 bg-background">
                  <SelectValue placeholder="Select your country">
                    {formData.country && (
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{getCountryFlag(formData.country)}</span>
                        <span className="font-medium">{formData.country}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[400px] bg-background/98 backdrop-blur-xl border border-border/50 z-50">
                  <div className="p-2">
                    {countries.map((country) => (
                      <SelectItem 
                        key={country} 
                        value={country}
                        className="h-11 cursor-pointer rounded-lg hover:bg-accent/80 focus:bg-accent/80 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCountryFlag(country)}</span>
                          <span className="font-medium">{country}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
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
                <>
                  Complete Profile
                  {formData.phone_number && formData.country && (
                    <Trophy className="h-4 w-4 ml-2 text-yellow-500" />
                  )}
                </>
              )}
            </Button>
            
            {formData.phone_number && formData.country && (
              <p className="text-xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-yellow-500" />
                Complete all fields to earn 100 Nexa reward!
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>

    {/* Reward Modal */}
    <Dialog open={showRewardModal} onOpenChange={setShowRewardModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-scale-in">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Congratulations! 🎉</DialogTitle>
          <DialogDescription className="text-center text-base">
            You've completed your profile and earned your reward!
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Profile Completion Reward</p>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <span className="text-4xl font-bold text-primary">+100</span>
            <span className="text-2xl font-semibold">Nexa</span>
          </div>
          <p className="text-xs text-muted-foreground">Keep earning by staying active!</p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CompleteProfile;
