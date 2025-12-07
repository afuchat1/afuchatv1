import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CustomLoader } from '@/components/ui/CustomLoader';

const Index = () => {
  const { user, loading } = useAuth();

  // Show loader only while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <CustomLoader size="lg" />
      </div>
    );
  }

  // Immediate redirect - no useEffect delay
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/welcome" replace />;
};

export default Index;
