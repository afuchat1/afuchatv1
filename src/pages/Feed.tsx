import { useEffect, useState, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageSquare, Heart, Repeat2, Share, User, Ellipsis } from 'lucide-react'; // Changed ThumbsUp to Heart for 'Like'
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Re-importing Button for action icons
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Using Shadcn Avatar for consistent styling

interface Post {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles: {
    display_name: string;
    handle: string;
    is_verified: boolean;
    is_organization_verified: boolean;
    avatar_url?: string; // Assuming an avatar_url might exist
  };
  replies?: Reply[];
  like_count?: number; // Added for mock interaction
  repost_count?: number; // Added for mock interaction
}

interface Reply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string;
    handle: string;
    is_verified: boolean;
    is_organization_verified: boolean;
    avatar_url?: string; // Assuming an avatar_url might exist
  };
  like_count?: number; // Added for mock interaction
}

// --- Twitter Verified Badge (Blue) ---
const TwitterVerifiedBadge = () => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className="inline w-[16px] h-[16px] ml-0.5 text-[#1d9bf0] fill-[#1d9bf0] flex-shrink-0"
  >
    <path
      d="m20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
    />
  </svg>
);

// --- Gold Verified Badge (for Organizations) ---
const GoldVerifiedBadge = () => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className="inline w-[16px] h-[16px] ml-0.5 text-[#FFD43B] fill-[#FFD43B] flex-shrink-0"
  >
    <path
      d="m20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
    />
  </svg>
);


// Helper to format time like X (e.g., "5m", "2h", "Feb 23")
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime(); // Difference in milliseconds

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30); // Approximate

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 365) return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};


const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceLoaded, setForceLoaded] = useState(false);
  const navigate = useNavigate(); 

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 5000); 

    return () => clearTimeout(timer);
  }, []);

  const effectiveLoading = loading && !forceLoaded;

  const addReply = useCallback((postId: string, newReply: Reply) => {
    setPosts((cur) =>
      cur.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: [...(p.replies || []), newReply].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              ),
            }
          : p
      )
    );
  }, []);

  const updatePostCounts = useCallback(async (postId: string) => {
    // In a real app, you'd fetch actual counts. Here, we'll just mock.
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? {
        ...post,
        like_count: (post.like_count || 0) + 1, // Mock increment
      } : post
    ));
    toast.success('Post acknowledged!');
  }, []);


  useEffect(() => {
    fetchPosts();

    // Realtime for new posts
    const postsChannel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, handle, is_verified, is_organization_verified, avatar_url')
            .eq('id', payload.new.author_id)
            .single();

          if (profile) {
            const newPost = {
              ...payload.new,
              profiles: profile,
              replies: [],
              like_count: 0,
              repost_count: 0,
            } as Post;
            setPosts((cur) => [newPost, ...cur]);
          }
        }
      )
      .subscribe();

    // Realtime for new replies
    const repliesChannel = supabase
      .channel('replies-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_replies' },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, handle, is_verified, is_organization_verified, avatar_url')
            .eq('id', payload.new.author_id)
            .single();

          if (profile) {
            const newReply = {
              ...payload.new,
              profiles: profile,
              like_count: 0,
            } as Reply;
            addReply(payload.new.post_id, newReply); // Use the callback
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(repliesChannel);
    };
  }, [user, addReply]); // Dependency on addReply

  const fetchPosts = async () => {
    try {
      let { data, error } = await supabase
        .from('posts')
        .select('*, profiles(display_name, handle, is_verified, is_organization_verified, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const postIds = data.map((p) => p.id);

        const { data: repliesData, error: repliesError } = await supabase
          .from('post_replies')
          .select('*, profiles(display_name, handle, is_verified, is_organization_verified, avatar_url)')
          .in('post_id', postIds)
          .order('created_at', { ascending: true });

        if (repliesError) throw repliesError;

        const repliesByPostId = new Map<string, Reply[]>();
        postIds.forEach((id) => repliesByPostId.set(id, []));

        repliesData?.forEach((r) => {
          const reply = {
            ...r,
            profiles: r.profiles,
          } as Reply;
          repliesByPostId.get(r.post_id)?.push(reply);
        });

        data = data.map((post) => ({
          ...post,
          profiles: {
            ...post.profiles,
            is_verified: post.profiles?.is_verified ?? false,
            is_organization_verified: post.profiles?.is_organization_verified ?? false,
            avatar_url: post.profiles?.avatar_url,
          },
          replies: repliesByPostId.get(post.id) || [],
          like_count: Math.floor(Math.random() * 500), // MOCK DATA
          repost_count: Math.floor(Math.random() * 100), // MOCK DATA
        })) as Post[];
      }

      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const PostSkeleton = () => (
    <div className="flex p-4 border-b border-border">
      <Skeleton className="h-10 w-10 rounded-full mr-3" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center">
          <Skeleton className="h-4 w-1/4 mr-2" />
          <Skeleton className="h-3 w-1/6" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex justify-between mt-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );

  if (effectiveLoading) {
    return (
      <div className="flex flex-col h-full">
        {[...Array(5)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  const PostCard = ({ post, addReply, user, navigate, onAcknowledge }: 
    { post: Post; addReply: (postId: string, reply: Reply) => void; user: any; navigate: any; onAcknowledge: (postId: string) => void }) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');

    const handleViewProfile = (userId: string) => {
        navigate(`/profile/${userId}`);
    };

    const handleReplySubmit = async () => {
      if (!replyText.trim()) return;

      const { error } = await supabase.from('post_replies').insert({
        post_id: post.id,
        author_id: user.id,
        content: replyText,
      });

      if (error) {
        toast.error('Failed to post reply');
        return;
      }

      const optimisticReply: Reply = {
        id: '', 
        post_id: post.id,
        author_id: user.id,
        content: replyText,
        created_at: new Date().toISOString(),
        profiles: {
          display_name: user?.user_metadata?.display_name || 'User',
          handle: user?.user_metadata?.handle || 'user',
          is_verified: user?.user_metadata?.is_verified || false,
          is_organization_verified: user?.user_metadata?.is_organization_verified || false,
          avatar_url: user?.user_metadata?.avatar_url,
        },
        like_count: 0,
      };

      addReply(post.id, optimisticReply);
      setReplyText('');
      setShowReplyInput(false);
    };

    const renderVerifiedBadge = (profile: any) => {
      if (profile.is_organization_verified) {
        return <GoldVerifiedBadge />;
      }
      if (profile.is_verified) {
        return <TwitterVerifiedBadge />;
      }
      return null;
    };

    return (
      <div className="flex border-b border-border py-3 px-4 transition-colors hover:bg-muted/5">
        {/* Avatar */}
        <div className="mr-3 flex-shrink-0">
          <Avatar className="h-10 w-10 cursor-pointer" onClick={() => handleViewProfile(post.author_id)}>
            <AvatarImage src={post.profiles.avatar_url} />
            <AvatarFallback>
              <User className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1">
          {/* Post Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-x-1">
              <span 
                className="font-bold text-foreground text-sm cursor-pointer hover:underline"
                onClick={() => handleViewProfile(post.author_id)}
              >
                {post.profiles.display_name}
              </span>
              {renderVerifiedBadge(post.profiles)}
              <span 
                className="text-muted-foreground text-sm hover:underline cursor-pointer"
                onClick={() => handleViewProfile(post.author_id)}
              >
                @{post.profiles.handle}
              </span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {formatTime(post.created_at)}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Ellipsis className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Post Content */}
          <p className="text-foreground text-base mt-1 mb-2 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Post Actions */}
          <div className="flex justify-between items-center text-sm text-muted-foreground mt-3 -ml-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 group">
              <MessageSquare className="h-4 w-4 group-hover:text-primary transition-colors" />
              <span className="group-hover:text-primary transition-colors text-xs">
                {post.replies?.length > 0 ? post.replies.length : ''}
              </span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 group">
              <Repeat2 className="h-4 w-4 group-hover:text-green-500 transition-colors" />
              <span className="group-hover:text-green-500 transition-colors text-xs">
                {post.repost_count || ''}
              </span>
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 group"
                onClick={() => onAcknowledge(post.id)} // Call the acknowledge handler
            >
              <Heart className="h-4 w-4 group-hover:text-red-500 transition-colors" />
              <span className="group-hover:text-red-500 transition-colors text-xs">
                {post.like_count || ''}
              </span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 group">
              <Share className="h-4 w-4 group-hover:text-primary transition-colors" />
            </Button>
          </div>

          {/* Reply Input Area */}
          {user && (
            <div className="mt-4 flex space-x-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tweet your reply..."
                  className="w-full p-2 border-b border-input bg-transparent text-foreground resize-none focus:outline-none focus:ring-0 focus:border-primary text-sm"
                  rows={1}
                  maxLength={280}
                  onFocus={() => setShowReplyInput(true)}
                />
                {showReplyInput && (
                  <div className="flex justify-end mt-2 space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setShowReplyInput(false); setReplyText(''); }}
                      className="text-sm text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReplySubmit}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          {!user && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Please <a href="/auth" className="text-primary underline">log in</a> to reply.
            </div>
          )}

          {/* Replies */}
          {post.replies && post.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {post.replies.map((reply) => (
                <div key={reply.id} className="flex relative">
                  {/* Vertical line connecting reply to post */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border -z-10" style={{ height: 'calc(100% + 8px)', top: '-4px' }}></div>
                  <div className="flex-shrink-0 mr-3">
                    <Avatar className="h-8 w-8 cursor-pointer" onClick={() => handleViewProfile(reply.author_id)}>
                      <AvatarImage src={reply.profiles.avatar_url} />
                      <AvatarFallback>
                        <User className="h-4 w-4 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-x-1">
                      <span 
                        className="font-bold text-foreground text-sm cursor-pointer hover:underline"
                        onClick={() => handleViewProfile(reply.author_id)}
                      >
                        {reply.profiles.display_name}
                      </span>
                      {renderVerifiedBadge(reply.profiles)}
                      <span 
                        className="text-muted-foreground text-sm hover:underline cursor-pointer"
                        onClick={() => handleViewProfile(reply.author_id)}
                      >
                        @{reply.profiles.handle}
                      </span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <span className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatTime(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                      {reply.content}
                    </p>
                    {/* Reply actions - simplified for now */}
                    <div className="flex justify-start items-center text-xs text-muted-foreground mt-2 -ml-2">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1 group">
                            <Heart className="h-3 w-3 group-hover:text-red-500 transition-colors" />
                            <span className="group-hover:text-red-500 transition-colors">
                                {reply.like_count || ''}
                            </span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1 group">
                            <MessageSquare className="h-3 w-3 group-hover:text-primary transition-colors" />
                        </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Optional: A fixed header for 'Home' or 'For you/Following' tabs */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b border-border py-3 px-4">
        <h2 className="text-xl font-bold">Home</h2>
        {/* Could add tabs here for 'For you'/'Following' */}
      </div>

      <div className="flex-1 overflow-y-auto">
        {posts.length === 0 && !effectiveLoading ? (
          <div className="text-center text-muted-foreground py-8">
            No posts yet. Tap the <User className="inline h-4 w-4" /> button to
            share your first post!
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              addReply={addReply}
              user={user}
              navigate={navigate}
              onAcknowledge={updatePostCounts} // Pass the acknowledge handler
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
