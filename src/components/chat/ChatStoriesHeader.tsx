import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    if (!user) return;
    fetchActiveStories();

    // Subscribe to story changes
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
      // Get all active stories
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          user_id,
          profiles (display_name, avatar_url, handle)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user and count stories
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

  if (loading || storyUsers.length === 0) return null;

  const totalStories = storyUsers.reduce((sum, user) => sum + user.story_count, 0);

  return (
    <div className="px-6 pb-4">
      <div className="flex items-center gap-4">
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
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
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
            {storyUsers.length} {storyUsers.length === 1 ? 'contact' : 'contacts'}
          </p>
        </div>
      </div>
    </div>
  );
};
