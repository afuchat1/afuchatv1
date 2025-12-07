import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CustomLoader } from '@/components/ui/CustomLoader';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    // Authenticated users go to home, others see landing/welcome page
    if (user) {
      navigate('/home', { replace: true });
    } else {
      navigate('/welcome', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loader while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <CustomLoader size="lg" />
    </div>
  );
};

export default Index;
