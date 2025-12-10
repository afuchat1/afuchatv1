import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Menu, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChatMenuDrawer } from './ChatMenuDrawer';

interface StoryUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string;
  story_count: number;
}

interface ChatStoriesHeaderProps {
  shouldCollapse?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  onSearch?: (query: string) => void;
}

export const ChatStoriesHeader = ({ shouldCollapse = false, onToggleCollapse, onSearch }: ChatStoriesHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    avatar_url: string | null;
    display_name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true); // Always start collapsed
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      await Promise.all([fetchActiveStories(), fetchCurrentUserProfile()]);
    };

    fetchData();

    const channel = supabase
      .channel('chat-stories-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
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
        .select(
          `
          user_id,
          profiles (display_name, avatar_url, handle)
        `
        )
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
            story_count: 1,
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

  const handleStoriesToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
      onSearch?.('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <>
      <ChatMenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <div className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Header - tap middle section to expand when collapsed */}
      <div className="flex items-center justify-between px-4 h-16">
        {/* Search Bar */}
        {isSearchOpen ? (
          <div className="flex items-center gap-3 flex-1 animate-fade-in">
            <div className="flex items-center gap-2 flex-1 bg-muted/30 rounded-full px-4 py-2 border border-border/50 focus-within:border-primary/50 transition-colors">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 h-8 px-0"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    onSearch?.('');
                  }}
                  className="p-1 hover:bg-muted/50 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <button 
              onClick={handleSearchToggle}
              className="p-2 hover:bg-muted/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-muted/20 rounded-full transition-all hover:scale-110 active:scale-95"
            >
              <Menu className="h-7 w-7 text-foreground" />
            </button>

            {/* Compact overlapping bubbles - always visible, click to toggle */}
            <button
              type="button"
              onClick={handleStoriesToggle}
              className="flex items-center gap-3 overflow-hidden focus:outline-none"
            >
              <div className="flex items-center -space-x-2">
                {storyUsers.slice(0, 3).map((storyUser, index) => (
                  <div
                    key={storyUser.user_id}
                    className="h-9 w-9 rounded-full border-2 border-background bg-gradient-to-br from-cyan-400 via-teal-400 to-green-500 flex items-center justify-center overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                    style={{ zIndex: 3 - index }}
                  >
                    {storyUser.avatar_url ? (
                      <img
                        src={storyUser.avatar_url}
                        alt={storyUser.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-primary-foreground">
                        {storyUser.display_name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <h1 className="text-lg font-semibold text-foreground">
                {storyUsers.length > 0 
                  ? `${storyUsers.length} ${storyUsers.length === 1 ? 'Story' : 'Stories'}`
                  : 'AfuChat'
                }
              </h1>
            </button>

            <button 
              onClick={handleSearchToggle}
              className="p-2 hover:bg-muted/20 rounded-full transition-all hover:scale-110 active:scale-95"
            >
              <Search className="h-6 w-6 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Stories horizontal scroll - slides closed when collapsed */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed
            ? 'max-h-0 opacity-0'
            : 'max-h-[140px] opacity-100'
        }`}
      >
        <div className="overflow-x-auto scrollbar-hide px-4 pb-4">
          <div className="flex gap-5">
            {/* My Story */}
            <div
              onClick={handleCreateStory}
              className="flex-shrink-0 cursor-pointer flex flex-col items-center gap-2 hover-scale"
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
              <p className="text-xs text-center font-medium text-foreground w-20 truncate">
                My Story
              </p>
            </div>

            {/* Other stories */}
            {storyUsers.map((storyUser) => (
              <div
                key={storyUser.user_id}
                onClick={() => handleStoryClick(storyUser.user_id)}
                className="flex-shrink-0 cursor-pointer flex flex-col items-center gap-2 hover-scale"
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
    </>
  );
};
