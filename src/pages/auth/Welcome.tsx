import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/10 via-secondary/10 to-background items-center justify-center p-8">
        <div className="max-w-md">
          <Logo size="lg" className="mb-8" />
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Welcome to AfuChat
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect with friends, share your thoughts, and join the conversation.
          </p>
        </div>
      </div>

      {/* Right side - Auth actions */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:hidden mb-8">
            <Logo size="md" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to AfuChat
            </h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">
              Join today
            </h2>

            <Button
              onClick={() => navigate('/auth/signup')}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              Create account
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?
              </p>
              <Button
                onClick={() => navigate('/auth/signin')}
                variant="outline"
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Sign in
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-8">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
