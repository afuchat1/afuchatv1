import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Feed from './Feed';
import DesktopFeed from './DesktopFeed';
import NewPostModal from '@/components/ui/NewPostModal';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import Layout from '@/components/Layout';
import { useIsMobile } from '@/hooks/use-mobile';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [checkingFollows, setCheckingFollows] = useState(true);
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  useEffect(() => {
    checkUserFollows();
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

  if (checkingFollows) {
    return null;
  }

  // Desktop: X-style wide layout without Layout wrapper
  if (isDesktop) {
    return (
      <>
        <DesktopFeed />
        <FloatingActionButton />
        {user && (
          <NewPostModal
            isOpen={isPostModalOpen}
            onClose={() => setIsPostModalOpen(false)}
          />
        )}
      </>
    );
  }

  // Mobile: Regular feed with Layout
  return (
    <Layout>
      <div className="relative">
        <Feed />
        <FloatingActionButton />
        {user && (
          <NewPostModal
            isOpen={isPostModalOpen}
            onClose={() => setIsPostModalOpen(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Home;
