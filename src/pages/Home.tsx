import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Feed from './Feed';
import NewPostModal from '@/components/ui/NewPostModal';
import Layout from '@/components/Layout';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [checkingFollows, setCheckingFollows] = useState(true);

  useEffect(() => {
    // Check if user has followed anyone (or allow visitors)
    checkUserFollows();
  }, [user]);

  useEffect(() => {
    // Listen for new post events from FAB
    const handleNewPostEvent = () => {
      console.log('New post event received, user:', user?.id);
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
    // Handle app shortcut for new post
    if (searchParams.get('action') === 'new-post' && user) {
      setIsPostModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, user, setSearchParams]);

  const checkUserFollows = async () => {
    // Allow non-logged-in users to view the feed
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

      // Only redirect authenticated users who haven't followed anyone
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

  const handleNewPost = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsPostModalOpen(true);
  };

  if (checkingFollows) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <Layout>
      <div className="relative">
        <Feed />

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
