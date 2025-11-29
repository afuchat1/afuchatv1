import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, X, CheckCircle2, XCircle, Upload, User } from 'lucide-react';
import Logo from '@/components/Logo';
import { emailSchema, passwordSchema, handleSchema, displayNameSchema } from '@/lib/validation';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { countries, detectUserCountry } from '@/lib/countries';
import { getCountryFlag } from '@/lib/countryFlags';

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [country, setCountry] = useState('');

  // Capture referral code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');

  // Auto-detect country on mount
  useEffect(() => {
    detectUserCountry().then((detectedCountry) => {
      if (detectedCountry && countries.includes(detectedCountry)) {
        setCountry(detectedCountry);
      }
    });
  }, []);

  // Check username availability with debounce
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 4) {
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }

    try {
      handleSchema.parse(username);
      setUsernameError('');
    } catch (error: any) {
      setUsernameStatus('idle');
      setUsernameError(error.errors?.[0]?.message || 'Invalid username');
      return;
    }

    setUsernameStatus('checking');

    try {
      // Case-insensitive username check
      const { data, error } = await supabase
        .from('profiles')
        .select('handle')
        .ilike('handle', username)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUsernameStatus('taken');
        setUsernameError('Username is already taken (usernames are case-insensitive)');
      } else {
        setUsernameStatus('available');
        setUsernameError('');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus('idle');
    }
  }, []);

  // Debounce username check
  useEffect(() => {
    if (!handle) {
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(handle);
    }, 500);

    return () => clearTimeout(timer);
  }, [handle, checkUsernameAvailability]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      setStep(2);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || 'Please enter a valid email');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate all inputs
      passwordSchema.parse(password);
      displayNameSchema.parse(displayName);
      handleSchema.parse(handle);

      // Check if username is available before proceeding
      if (usernameStatus !== 'available') {
        toast.error('Please choose an available username');
        return;
      }

      const signupData: any = {
        display_name: displayName,
        handle,
        country,
      };

      // Include referral code if present
      if (referralCode) {
        signupData.referral_code = referralCode;
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: signupData,
          emailRedirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          throw error;
        }
      } else {
        // Upload avatar if selected
        let avatarUrl = null;
        if (avatarFile && authData.user) {
          try {
            setUploadingAvatar(true);
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${authData.user.id}/${Date.now()}.${fileExt}`;
            
            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('avatars')
              .upload(fileName, avatarFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

            avatarUrl = publicUrl;

            // Update profile with avatar URL
            await supabase
              .from('profiles')
              .update({ avatar_url: avatarUrl })
              .eq('id', authData.user.id);
          } catch (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            // Don't block signup if avatar upload fails
          } finally {
            setUploadingAvatar(false);
          }
        }

        toast.success('Account created! Check your email for verification.');
        navigate('/auth/signin');
      }
    } catch (error: any) {
      // Check for username already taken errors (including case-insensitive)
      if (error.message?.includes('already taken') || 
          error.message?.includes('case-insensitive') ||
          error.code === '23505') {
        toast.error('Username is already taken (usernames are case-insensitive)');
      } else {
        toast.error(error.errors?.[0]?.message || error.message || 'An error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up with Google');
      setGoogleLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    setGithubLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up with GitHub');
      setGithubLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background animate-fade-in">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step === 1 ? navigate('/auth') : setStep(1)}
            className="mb-4"
          >
            <X className="h-5 w-5" />
          </Button>
          <Logo size="md" className="mb-6" />
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 2</p>
        </div>

        {step === 1 ? (
          <>
            <div className="space-y-3 animate-scale-in">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || githubLoading || loading}
              >
                {googleLoading ? 'Signing up...' : (
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base"
                onClick={handleGithubSignUp}
                disabled={googleLoading || githubLoading || loading}
              >
                {githubLoading ? 'Signing up...' : (
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                Continue with GitHub
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or sign up with email
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleNext} className="space-y-6 animate-scale-in">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
            >
              Next
            </Button>
          </form>
          </>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-6 animate-scale-in">
            <div className="space-y-2">
              <Label>Profile Picture (Optional)</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="bg-muted">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{avatarFile ? 'Change Image' : 'Upload Image'}</span>
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG, or GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Username</Label>
              <div className="relative">
                <Input
                  id="handle"
                  type="text"
                  placeholder="username"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  required
                  className={`h-12 pr-10 ${
                    usernameStatus === 'available' ? 'border-green-500' : 
                    usernameStatus === 'taken' ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                  {usernameStatus === 'available' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {usernameStatus === 'taken' && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              {usernameError ? (
                <p className="text-xs text-red-500">{usernameError}</p>
              ) : usernameStatus === 'available' ? (
                <p className="text-xs text-green-500">Username is available!</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Usernames are case-insensitive (e.g., "User" and "user" are the same)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-12 bg-background">
                  <SelectValue placeholder="Select your country">
                    {country && (
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{getCountryFlag(country)}</span>
                        <span className="font-medium">{country}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[400px] bg-background/98 backdrop-blur-xl border border-border/50 z-50">
                  <div className="p-2">
                    {countries.map((c) => (
                      <SelectItem 
                        key={c} 
                        value={c}
                        className="h-11 cursor-pointer rounded-lg hover:bg-accent/80 focus:bg-accent/80 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCountryFlag(c)}</span>
                          <span className="font-medium">{c}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {country ? 'Detected country' : 'Select your country'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={loading || googleLoading || githubLoading || usernameStatus !== 'available' || uploadingAvatar}
            >
              {loading || uploadingAvatar ? (
                <>
                  {uploadingAvatar ? 'Uploading...' : 'Creating account...'}
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/signin" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
