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
  isAtTop?: boolean;
  isAtBottom?: boolean;
  scrollDirection?: 'up' | 'down';
}

export const ChatStoriesHeader = ({ isAtTop = true, isAtBottom = false, scrollDirection = 'down' }: ChatStoriesHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ avatar_url: string | null; display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle expand/collapse based on scroll position from Chats
  useEffect(() => {
    if (storyUsers.length > 0) {
      // Expand whenever list is considered at bottom
      if (isAtBottom) {
        setIsExpanded(true);
      }
      // Collapse once user scrolls up away from bottom
      else if (!isAtBottom && scrollDirection === 'up' && isExpanded) {
        setIsExpanded(false);
      }
    }
  }, [isAtBottom, scrollDirection, storyUsers.length, isExpanded]);

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

  const totalStories = storyUsers.reduce((sum, user) => sum + user.story_count, 0);
  const hasStories = storyUsers.length > 0;

  return (
    <div
      ref={headerRef}
      className="sticky top-0 z-50 bg-background transition-all duration-300"
      style={{
        height: isExpanded && hasStories ? '220px' : '80px',
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
          <Menu className="h-7 w-7 text-foreground" />
        </button>

        {/* Center: App name or stories count */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          {hasStories ? (
            <>
              <div className="flex items-center -space-x-4">
                {storyUsers.slice(0, 3).map((storyUser, index) => (
                  <div
                    key={storyUser.user_id}
                    className="relative"
                    style={{ zIndex: 30 - index * 10 }}
                  >
                    <div className="p-[3px] rounded-full bg-gradient-to-br from-cyan-400 via-teal-400 to-green-500">
                      {storyUser.avatar_url ? (
                        <img
                          src={storyUser.avatar_url}
                          alt={storyUser.display_name}
                          className="h-14 w-14 rounded-full object-cover border-[3px] border-background"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center border-[3px] border-background">
                          <span className="text-sm font-semibold text-primary-foreground">
                            {storyUser.display_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-xl font-bold text-foreground">
                {totalStories} {totalStories === 1 ? 'Story' : 'Stories'}
              </span>
            </>
          ) : (
            <h1 className="text-xl font-semibold text-foreground">AfuChat</h1>
          )}
        </div>

        {/* Right: Search */}
        <button className="p-2">
          <Search className="h-6 w-6 text-foreground" />
        </button>
      </div>

      {/* Expanded view */}
      <div
        className="absolute inset-0 bg-background flex flex-col"
        style={{
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-16">
          <button className="p-2">
            <Menu className="h-7 w-7 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">AfuChat</h1>
          <button className="p-2">
            <Search className="h-6 w-6 text-foreground" />
          </button>
        </div>

        {/* Stories horizontal scroll */}
        <div className="flex-1 overflow-x-auto scrollbar-hide px-4 py-6">
          <div className="flex gap-5 h-full items-start">
            {/* My Story */}
            <div
              onClick={handleCreateStory}
              className="flex-shrink-0 cursor-pointer flex flex-col items-center gap-2"
            >
              <div className="relative">
                {currentUserProfile?.avatar_url ? (
                  <img
                    src={currentUserProfile.avatar_url}
                    alt="My Story"
                    className="h-[72px] w-[72px] rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-[72px] w-[72px] rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <span className="text-xl font-semibold text-muted-foreground">
                      {currentUserProfile?.display_name?.charAt(0).toUpperCase() || 'M'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-md">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-xs text-center font-medium text-foreground w-20 truncate">My Story</p>
            </div>

            {/* Other stories */}
            {storyUsers.map((storyUser) => (
              <div
                key={storyUser.user_id}
                onClick={() => handleStoryClick(storyUser.user_id)}
                className="flex-shrink-0 cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="p-[3px] rounded-full bg-gradient-to-br from-cyan-400 via-teal-400 to-green-500">
                  {storyUser.avatar_url ? (
                    <img
                      src={storyUser.avatar_url}
                      alt={storyUser.display_name}
                      className="h-[72px] w-[72px] rounded-full object-cover border-[3px] border-background"
                    />
                  ) : (
                    <div className="h-[72px] w-[72px] rounded-full bg-primary flex items-center justify-center border-[3px] border-background">
                      <span className="text-xl font-semibold text-primary-foreground">
                        {storyUser.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center font-medium text-foreground w-20 truncate">
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
