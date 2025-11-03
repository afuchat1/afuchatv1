import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
// Updated icon import: Changed 'X' to 'Minimize2' to match the screenshot's unique 'crossed lines'
import { Minimize2, Eye, EyeOff, User, AtSign, Mail, Lock, MessageCircle, ShoppingCart, Cpu } from 'lucide-react'; 
import Logo from '@/components/Logo';

interface AuthSheetContentProps {
  onClose: () => void;
}

interface AuthSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthSheetContent: React.FC<AuthSheetContentProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, handle },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        // User must confirm email before signing in
        toast.success('Account created! Check your email for verification.');
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        // Handling the "Email not confirmed" case explicitly for better user feedback
        if (error) {
            if (error.message.includes('Email not confirmed')) {
                toast.error('Email not confirmed. Please check your inbox for a verification link.');
            } else {
                throw error;
            }
        }
        toast.success('Signed in successfully!');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };
  
  // Placeholder function for handling Forgot Password
  const handleForgotPassword = () => {
    toast.info("Forgot Password functionality pending implementation.");
    // navigate('/reset-password'); // Uncomment and implement actual navigation/flow
  };

  return (
    <Card className="w-full border border-border/30 shadow-2xl rounded-2xl flex flex-col h-full backdrop-blur-md bg-white/90 dark:bg-gray-900/80">
      <CardHeader className="pt-4 pb-2 relative flex flex-col items-center">
        {/* Updated Cancel Icon: Using Minimize2 to visually match the crossed-line icon */}
        <DialogClose asChild>
          <button className="absolute right-3 top-3 p-0 rounded-full bg-transparent hover:bg-transparent">
            <Minimize2 className="h-5 w-5 text-muted-foreground" />
          </button>
        </DialogClose>

        <Logo size="sm" className="mb-2" />
        <CardTitle className="text-lg font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription className="text-xs text-center text-muted-foreground leading-snug">
          Post. Chat. Shop. AI. All in One
        </CardDescription>

        {/* Mini feature section */}
        <div className="flex justify-center gap-4 mt-3">
          <div className="flex flex-col items-center text-center text-xs text-muted-foreground">
            <MessageCircle className="h-5 w-5 text-primary mb-1" />
            Post
          </div>
          <div className="flex flex-col items-center text-center text-xs text-muted-foreground">
            <Cpu className="h-5 w-5 text-primary mb-1" />
            AI
          </div>
          <div className="flex flex-col items-center text-center text-xs text-muted-foreground">
            <ShoppingCart className="h-5 w-5 text-primary mb-1" />
            Shop
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 flex-1 overflow-y-auto flex flex-col">
        <form onSubmit={handleAuth} className="space-y-3 flex-1">
          {isSignUp && (
            <>
              <div className="space-y-0.5">
                <Label htmlFor="displayName" className="text-xs font-medium flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  Display Name
                </Label>
                <div className="relative">
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="h-9 pl-7 pr-2 text-xs bg-background/80 backdrop-blur-sm border border-border/40 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-md"
                  />
                  <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="handle" className="text-xs font-medium flex items-center gap-1">
                  <AtSign className="h-3 w-3 text-muted-foreground" />
                  Handle
                </Label>
                <div className="relative">
                  <Input
                    id="handle"
                    type="text"
                    placeholder="@handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                    className="h-9 pl-7 pr-2 text-xs bg-background/80 backdrop-blur-sm border border-border/40 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-md"
                  />
                  <AtSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-0.5">
            <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 pl-7 pr-2 text-xs bg-background/80 backdrop-blur-sm border border-border/40 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-md"
              />
              <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-0.5">
            <Label htmlFor="password" className="text-xs font-medium flex items-center gap-1">
              <Lock className="h-3 w-3 text-muted-foreground" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-9 pl-7 pr-9 text-xs bg-background/80 backdrop-blur-sm border border-border/40 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-md"
              />
              <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Added 'Forgot Password' Link */}
          {!isSignUp && (
            <div className="text-right pb-1">
                <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] text-primary/80 hover:text-primary transition-colors font-medium underline"
                >
                    Forgot Password?
                </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-9 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-100 bg-gradient-to-r from-primary to-secondary hover:from-primary/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="mr-1 animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                Processing...
              </>
            ) : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-3 text-center flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors duration-100"
          >
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span className="font-medium underline hover:no-underline">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[320px] sm:max-w-xs lg:max-w-sm mx-auto p-3 max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl backdrop-blur-md bg-card/95 border-border/20 border"
      >
        <div className="h-full flex flex-col
          data-[state=open]:animate-in
          data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0
          data-[state=open]:fade-in-0
          data-[state=closed]:zoom-out-95
          data-[state=open]:zoom-in-95
          data-[state=closed]:slide-out-to-left-1/2
          data-[state=closed]:slide-out-to-top-[48%]
          data-[state=open]:slide-in-from-left-1/2
          data-[state=open]:slide-in-from-top-[48%]"
        >
          <AuthSheetContent onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthSheet;
