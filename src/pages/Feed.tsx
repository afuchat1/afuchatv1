import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, ThumbsUp, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: {
    display_name: string;
    handle: string;
    is_verified?: boolean;
    is_organization_verified?: boolean;
  };
  replies?: Reply[];
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
    is_verified?: boolean;
    is_organization_verified?: boolean;
  };
}

// --- Twitter Verified Badge (Blue) ---
const TwitterVerifiedBadge = () => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className="inline w-[16px] h-[16px] ml-0.5"
  >
    <path
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      fill="#1d9bf0"
    />
  </svg>
);

// --- Twitter Organization Verified Badge (Gold) ---
const TwitterOrganizationVerifiedBadge = () => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className="inline w-[16px] h-[16px] ml-0.5"
  >
    <defs>
      <linearGradient id="goldGradient1" x1="4" x2="19.5" y1="1.5" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#F4E72A" />
        <stop offset="0.539" stopColor="#CD8105" />
        <stop offset="0.68" stopColor="#CB7B00" />
        <stop offset="1" stopColor="#F4EC26" />
      </linearGradient>
      <linearGradient id="goldGradient2" x1="5" x2="17.5" y1="2.5" y2="19.5" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#F9E87F" />
        <stop offset="0.406" stopColor="#E2B719" />
        <stop offset="0.989" stopColor="#E2B719" />
      </linearGradient>
    </defs>
    <g>
      <path
        clipRule="evenodd"
        d="M13.596 3.011L11 .5 8.404 3.011l-3.576-.506-.624 3.558-3.19 1.692L2.6 11l-1.586 3.245 3.19 1.692.624 3.558 3.576-.506L11 21.5l2.596-2.511 3.576.506.624-3.558 3.19-1.692L19.4 11l1.586-3.245-3.19-1.692-.624-3.558-3.576.506zM6 11.39l3.74 3.74 6.2-6.77L14.47 7l-4.8 5.23-2.26-2.26L6 11.39z"
        fill="url(#goldGradient1)"
        fillRule="evenodd"
      />
      <path
        clipRule="evenodd"
        d="M13.348 3.772L11 1.5 8.651 3.772l-3.235-.458-.565 3.219-2.886 1.531L3.4 11l-1.435 2.936 2.886 1.531.565 3.219 3.235-.458L11 20.5l2.348-2.272 3.236.458.564-3.219 2.887-1.531L18.6 11l1.435-2.936-2.887-1.531-.564-3.219-3.236.458zM6 11.39l3.74 3.74 6.2-6.77L14.47 7l-4.8 5.23-2.26-2.26L6 11.39z"
        fill="url(#goldGradient2)"
        fillRule="evenodd"
      />
      <path
        clipRule="evenodd"
        d="M6 11.39l3.74 3.74 6.197-6.767h.003V9.76l-6.2 6.77L6 12.79v-1.4zm0 0z"
        fill="#D18800"
        fillRule="evenodd"
      />
    </g>
  </svg>
);

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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
            .select('display_name, handle, is_verified, is_organization_verified')
            .eq('id', payload.new.author_id)
            .single();

          if (profile) {
            const newPost = {
              ...payload.new,
              profiles: profile,
              replies: [],
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
            .select('display_name, handle, is_verified, is_organization_verified')
            .eq('id', payload.new.author_id)
            .single();

          if (profile) {
            const newReply = {
              ...payload.new,
              profiles: profile,
            } as Reply;
            setPosts((cur) =>
              cur.map((p) =>
                p.id === payload.new.post_id
                  ? {
                      ...p,
                      replies: [...(p.replies || []), newReply].sort(
                        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                      ),
                    }
                  : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(repliesChannel);
    };
  }, [user]);

  const fetchPosts = async () => {
    try {
      let { data, error } = await supabase
        .from('posts')
        .select('*, profiles(display_name, handle, is_verified, is_organization_verified)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const postIds = data.map((p) => p.id);

        const { data: repliesData, error: repliesError } = await supabase
          .from('post_replies')
          .select('*, profiles(display_name, handle, is_verified, is_organization_verified)')
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
          replies: repliesByPostId.get(post.id) || [],
        })) as Post[];
      }

      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const PostSkeleton = () => (
    <div className="p-4 rounded-xl bg-card space-y-3 animate-pulse">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-full bg-muted" />
        <Skeleton className="h-4 w-1/4 bg-muted" />
      </div>
      <Skeleton className="h-4 w-full bg-muted" />
      <Skeleton className="h-4 w-5/6 bg-muted" />
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  const PostCard = ({ post, addReply, user }: { post: Post; addReply: (postId: string, reply: Reply) => void; user: any }) => {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');

    const timeSince = new Date(post.created_at).toLocaleTimeString('en-UG', {
      hour: '2-digit',
      minute: '2-digit',
    });

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

      // Optimistic update
      const optimisticReply: Reply = {
        id: '', // Will be updated by realtime
        post_id: post.id,
        author_id: user.id,
        content: replyText,
        created_at: new Date().toISOString(),
        profiles: {
          display_name: user?.user_metadata?.display_name || 'User',
          handle: user?.user_metadata?.handle || 'user',
          is_verified: user?.user_metadata?.is_verified || false,
          is_organization_verified: user?.user_metadata?.is_organization_verified || false,
        },
      };

      addReply(post.id, optimisticReply);
      setReplyText('');
      setShowReply(false);
    };

    const replyCount = post.replies?.length || 0;

    const renderVerifiedBadge = (profile: any) => {
      if (profile.is_organization_verified) {
        return <TwitterOrganizationVerifiedBadge />;
      }
      if (profile.is_verified) {
        return <TwitterVerifiedBadge />;
      }
      return null;
    };

    return (
      <Card className="p-4 rounded-xl">
        {/* Post Header */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <User className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline flex-wrap gap-1">
              <span className="font-semibold text-foreground text-md truncate flex items-center gap-0.5">
                {post.profiles.display_name}
                {renderVerifiedBadge(post.profiles)}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                @{post.profiles.handle}
              </span>
            </div>
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeSince}
          </span>
        </div>

        {/* Post Content */}
        <p className="text-foreground text-base mb-4 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Replies */}
        {post.replies && post.replies.length > 0 && (
          <div className="space-y-3 mb-4">
            {post.replies.map((reply) => {
              const replyTime = new Date(reply.created_at).toLocaleTimeString('en-UG', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div key={reply.id} className="pl-6 border-l border-muted-foreground/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm truncate flex items-center gap-0.5">
                      {reply.profiles.display_name}
                      {renderVerifiedBadge(reply.profiles)}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      @{reply.profiles.handle}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mb-1 leading-relaxed whitespace-pre-wrap">
                    {reply.content}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {replyTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Post Footer */}
        <div className="flex justify-start space-x-6 text-sm text-muted-foreground pt-3">
          <button
            onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">
              {replyCount > 0 ? `${replyCount}` : 'Reply'}
            </span>
          </button>
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">Acknowledge</span>
          </button>
        </div>

        {/* Reply Input */}
        {showReply && (
          <div className="mt-3 flex space-x-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tweet your reply"
              className="flex-1 p-3 border border-muted-foreground rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              maxLength={280}
            />
            <div className="flex flex-col justify-end space-y-2">
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setShowReply(false);
                  setReplyText('');
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-2">
        {posts.length === 0 ? (
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
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
