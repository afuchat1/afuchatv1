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
      className="sticky top-0 z-50 transition-all duration-300 ease-out bg-background/95 backdrop-blur-sm touch-pan-x pb-2"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        paddingLeft: `${24 - expandProgress * 24}px`,
        paddingRight: `${24 - expandProgress * 24}px`,
        paddingBottom: `${16 + expandProgress * 8}px`,
      }}
    >
      {/* Top navigation bar like Telegram */}
      <div className="flex items-center justify-between px-4 pb-3">
        <button className="p-1 rounded-full text-foreground/80">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">
          {isExpanded
            ? 'Telegram'
            : `${totalStories || 0} ${totalStories === 1 ? 'Story' : 'Stories'}`}
        </h1>
        <button className="p-1 rounded-full text-foreground/80">
          <Search className="h-5 w-5" />
        </button>
      </div>

      <div
        style={{
          height: `${80 + expandProgress * 80}px`,
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'all 0.3s ease-out',
        }}
      >
        {/* Collapsed content */}
        <div
          style={{
            opacity: 1 - expandProgress,
            transform: `translateY(${expandProgress * -20}px)`,
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-4 px-6">
            {hasStories ? (
              <>
                <div className="flex items-center -space-x-3">
                  {storyUsers.slice(0, 4).map((storyUser, index) => (
                    <div
                      key={storyUser.user_id}
                      onClick={() => handleStoryClick(storyUser.user_id)}
                      className={cn(
                        "relative cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10",
                        index === 0 ? "z-40" : index === 1 ? "z-30" : index === 2 ? "z-20" : "z-10"
                      )}
                      style={{ 
                        transform: `translateX(${index * 2}px)`,
                      }}
                    >
                      <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 to-teal-500">
                        {storyUser.avatar_url ? (
                          <img
                            src={storyUser.avatar_url}
                            alt={storyUser.display_name}
                            className="h-14 w-14 rounded-full object-cover border-[3px] border-background"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-[3px] border-background">
                            <span className="text-lg font-semibold text-white">
                              {storyUser.display_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-foreground">
                    {totalStories} {totalStories === 1 ? 'Story' : 'Stories'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Swipe down to expand
                  </p>
                </div>
              </>
            ) : (
              <div
                onClick={handleCreateStory}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-dashed border-primary/50">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-foreground">Create Story</h2>
                  <p className="text-xs text-muted-foreground">Share a moment</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expanded content */}
        <div
          style={{
            opacity: expandProgress,
            transform: `translateY(${(1 - expandProgress) * 20}px)`,
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <div className="space-y-4">
            <div className="px-6 flex items-center justify-center">
              <h2 className="text-2xl font-bold text-foreground">Telegram</h2>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-6 pb-2">
                {/* My Story / Create Story */}
                <div
                  onClick={handleCreateStory}
                  className="flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-105"
                >
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-primary/50">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-center mt-2 font-medium truncate w-20">My Story</p>
                </div>

                {/* Other users' stories */}
                {storyUsers.map((storyUser) => (
                  <div
                    key={storyUser.user_id}
                    onClick={() => handleStoryClick(storyUser.user_id)}
                    className="flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-105"
                  >
                    <div className="relative">
                      <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 to-teal-500">
                        {storyUser.avatar_url ? (
                          <img
                            src={storyUser.avatar_url}
                            alt={storyUser.display_name}
                            className="h-20 w-20 rounded-full object-cover border-[3px] border-background"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-[3px] border-background">
                            <span className="text-2xl font-semibold text-white">
                              {storyUser.display_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-center mt-2 font-medium truncate w-20">
                      {storyUser.display_name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
