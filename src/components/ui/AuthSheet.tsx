import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore: Assuming supabase client is correctly typed elsewhere, ignore for component typing
import { supabase } from '@/integrations/supabase/client'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { X, Eye, EyeOff } from 'lucide-react'; // Assuming lucide-react is available for icons; install if needed
import Logo from '@/components/Logo';

// --- Type Definitions ---

interface AuthSheetContentProps {
  onClose: () => void;
}

interface AuthSheetProps {
  isOpen: boolean;
  // Standard type for shadcn/ui Dialog/Sheet components open change handler
  onOpenChange: (open: boolean) => void;
}

// --- Auth Sheet Content Component ---

const AuthSheetContent: React.FC<AuthSheetContentProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');

  // Use TypeScript's specific type for form submission event
  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              handle: handle,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        
        toast.success('Account created! Check your email for verification.');
        onClose(); // Close the sheet after successful sign up
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success('Signed in successfully!');
        // No explicit navigate is needed; parent component/AuthContext handles re-render
        onClose(); 
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Card for professional, elevated appearance with subtle shadow and border
    <Card className="w-full border border-border/50 shadow-lg">
      <CardHeader className="space-y-4 pt-6 pb-4 relative">
        {/* Close button for better UX */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-8 w-8 p-0 rounded-full hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
        <div className="flex justify-center">
          <Logo size="lg" className="text-4xl" /> {/* Larger logo for richer visual */}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground leading-relaxed">
            {isSignUp
              ? 'Join AfuChat - the text-only messaging app built for Uganda'
              : 'Sign in to continue your conversations'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-8 pt-0">
        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle" className="text-sm font-medium">
                  Handle
                </Label>
                <Input
                  id="handle"
                  type="text"
                  placeholder="@youruniquehandle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-accent rounded"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
            {loading ? (
              <>
                <span className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Processing...
              </>
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
        <div className="mt-6 pt-6 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground mb-2">Or continue with</p>
          {/* Placeholder for future social auth buttons */}
          <div className="flex justify-center space-x-2">
            {/* Add social buttons here if needed, e.g., Google, etc. */}
          </div>
        </div>
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp
              ? 'Already have an account? '
              : "Don't have an account? "}
            <span className="font-medium underline hover:no-underline">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Exported AuthSheet Component (The Centered Dialog Wrapper) ---

const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-full max-w-sm sm:max-w-md mx-auto p-4 sm:p-0 overflow-hidden rounded-2xl shadow-2xl backdrop-blur-sm bg-card/95 border-border/20"
      >
        {/* Smooth slide-in animation for professional feel, responsive centering */}
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <AuthSheetContent onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthSheet;
