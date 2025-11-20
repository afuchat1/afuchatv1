import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

        {/* Floating Action Button */}
        <Button
          size="lg"
          onClick={handleNewPost}
          aria-label="Create new post"
          data-new-post
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 rounded-full shadow-2xl h-12 w-12 sm:h-14 sm:w-14 z-50"
        >
          <Send className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

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
