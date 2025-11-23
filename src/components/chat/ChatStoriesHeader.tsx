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

export const ChatStoriesHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandProgress, setExpandProgress] = useState(0);
  const [startY, setStartY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHorizontalScroll, setIsHorizontalScroll] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchActiveStories();

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
    setIsHorizontalScroll(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.touches[0].clientY - startY;
    const deltaX = Math.abs(e.touches[0].clientX - startX);
    
    // If horizontal movement is greater, it's horizontal scrolling
    if (deltaX > Math.abs(deltaY) && deltaX > 10) {
      setIsHorizontalScroll(true);
      return;
    }
    
    // Only handle vertical swipe if not horizontal scrolling
    if (!isHorizontalScroll && expandProgress < 1) {
      if (deltaY > 0) {
        e.preventDefault(); // Prevent browser pull-to-refresh
        const progress = Math.min(deltaY / 150, 1);
        setExpandProgress(progress);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isHorizontalScroll) {
      if (expandProgress < 0.5) {
        setExpandProgress(0);
      } else {
        setExpandProgress(1);
      }
    }
    setIsDragging(false);
    setIsHorizontalScroll(false);
  };

  const handleCreateStory = () => {
    navigate('/moments');
  };

  if (loading) return null;

  const totalStories = storyUsers.reduce((sum, user) => sum + user.story_count, 0);
  const isExpanded = expandProgress > 0.5;
  const hasStories = storyUsers.length > 0;

  return (
    <div
      ref={headerRef}
      className="sticky top-0 z-50 bg-background border-b border-border"
      style={{
        transition: isDragging ? 'none' : 'height 0.3s ease-out',
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
        <div 
          className="flex items-center gap-3 flex-1 justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-background flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
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
