import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 🎯 ADDED LINK
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageSquare, Heart, Share, User, Ellipsis } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// --- Type Definitions (Unchanged) ---
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
  };
  replies: Reply[];
  like_count: number;
  reply_count: number;
  has_liked: boolean;
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
  };
}

// --- Verified Badge Logic (Unchanged) ---
const TwitterVerifiedBadge = () => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className="inline w-[16px] h-[16px] ml-0.5 text-[#1d9bf0] fill-[#1d9bf0] flex-shrink-0"
  >
    <path d="m20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);

const GoldVerifiedBadge = () => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className="inline w-[16px] h-[16px] ml-0.5 text-[#FFD43B] fill-[#FFD43B] flex-shrink-0"
  >
    <path d="m20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);

const VerifiedBadge = ({ isVerified, isOrgVerified }: { isVerified: boolean; isOrgVerified: boolean }) => {
  if (isOrgVerified) {
    return <GoldVerifiedBadge />;
  }
  if (isVerified) {
    return <TwitterVerifiedBadge />;
  }
  return null;
};

// Helper to format time (Unchanged)
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 365) return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};


// Utility to parse content and create clickable links for mentions with ID lookup (Unchanged)
const parsePostContent = (content: string, navigate: (path: string) => void) => {
  if (!content) return null;
  
  const lookupAndNavigateByHandle = async (handle: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single();

    if (error || !data) {
      toast.error(`Could not find profile for @${handle}`);
      console.error(error);
      return;
    }

    navigate(`/profile/${data.id}`); 
  };
  
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g; 
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  
  content.replace(mentionRegex, (match, handle, index) => {
    if (index > lastIndex) {
      parts.push(content.substring(lastIndex, index));
    }

    const MentionComponent = (
      <span
        key={`mention-${index}-${handle}`}
        className="text-blue-500 font-medium cursor-pointer hover:underline"
        onClick={(e) => {
          e.stopPropagation(); 
          lookupAndNavigateByHandle(handle); 
        }}
      >
        {match}
      </span>
    );
    parts.push(MentionComponent);
    lastIndex = index + match.length;
    return match;
  });

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }
  
  return <>{parts}</>;
};
// --- END UTILITY ---


// --- PostCard Component ---
const PostCard = ({ post, addReply, user, navigate, onAcknowledge }:
  { post: Post; addReply: (postId: string, reply: Reply) => void; user: any; navigate: any; onAcknowledge: (postId: string, hasLiked: boolean) => void }) => {

  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !user) {
      toast.error('You must be logged in to comment');
      return;
    }

    const trimmedReplyText = replyText.trim();
    setReplyText(''); 

    // Optimistic Update
    const optimisticReply: Reply = {
      id: new Date().getTime().toString(),
      post_id: post.id,
      author_id: user.id,
      content: trimmedReplyText,
      created_at: new Date().toISOString(),
      profiles: {
        display_name: user?.user_metadata?.display_name || 'User',
        handle: user?.user_metadata?.handle || 'user',
        is_verified: user?.user_metadata?.is_verified || false,
        is_organization_verified: user?.user_metadata?.is_organization_verified || false,
      },
    };
    addReply(post.id, optimisticReply);
    setShowComments(true);

    // Database Write
    const { error } = await supabase.from('post_replies').insert({
      post_id: post.id,
      author_id: user.id,
      content: trimmedReplyText,
    });

    if (error) {
      toast.error('Failed to post reply');
      console.error(error);
    }
  };

  return (
    <div className="flex border-b border-border py-3 px-4 transition-colors hover:bg-muted/5">
      {/* Author Icon */}
      <div
        className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer"
        onClick={() => handleViewProfile(post.author_id)}
      >
        <User className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Post Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-1 min-w-0">
            <span
              className="font-bold text-foreground text-sm cursor-pointer hover:underline whitespace-nowrap"
              onClick={() => handleViewProfile(post.author_id)}
            >
              {post.profiles.display_name}
            </span>
            <VerifiedBadge isVerified={post.profiles.is_verified} isOrgVerified={post.profiles.is_organization_verified} />

            {/* Post Author Handle and Time */}
            <span
              className="text-muted-foreground text-sm hover:underline cursor-pointer truncate flex-shrink min-w-0"
              onClick={() => handleViewProfile(post.author_id)}
            >
              @{post.profiles.handle}
            </span>

            <span className="text-muted-foreground text-sm flex-shrink-0">·</span>
            <span className="text-muted-foreground text-sm whitespace-nowlrap flex-shrink-0">
              {formatTime(post.created_at)}
            </span>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0 ml-2">
            <Ellipsis className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* 🎯 POST CONTENT WRAPPED IN LINK TO DETAIL PAGE */}
        <Link to={`/post/${post.id}`} className="block">
          <p className="text-foreground text-base mt-1 mb-2 leading-relaxed whitespace-pre-wrap">
            {parsePostContent(post.content, navigate)}
          </p>
        </Link>
        {/* END POST CONTENT LINK */}


        {/* Post Actions */}
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-3 -ml-2 max-w-[420px]">
          <Button variant="ghost" size="sm" className="flex items-center gap-1 group" onClick={() => setShowComments(!showComments)}>
            <MessageSquare className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="group-hover:text-primary transition-colors text-xs">{post.reply_count > 0 ? post.reply_count : ''}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 group" onClick={() => onAcknowledge(post.id, post.has_liked)}>
            <Heart className={`h-4 w-4 group-hover:text-red-500 transition-colors ${post.has_liked ? 'text-red-500 fill-red-500' : ''}`} />
            <span className={`group-hover:text-red-500 transition-colors text-xs ${post.has_liked ? 'text-red-500' : ''}`}>{post.like_count > 0 ? post.like_count : ''}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 group">
            <Share className="h-4 w-4 group-hover:text-primary transition-colors" />
          </Button>
        </div>

        {/* --- IG-STYLE COMMENT SECTION (Unchanged) --- */}
        <div className="mt-3">
          {post.reply_count > 0 && !showComments && (
            <span
              className="text-sm text-muted-foreground cursor-pointer hover:underline"
              onClick={() => setShowComments(true)}
            >
              View all {post.reply_count} {post.reply_count === 1 ? 'comment' : 'comments'}
            </span>
          )}

          {showComments && post.replies && post.replies.length > 0 && (
            <div className="space-y-2 pt-2">
              {post.replies.map((reply) => (
                <div key={reply.id} className="text-sm flex items-center">
                  <span
                    className="font-bold text-muted-foreground cursor-pointer hover:underline flex-shrink-0"
                    onClick={() => handleViewProfile(reply.author_id)}
                  >
                    {reply.profiles.handle}
                  </span>
                  <VerifiedBadge isVerified={reply.profiles.is_verified} isOrgVerified={reply.profiles.is_organization_verified} />
                  
                  <p className="text-foreground ml-1.5 whitespace-pre-wrap break-words">
                    {parsePostContent(reply.content, navigate)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          {showComments && user && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleReplySubmit();
                }}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent border-b border-input text-sm text-foreground focus:outline-none focus:ring-0 focus:border-primary p-1"
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={!replyText.trim()}
                onClick={handleReplySubmit}
                className="text-primary font-bold disabled:text-muted-foreground disabled:opacity-70 p-0"
              >
                Post
              </Button>
            </div>
          )}
          {showComments && !user && (
            <div className="mt-3 text-sm text-muted-foreground">
              Please <a href="/auth" className="text-primary underline">log in</a> to comment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Feed Component (Unchanged) ---
const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceLoaded, setForceLoaded] = useState(false);
  const navigate = useNavigate();

  const addReply = useCallback((postId: string, newReply: Reply) => {
    setPosts((cur) =>
      cur.map((p) =>
        p.id === postId
          ? {
            ...p,
            replies: [...(p.replies || []), newReply].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ),
            reply_count: (p.reply_count || 0) + 1,
          }
          : p
      )
    );
  }, []);

  const handleAcknowledge = useCallback(async (postId: string, currentHasLiked: boolean) => {
    if (!user) {
      toast.error('You must be logged in to like a post');
      return;
    }
    const currentUserId = user.id;

    setPosts((currentPosts) =>
      currentPosts.map((p) =>
        p.id === postId
          ? { ...p, has_liked: !currentHasLiked, like_count: p.like_count + (!currentHasLiked ? 1 : -1) }
          : p
      )
    );

    if (currentHasLiked) {
      const { error } = await supabase
        .from('post_acknowledgments')
        .delete()
        .match({ post_id: postId, user_id: currentUserId });

      if (error) {
        toast.error('Failed to unacknowledge post');
        setPosts((currentPosts) =>
          currentPosts.map((p) =>
            p.id === postId
              ? { ...p, has_liked: currentHasLiked, like_count: p.like_count + 1 }
              : p
          )
        );
      }
    } else {
      const { error } = await supabase
        .from('post_acknowledgments')
        .insert({ post_id: postId, user_id: currentUserId });

      if (error) {
        toast.error('Failed to acknowledge post');
        setPosts((currentPosts) =>
          currentPosts.map((p) =>
            p.id === postId
              ? { ...p, has_liked: currentHasLiked, like_count: p.like_count - 1 }
              : p
          )
        );
      }
    }
  }, [user]);


  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let { data: postData, error: postsError } = await supabase
        .from('posts')
        .select('*, profiles(display_name, handle, is_verified, is_organization_verified)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      if (!postData) postData = [];

      const postIds = postData.map((p) => p.id);

      const { data: repliesData, error: repliesError } = await supabase
        .from('post_replies')
        .select('*, profiles(display_name, handle, is_verified, is_organization_verified)')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      const { data: ackData, error: ackError } = await supabase
        .from('post_acknowledgments')
        .select('post_id, user_id')
        .in('post_id', postIds);

      if (ackError) throw ackError;

      const repliesByPostId = new Map<string, Reply[]>();
      (repliesData || []).forEach((r) => {
        if (!repliesByPostId.has(r.post_id)) {
          repliesByPostId.set(r.post_id, []);
        }
        repliesByPostId.get(r.post_id)!.push(r as Reply);
      });

      const acksByPostId = new Map<string, string[]>();
      (ackData || []).forEach((ack) => {
        if (!acksByPostId.has(ack.post_id)) {
          acksByPostId.set(ack.post_id, []);
        }
        acksByPostId.get(ack.post_id)!.push(ack.user_id);
      });

      const currentUserId = user?.id || null;
      const finalPosts: Post[] = postData.map((post) => {
        const replies = repliesByPostId.get(post.id) || [];
        const acks = acksByPostId.get(post.id) || [];

        return {
          ...post,
          profiles: post.profiles || { display_name: 'Unknown', handle: 'unknown', is_verified: false, is_organization_verified: false },
          replies: replies,
          reply_count: replies.length,
          like_count: acks.length,
          has_liked: currentUserId ? acks.includes(currentUserId) : false,
        } as Post;
      });

      setPosts(finalPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (err instanceof Error) {
        toast.error('Could not fetch feed. Check RLS policies or console.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();

    const postsChannel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, handle, is_verified, is_organization_verified')
            .eq('id', payload.new.author_id)
            .single();

          if (profile) {
            const newPost = {
              ...payload.new,
              profiles: profile,
              replies: [],
              like_count: 0,
              reply_count: 0,
              has_liked: false,
            } as Post;
            setPosts((cur) => [newPost, ...cur]);
          }
        }
      )
      .subscribe();

    const repliesChannel = supabase
      .channel('replies-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_replies' },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, handle, is_verified, is_organization_verified')
            .eq('id', payload.new.author_id)
            .single();

          if (profile) {
            const newReply = { ...payload.new, profiles: profile } as Reply;
            addReply(payload.new.post_id, newReply);
          }
        }
      )
      .subscribe();

    const acksChannel = supabase
      .channel('acks-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_acknowledgments' },
        (payload) => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(repliesChannel);
      supabase.removeChannel(acksChannel);
    };
  }, [user, addReply, fetchPosts]);

  // --- Post Skeleton Component ---
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


  // --- Render Logic ---
  const effectiveLoading = loading && !forceLoaded;
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (effectiveLoading) {
    return (
      <div className="flex flex-col h-full">
        {[...Array(5)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {posts.length === 0 && !effectiveLoading ? (
          <div className="text-center text-muted-foreground py-8">
            No posts yet. Follow users or share your first post!
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              addReply={addReply}
              user={user}
              navigate={navigate}
              onAcknowledge={handleAcknowledge}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
