import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Feed from './Feed';
import NewPostModal from '@/components/ui/NewPostModal';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import Layout from '@/components/Layout';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { ProfileCompletionBanner } from '@/components/ProfileCompletionBanner';
import { GuestAuthBanner } from '@/components/GuestAuthBanner';

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [checkingFollows, setCheckingFollows] = useState(!!user); // Only check for logged in users

  useEffect(() => {
    if (user) {
      checkUserFollows();
    }
  }, [user]);

  useEffect(() => {
    const handleNewPostEvent = () => {
      if (user) {
        setIsPostModalOpen(true);
      } else {
        navigate('/auth');
      }
    };
    
    window.addEventListener('open-new-post', handleNewPostEvent);
    return () => window.removeEventListener('open-new-post', handleNewPostEvent);
  }, [user, navigate]);

  useEffect(() => {
    if (searchParams.get('action') === 'new-post' && user) {
      setIsPostModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, user, setSearchParams]);

  const checkUserFollows = async () => {
    if (!user) {
      setCheckingFollows(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        navigate('/suggested-users');
        return;
      }
    } catch (error) {
      console.error('Error checking follows:', error);
    } finally {
      setCheckingFollows(false);
    }
  };

  // Show loading while checking auth or follows
  if (loading || (user && checkingFollows)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <CustomLoader size="lg" />
      </div>
    );
  }

  // All devices: Use unified Layout (handles DesktopHybridLayout for non-mobile)
  return (
    <>
      {user ? <ProfileCompletionBanner /> : <GuestAuthBanner />}
      <Layout>
        <div className="relative pt-10 min-h-screen">
          <Feed />
          {user && <FloatingActionButton />}
          {user && (
            <NewPostModal
              isOpen={isPostModalOpen}
              onClose={() => setIsPostModalOpen(false)}
            />
          )}
        </div>
      </Layout>
    </>
  );
};

export default Home;
