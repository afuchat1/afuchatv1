import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  TrendingUp, Search, Users, Hash, Sparkles, UserPlus, UserCheck,
  Settings, MessageSquare, Bell, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import Feed from './Feed';
import { StoryAvatar } from '@/components/moments/StoryAvatar';

interface TrendingTopic {
  topic: string;
  count: number;
}

interface SuggestedUser {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_business_mode: boolean;
}

const DesktopFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openSettings } = useSettings();
  const { toast } = useToast();
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [processingFollow, setProcessingFollow] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTrendingTopics();
    fetchSuggestedUsers();
    fetchFollowingStatus();

    // Subscribe to profile updates for suggested users
    const profilesChannel = supabase
      .channel('desktop-profiles-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          // Update suggested user if they're in the list
          setSuggested(prev =>
            prev.map(suggestedUser =>
              suggestedUser.id === payload.new.id
                ? {
                    ...suggestedUser,
                    display_name: payload.new.display_name || suggestedUser.display_name,
                    handle: payload.new.handle || suggestedUser.handle,
                    avatar_url: payload.new.avatar_url,
                    is_verified: payload.new.is_verified ?? suggestedUser.is_verified,
                    is_business_mode: payload.new.is_business_mode ?? suggestedUser.is_business_mode,
                  }
                : suggestedUser
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const fetchTrendingTopics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trending_topics', {
        hours_ago: 24,
        num_topics: 10
      });

      if (error) throw error;
      if (data) {
        setTrending(data.map((item: any) => ({
          topic: item.topic,
          count: item.post_count
        })));
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;

    try {
      const priorityHandles = ['afuchat', 'amkaweesi', 'afuai'];
      
      // Fetch following status for priority accounts
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIdsSet = new Set(followingData?.map(f => f.following_id) || []);
      
      // Fetch priority accounts
      const { data: priorityAccounts, error: priorityError } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url, is_verified, is_business_mode')
        .in('handle', priorityHandles);

      if (priorityError) throw priorityError;

      // Filter out already followed priority accounts
      const unfollowedPriority = priorityAccounts?.filter(
        account => !followingIdsSet.has(account.id)
      ) || [];

      // Fetch additional suggested users (excluding priority accounts and current user)
      const priorityIds = priorityAccounts?.map(a => a.id) || [];
      const { data: otherUsers, error } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url, is_verified, is_business_mode')
        .neq('id', user.id)
        .not('id', 'in', `(${priorityIds.join(',')})`)
        .limit(5);

      if (error) throw error;

      // Filter out already followed users from other suggestions
      const unfollowedOthers = otherUsers?.filter(
        u => !followingIdsSet.has(u.id)
      ) || [];

      // Combine: priority accounts first, then others
      const combined = [...unfollowedPriority, ...unfollowedOthers];
      setSuggested(combined);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const fetchFollowingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;
      if (data) {
        setFollowingIds(new Set(data.map(f => f.following_id)));
      }
    } catch (error) {
      console.error('Error fetching following status:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }

    setProcessingFollow(prev => new Set(prev).add(userId));

    try {
      const isFollowing = followingIds.has(userId);

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;

        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });

        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;

        setFollowingIds(prev => new Set(prev).add(userId));

        toast({
          title: "Following",
          description: "You are now following this user",
        });
      }

      // Refetch suggestions to update the list
      fetchSuggestedUsers();
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setProcessingFollow(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1440px] mx-auto flex">
        {/* Left Sidebar - Navigation */}
        <aside className="hidden xl:flex w-[275px] flex-col gap-2 p-4 border-r border-border sticky top-0 h-screen">
          <div className="mb-4">
            <h2 className="text-2xl font-bold px-4">AfuChat</h2>
          </div>

          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-xl h-auto py-3 px-4"
              onClick={() => navigate('/')}
            >
              <Sparkles className="h-6 w-6 mr-4" />
              <span>Hub</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-xl h-auto py-3 px-4"
              onClick={() => navigate('/home')}
            >
              <Hash className="h-6 w-6 mr-4" />
              <span>Feed</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-xl h-auto py-3 px-4"
              onClick={() => navigate('/chats')}
            >
              <MessageSquare className="h-6 w-6 mr-4" />
              <span>Messages</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-xl h-auto py-3 px-4"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-6 w-6 mr-4" />
              <span>Notifications</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-xl h-auto py-3 px-4"
              onClick={() => user && navigate(`/${user.id}`)}
            >
              <User className="h-6 w-6 mr-4" />
              <span>Profile</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-xl h-auto py-3 px-4"
              onClick={() => openSettings()}
            >
              <Settings className="h-6 w-6 mr-4" />
              <span>Settings</span>
            </Button>
          </nav>

          <div className="mt-auto">
            {user && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/${user.id}`)}
              >
							<StoryAvatar 
								userId={user.id}
								avatarUrl={user.user_metadata?.avatar_url}
								name={user.user_metadata?.display_name || 'User'}
								size="md"
								className="mr-3"
								showStoryRing={true}
							/>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm line-clamp-1">
                    {user.user_metadata?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    @{user.user_metadata?.handle || 'user'}
                  </p>
                </div>
              </Button>
            )}
          </div>
        </aside>

        {/* Center - Feed */}
        <main className="flex-1 min-w-0 border-r border-border max-w-[600px]">
          <Feed />
        </main>

        {/* Right Sidebar - Trending & Suggestions */}
        <aside className="hidden lg:block w-[350px] p-4 space-y-6">
          {/* Search */}
          <div className="sticky top-0 bg-background pb-4 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search AfuChat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 rounded-full bg-muted/50"
              />
            </div>
          </div>

          {/* Trending */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-bold text-lg">Trending</h3>
            </div>
            <div className="space-y-4">
              {trending.slice(0, 5).map((topic, index) => (
                <button
                  key={index}
                  className="w-full text-left hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(topic.topic)}`)}
                >
                  <p className="text-sm text-muted-foreground">{index + 1} · Trending</p>
                  <p className="font-semibold">#{topic.topic}</p>
                  <p className="text-sm text-muted-foreground">{topic.count} posts</p>
                </button>
              ))}
              {trending.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No trending topics yet
                </p>
              )}
              {trending.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full text-primary"
                  onClick={() => navigate('/trending')}
                >
                  Show more
                </Button>
              )}
            </div>
          </Card>

          {/* Suggested Users */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              <h3 className="font-bold text-lg">Who to follow</h3>
            </div>
            <div className="space-y-4">
              {suggested.map((suggestedUser) => (
                <div key={suggestedUser.id} className="flex items-center gap-3">
                  <StoryAvatar 
                    userId={suggestedUser.id}
                    avatarUrl={suggestedUser.avatar_url}
                    name={suggestedUser.display_name}
                    size="md"
                    className="cursor-pointer"
                    showStoryRing={true}
                    onClick={() => navigate(`/${suggestedUser.id}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p
                        className="font-semibold text-sm line-clamp-1 cursor-pointer hover:underline"
                        onClick={() => navigate(`/${suggestedUser.id}`)}
                      >
                        {suggestedUser.display_name}
                      </p>
                      {suggestedUser.is_verified && (
                        <Badge variant="secondary" className="h-4 px-1 text-xs">✓</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      @{suggestedUser.handle}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant={followingIds.has(suggestedUser.id) ? "secondary" : "outline"}
                    onClick={() => handleFollow(suggestedUser.id)}
                    disabled={processingFollow.has(suggestedUser.id)}
                  >
                    {followingIds.has(suggestedUser.id) ? (
                      <>
                        <UserCheck className="h-3 w-3 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              ))}
              {suggested.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No suggestions available
                </p>
              )}
              {suggested.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full text-primary"
                  onClick={() => navigate('/suggested-users')}
                >
                  Show more
                </Button>
              )}
            </div>
          </Card>

          {/* Footer Links */}
          <div className="text-xs text-muted-foreground space-y-2 px-4">
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/terms')} className="hover:underline">Terms</button>
              <button onClick={() => navigate('/privacy')} className="hover:underline">Privacy</button>
              <button onClick={() => navigate('/support')} className="hover:underline">Support</button>
            </div>
            <p>© 2024 AfuChat Super App</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DesktopFeed;
