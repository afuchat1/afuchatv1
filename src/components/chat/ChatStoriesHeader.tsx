import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Plus, Menu, Search } from 'lucide-react';

interface StoryUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string;
  story_count: number;
}

interface ChatStoriesHeaderProps {
  scrollPosition?: number;
  isAtBottom?: boolean;
  scrollDirection?: 'up' | 'down';
}

export const ChatStoriesHeader = ({ scrollPosition = 0, isAtBottom = false, scrollDirection = 'down' }: ChatStoriesHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ avatar_url: string | null; display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle expand/collapse based on scroll
  useEffect(() => {
    if (isAtBottom) {
      setIsExpanded(true);
    } else if (scrollDirection === 'up') {
      setIsExpanded(false);
    }
  }, [isAtBottom, scrollDirection]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      await Promise.all([
        fetchActiveStories(),
        fetchCurrentUserProfile()
      ]);
    };
    
    fetchData();

    const channel = supabase
      .channel('chat-stories-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        () => {
          fetchActiveStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
  };

  const fetchActiveStories = async () => {
    try {
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          user_id,
          profiles (display_name, avatar_url, handle)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userMap = new Map<string, StoryUser>();
      
      stories?.forEach((story: any) => {
        if (!story.profiles) return;
        
        const userId = story.user_id;
        if (userMap.has(userId)) {
          const existing = userMap.get(userId)!;
          userMap.set(userId, { ...existing, story_count: existing.story_count + 1 });
        } else {
          userMap.set(userId, {
            user_id: userId,
            display_name: story.profiles.display_name,
            avatar_url: story.profiles.avatar_url,
            handle: story.profiles.handle,
            story_count: 1
          });
        }
      });

      setStoryUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (userId: string) => {
    navigate(`/moments?user=${userId}`);
  };


  const handleCreateStory = () => {
    navigate('/moments');
  };

  if (loading) return null;

  const totalStories = storyUsers.reduce((sum, user) => sum + user.story_count, 0);
  const hasStories = storyUsers.length > 0;

  return (
    <div
      ref={headerRef}
      className="sticky top-0 z-50 bg-background border-b border-border transition-all duration-300"
      style={{
        height: isExpanded ? '200px' : '80px',
      }}
    >
      {/* Collapsed view - single row */}
      <div
        className="flex items-center justify-between px-4 h-20"
        style={{
          opacity: isExpanded ? 0 : 1,
          pointerEvents: isExpanded ? 'none' : 'auto',
          transition: 'opacity 0.2s',
        }}
      >
        {/* Left: Menu */}
        <button className="p-2">
          <Menu className="h-6 w-6 text-foreground" />
        </button>

        {/* Center: Overlapping avatars + count */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          {hasStories && (
            <>
              <div className="flex items-center -space-x-3">
                {storyUsers.slice(0, 3).map((storyUser, index) => (
                  <div
                    key={storyUser.user_id}
                    className="relative"
                    style={{ zIndex: 30 - index * 10 }}
                  >
                    <div className="p-[2px] rounded-full bg-gradient-to-tr from-cyan-400 to-teal-500">
                      {storyUser.avatar_url ? (
                        <img
                          src={storyUser.avatar_url}
                          alt={storyUser.display_name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-background"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                          <span className="text-sm font-semibold text-white">
                            {storyUser.display_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-xl font-semibold text-foreground">
                {totalStories} {totalStories === 1 ? 'Story' : 'Stories'}
              </span>
            </>
          )}
        </div>

        {/* Right: Search */}
        <button className="p-2">
          <Search className="h-6 w-6 text-foreground" />
        </button>
      </div>

      {/* Expanded view */}
      <div
        className="absolute inset-0 bg-background"
        style={{
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-16">
          <button className="p-2">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">AfuChat</h1>
          <button className="p-2">
            <Search className="h-6 w-6 text-foreground" />
          </button>
        </div>

        {/* Stories horizontal scroll */}
        <div className="overflow-x-auto scrollbar-hide px-4 pb-4">
          <div className="flex gap-4">
            {/* My Story */}
            <div
              onClick={handleCreateStory}
              className="flex-shrink-0 cursor-pointer"
            >
              <div className="relative">
                {currentUserProfile?.avatar_url ? (
                  <img
                    src={currentUserProfile.avatar_url}
                    alt="My Story"
                    className="h-16 w-16 rounded-full object-cover border-2 border-background"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                    <span className="text-lg font-semibold text-foreground">
                      {currentUserProfile?.display_name?.charAt(0).toUpperCase() || 'M'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="text-xs text-center mt-1.5 font-medium w-16 truncate">My Story</p>
            </div>

            {/* Other stories */}
            {storyUsers.map((storyUser) => (
              <div
                key={storyUser.user_id}
                onClick={() => handleStoryClick(storyUser.user_id)}
                className="flex-shrink-0 cursor-pointer"
              >
                <div className="p-[2px] rounded-full bg-gradient-to-tr from-cyan-400 to-teal-500">
                  {storyUser.avatar_url ? (
                    <img
                      src={storyUser.avatar_url}
                      alt={storyUser.display_name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-background"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                      <span className="text-lg font-semibold text-white">
                        {storyUser.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-1.5 font-medium w-16 truncate">
                  {storyUser.display_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
