import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, ArrowLeft, MessageSquare, UserPlus, Pencil, Calendar, Lock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// --- Extended Profile and Post Interfaces (Unchanged) ---
interface Profile {
  id: string;
  display_name: string;
  handle: string;
  bio?: string;
  is_verified?: boolean;
  is_organization_verified?: boolean;
  is_private?: boolean;
  created_at?: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  acknowledgment_count: number;
  reply_count: number;
}

// --- Helper: Check if a string is a valid UUID ---
// This regex is a simple check for a standard UUID format (8-4-4-4-12 hex digits)
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// --- Badges (Unchanged) ---
const GoldVerifiedBadge = ({ size = 'w-5 h-5' }: { size?: string }) => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className={`${size} ml-1 text-[#FFD43B] fill-[#FFD43B]`}
  >
    <path
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
    />
  </svg>
);

const TwitterVerifiedBadge = ({ size = 'w-5 h-5' }: { size?: string }) => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className={`${size} ml-1 text-[#1d9bf0] fill-[#1d9bf0]`}
  >
    <path
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
    />
  </svg>
);

const VerifiedBadgeIcon = ({ isVerified, isOrgVerified }: { isVerified?: boolean; isOrgVerified?: boolean }) => {
  if (isOrgVerified) {
    return <GoldVerifiedBadge />;
  }
  if (isVerified) {
    return <TwitterVerifiedBadge />;
  }
  return null;
};

// --- Post Content Parser Component for @Mentions (Unchanged) ---
const MENTION_REGEX = /@(\w+)/g;

const PostContentParser: React.FC<{ content: string }> = ({ content }) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    const mentionText = match[0];
    const handle = match[1];

    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    parts.push(
      <Link
        key={`mention-${match.index}-${handle}`}
        to={`/profile/${handle}`}
        className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {mentionText}
      </Link>
    );

    lastIndex = match.index + mentionText.length;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return <p className="text-foreground whitespace-pre-wrap leading-relaxed">{parts}</p>;
};

// --- Component Definition ---
const Profile = () => {
  const { userId: urlParam } = useParams<{ userId: string }>(); // Use a clearer name for the URL parameter
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  
  // State to hold the definitive user ID once the profile is loaded
  const [profileId, setProfileId] = useState<string | null>(null);

  // Function to aggregate follow/follower counts
  const fetchFollowCounts = useCallback(async (id: string) => {
    // Only fetch if a valid ID is provided
    if (!id) return;
    
    const { count: followerCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', id);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', id);

    setFollowCount({
      followers: followerCount || 0,
      following: followingCount || 0
    });
  }, []);

  // --- THE CRUCIAL FIX IS HERE ---
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setProfile(null);
    setProfileId(null);
    
    // Determine if the URL parameter is a UUID (id) or a handle
    const isParamUUID = urlParam ? isUUID(urlParam) : false;
    
    let query = supabase
      .from('profiles')
      .select('*, created_at')
      .limit(1);

    if (isParamUUID) {
      // Query by ID
      query = query.eq('id', urlParam);
    } else if (urlParam) {
      // Query by handle
      query = query.eq('handle', urlParam);
    } else {
      // No param, maybe redirect to current user's profile or home
      navigate('/');
      setLoading(false);
      return;
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
        toast.error('Failed to load profile or profile not found');
        console.error('Profile fetch error:', error);
        setLoading(false);
        return;
    }
    
    setProfile(data as Profile);
    setProfileId(data.id); // Store the actual UUID for use in other fetches
    
  }, [urlParam, navigate]); // Depend on urlParam

  const checkFollowStatus = useCallback(async (id: string) => {
    if (!user || !id) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', id) // Use the actual profile ID
      .limit(1)
      .single();

    setIsFollowing(!!data);
  }, [user]);

  const fetchUserPosts = useCallback(async (id: string) => {
    if (!id) return;

    const { data, error } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .eq('author_id', id) // Use the actual profile ID
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setPosts(data.map(p => ({
        ...p,
        // NOTE: Keep mock counts for now
        acknowledgment_count: Math.floor(Math.random() * 100),
        reply_count: Math.floor(Math.random() * 10),
      } as Post)));
    } else {
        setPosts([]); // Clear posts on error or no data
    }
  }, []);


  useEffect(() => {
    // 1. Fetch the profile first (determines the actual UUID)
    fetchProfile();
  }, [fetchProfile]);
  
  useEffect(() => {
    // 2. Once the profileId (UUID) is set, fetch everything else
    if (profileId) {
      fetchFollowCounts(profileId);
      fetchUserPosts(profileId);
      if (user && user.id !== profileId) {
        checkFollowStatus(profileId);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, user]); // Only re-run when profileId or user changes

  // --- Follow/Unfollow Logic (Updated to use profileId) ---
  const handleFollow = async () => {
    if (!user || !profileId) {
      navigate('/auth');
      return;
    }
    const currentIsFollowing = isFollowing;

    // Optimistic UI Update
    setIsFollowing(!currentIsFollowing);
    setFollowCount(prev => ({
      ...prev,
      followers: prev.followers + (currentIsFollowing ? -1 : 1)
    }));
    
    if (currentIsFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId); // Use profileId

      if (error) {
        // Revert on error
        setIsFollowing(true);
        setFollowCount(prev => ({ ...prev, followers: prev.followers + 1 }));
        toast.error('Failed to unfollow');
      } else {
        toast.success('Unfollowed');
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profileId }); // Use profileId

      if (error) {
        // Revert on error
        setIsFollowing(false);
        setFollowCount(prev => ({ ...prev, followers: prev.followers - 1 }));
        toast.error('Failed to follow');
      } else {
        toast.success('Following');
      }
    }
  };

  // --- Start Chat Logic (Updated to use profileId) ---
  const handleStartChat = async () => {
    if (!user || !profileId) {
      navigate('/auth');
      return;
    }
    
    // Logic to find or create a 1-on-1 chat
    const { data: existingChats } = await supabase
      .from('chat_members')
      .select('chat_id, chats!inner(is_group)')
      .eq('user_id', user.id);

    if (existingChats) {
      for (const chat of existingChats) {
        const { data: members } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chat.chat_id);

        if (members && members.length === 2 && members.some(m => m.user_id === profileId)) { // Use profileId
          navigate(`/chat/${chat.chat_id}`);
          return;
        }
      }
    }

    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({ is_group: false, created_by: user.id })
      .select()
      .single();

    if (chatError) {
      toast.error('Failed to create chat');
      return;
    }

    const { error: membersError } = await supabase
      .from('chat_members')
      .insert([
        { chat_id: newChat.id, user_id: user.id },
        { chat_id: newChat.id, user_id: profileId }, // Use profileId
      ]);

    if (membersError) {
      toast.error('Failed to add members');
      return;
    }

    navigate(`/chat/${newChat.id}`);
  };

  // --- Loading State Render (Unchanged) ---
  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
            <Skeleton className="h-4 w-1/4 mb-4" />
        </div>
        <div className="p-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full -mt-10 border-4 border-background" />
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>
            <Skeleton className="h-6 w-1/2 mt-4" />
            <Skeleton className="h-4 w-1/4 mt-1" />
            <Skeleton className="h-4 w-3/4 mt-3" />
            <div className="flex gap-4 mt-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
        <div className="mt-4 border-b border-border">
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="p-4 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // --- Profile Not Found Render (Unchanged) ---
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  // --- Utility (Unchanged) ---
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  // --- Main Render (Unchanged from last version, except for the new profileId usage in handlers) ---
  return (
    <div className="h-full flex flex-col">
      {/* HEADER BAR */}
      <div className="p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b border-border">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{profile.display_name}</h1>
            <p className="text-xs text-muted-foreground">{posts.length} Posts</p>
          </div>
        </div>
      </div>

      {/* PROFILE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto">
        {/* Banner/Header Image Placeholder */}
        <div className="h-36 bg-gray-300 dark:bg-gray-700 w-full">
          {/* Placeholder for banner image */}
        </div>

        {/* Profile Info and Buttons */}
        <div className="p-4">
          <div className="flex justify-between items-end -mt-20 sm:-mt-16">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground border-4 border-background shadow-lg">
              <User className="h-12 w-12 sm:h-16 sm:w-16" />
            </div>

            {/* Buttons */}
            {user && user.id === profileId ? ( // Use profileId for comparison
              <Button variant="outline" className="rounded-full px-4 font-bold">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                {isFollowing && (
                    <Button onClick={handleStartChat} variant="outline" size="icon" className="rounded-full">
                    <MessageSquare className="h-5 w-5" />
                    </Button>
                )}
                <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className="rounded-full px-4 font-bold transition-colors"
                    onMouseEnter={e => isFollowing && (e.currentTarget.textContent = 'Unfollow')}
                    onMouseLeave={e => isFollowing && (e.currentTarget.textContent = 'Following')}
                >
                    {isFollowing ? 'Following' :
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    }
                </Button>
              </div>
            )}
          </div>

          {/* Name and Handle Section */}
          <div className="mt-3">
            
            {/* Check if verified to decide whether to wrap in Popover */}
            {(profile.is_verified || profile.is_organization_verified) ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-1 cursor-pointer w-fit">
                    <h1 className="text-xl font-extrabold leading-tight">{profile.display_name}</h1>
                    <VerifiedBadgeIcon
                      isVerified={profile.is_verified}
                      isOrgVerified={profile.is_organization_verified}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none shadow-xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
                  
                  {/* Popover Content Logic */}
                  {profile.is_organization_verified ? (
                    // Gold Badge Content
                    <div className="p-4 max-w-sm">
                      <GoldVerifiedBadge size="w-6 h-6" />
                      <h3 className="font-bold text-lg mt-2 text-foreground">Verified Organization</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        This account is verified because it's a notable organization on AfuChat.
                        <span className="block mt-2 font-bold text-foreground">@{profile.handle}</span>
                      </p>
                    </div>
                  ) : (
                    // Blue Badge Content
                    <div className="p-4 max-w-sm">
                      <TwitterVerifiedBadge size="w-6 h-6" />
                      <h3 className="font-bold text-lg mt-2 text-foreground">Verified Account</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        This account is verified because it’s notable in government, news, entertainment, or another designated category.
                        <span className="block mt-2 font-bold text-foreground">@{profile.handle}</span>
                      </p>
                    </div>
                  )}
                  {/* End Popover Content Logic */}

                </PopoverContent>
              </Popover>
            ) : (
              // Not verified, just show the name
              <div className="flex items-center gap-1">
                <h1 className="text-xl font-extrabold leading-tight">{profile.display_name}</h1>
              </div>
            )}
            
            <p className="text-muted-foreground text-sm">@{profile.handle}</p>
          </div>
          {/* --- END Name/Handle Section --- */}

          {/* Bio */}
          {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}

          {/* Metadata */}
          <div className="flex items-center space-x-4 mt-3 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Joined {profile.created_at ? new Date(profile.created_at).toLocaleString('en-UG', { month: 'long', year: 'numeric' }) : 'Unknown'}</span>
            </div>
          </div>

          {/* Follow Counts */}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center">
              <span className="font-bold text-sm">{formatCount(followCount.following)}</span>
              <span className="text-muted-foreground text-sm ml-1 hover:underline cursor-pointer">Following</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-sm">{formatCount(followCount.followers)}</span>
              <span className="text-muted-foreground text-sm ml-1 hover:underline cursor-pointer">Followers</span>
            </div>
          </div>
        </div>

        {/* POSTS SECTION (Tabs) */}
        <Separator className="mt-4" />
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-12 rounded-none bg-background">
            <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold text-muted-foreground">
              Posts
            </TabsTrigger>
            <TabsTrigger value="replies" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold text-muted-foreground">
              Replies
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold text-muted-foreground">
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {profile.is_private && user?.id !== profileId ? (
              <div className="text-center text-muted-foreground py-12">
                <Lock className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold">This profile is private</p>
                <p className="text-sm">Follow to see their posts and activity.</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No posts yet.
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-border">
                {posts.map((post) => (
                  <Card key={post.id} className="p-4 rounded-none border-x-0 border-t-0 hover:bg-muted/10 cursor-pointer transition-colors">
                    <PostContentParser content={post.content} /> 
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                        <span>{new Date(post.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="replies">
            <div className="text-center text-muted-foreground py-12">Replies feature coming soon...</div>
          </TabsContent>
          <TabsContent value="media">
            <div className="text-center text-muted-foreground py-12">Media content is not yet supported.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
