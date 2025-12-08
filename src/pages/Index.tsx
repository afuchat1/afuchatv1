import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CustomLoader } from '@/components/ui/CustomLoader';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <CustomLoader size="lg" />
      </div>
    );
  }

  // Logged in users go to home, others go to signup
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/auth/signup" replace />;
};

export default Index;
