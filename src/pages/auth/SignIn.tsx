import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/Logo';
import { emailSchema, passwordSchema } from '@/lib/validation';
import TelegramLoginButton from '@/components/auth/TelegramLoginButton';

const SignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Email not confirmed. Please check your inbox for a verification link.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password.');
        } else {
          throw error;
        }
      } else {
        toast.success('Signed in successfully!');
        navigate('/home');
      }
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
      toast.error(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
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
      toast.error(error.message || 'Failed to sign in with GitHub');
      setGithubLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Subtle gradient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Logo */}
      <div className="relative z-10 p-6">
        <Logo size="sm" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-8">
        <h1 className="text-3xl font-bold text-foreground mb-16">Welcome back</h1>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground text-base">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 text-base bg-muted/50 rounded-xl px-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground text-base">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 text-base bg-muted/50 rounded-xl px-4 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground"
            disabled={loading || googleLoading || githubLoading}
          >
            {loading ? 'Signing in...' : 'Continue'}
          </Button>
        </form>

        {/* Other ways to log in */}
        <div className="mt-12">
          <p className="text-foreground font-medium mb-4">Other ways to log in</p>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-14 rounded-xl bg-white hover:bg-gray-100 text-foreground"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || githubLoading || loading}
            >
              {googleLoading ? '...' : (
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1 h-14 rounded-xl bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
              onClick={handleGithubSignIn}
              disabled={googleLoading || githubLoading || loading}
            >
              {githubLoading ? '...' : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
            </Button>
          </div>

          <div className="mt-4">
            <TelegramLoginButton 
              disabled={googleLoading || githubLoading || loading} 
              mode="signin"
            />
          </div>
        </div>

        {/* Bottom links */}
        <div className="mt-auto pb-8 pt-8 text-center space-y-4">
          <Link
            to="/auth/forgot-password"
            className="text-foreground underline text-base"
          >
            Forgot password?
          </Link>
          
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-primary font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default SignIn;
