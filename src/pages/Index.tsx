import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CustomLoader } from '@/components/ui/CustomLoader';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      // Authenticated users go directly to home
      navigate('/home', { replace: true });
    } else {
      // Unauthenticated users go to welcome/auth screen
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loader while determining auth state
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <CustomLoader size="lg" />
    </div>
  );
};

export default Index;
