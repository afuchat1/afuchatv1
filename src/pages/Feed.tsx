import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, ThumbsUp, User, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; 

interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: {
    display_name: string;
    handle: string;
    verified?: boolean;
  };
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();

    // Real-time subscription for immediate updates
    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          // Construct the new post with profile data for immediate display
          const newPost = { 
            ...payload.new, 
            profiles: { 
              display_name: user?.user_metadata?.display_name || 'User', 
              handle: user?.user_metadata?.handle || 'user',
              verified: user?.user_metadata?.verified || false
            } 
          } as Post;
          setPosts(currentPosts => [newPost, ...currentPosts]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(display_name, handle, verified)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Query failed, retrying without verified field...', error.message);
        // fallback if verified column doesn't exist
        const retry = await supabase
          .from('posts')
          .select('*, profiles(display_name, handle)')
          .order('created_at', { ascending: false })
          .limit(50);
        setPosts(retry.data as Post[]);
      } else if (data) {
        setPosts(data as Post[]);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };
  
  // --- Skeleton Loading (Rich, Borderless Design) ---
  const PostSkeleton = () => (
    <div className="p-4 rounded-xl bg-card shadow-xl space-y-3 animate-pulse"> 
      <div className="flex items-center space-x-3">
         <Skeleton className="h-8 w-8 rounded-full bg-muted" /> 
         <Skeleton className="h-4 w-1/4 bg-muted" />
      </div>
      <Skeleton className="h-4 w-full bg-muted" />
      <Skeleton className="h-4 w-5/6 bg-muted" />
      <div className="pt-3 flex justify-start space-x-4 items-center text-sm text-muted-foreground">
         <Skeleton className="h-4 w-16 bg-muted" />
         <Skeleton className="h-4 w-16 bg-muted" />
         <Skeleton className="h-4 w-12 bg-muted" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full space-y-4 p-4">
        {[...Array(5)].map((_, i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  // --- Rich Design: Post Card Component (Display Name First) ---
  const PostCard = ({ post }: { post: Post }) => {
    const timeSince = new Date(post.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });

    return (
      <Card className="p-4 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
        {/* Post Header */}
        <div className="flex items-center space-x-3 mb-3">
          {/* User Icon (Text-only placeholder) */}
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <User className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline flex-wrap gap-1">
                {/* Display Name */}
                <span className="font-semibold text-foreground text-md truncate mr-1 flex items-center gap-1">
                  {post.profiles.display_name}
                  {post.profiles.verified && (
                    <span className="inline-flex items-center justify-center rounded-full bg-sky-500 p-[2px] shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                </span>
                {/* Handle */}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  @{post.profiles.handle}
                </span>
            </div>
          </div>
          
          <span className="text-xs text-muted-foreground whitespace-nowrap">{timeSince}</span>
        </div>

        {/* Post Content */}
        <p className="text-foreground text-base mb-4 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Post Footer */}
        <div className="flex justify-start space-x-6 text-sm text-muted-foreground pt-3 border-t border-muted-foreground/10"> 
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">Reply</span>
          </button>
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">Acknowledge</span>
          </button>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-2">
        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No posts yet. Tap the <User className="inline h-4 w-4" /> button to share your first post!
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
