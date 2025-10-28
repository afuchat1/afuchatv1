import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
// Removed: Button (it's in Index.jsx now)
// Removed: Textarea (it's in NewPostModal.tsx now)
import { toast } from 'sonner';
import { MessageSquare, ThumbsUp, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; 
// Removed: Import of NewPostModal or any direct path leading to it

interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: {
    display_name: string;
    handle: string;
  };
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NOTE: The posting logic (handlePost) has been removed, as it now lives in NewPostModal.tsx.

  useEffect(() => {
    fetchPosts();

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
          const newPost = { 
            ...payload.new, 
            profiles: { 
              display_name: user?.user_metadata?.display_name || 'User', 
              handle: user?.user_metadata?.handle || 'user' 
            } 
          } as Post;
          setPosts(currentPosts => [newPost, ...currentPosts]);
        }
      )
      .subscribe();
      
    channel.on('error', () => fetchPosts());

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(display_name, handle)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setPosts(data as Post[]);
    }
    setLoading(false);
  };
  
  // --- Rich Design: Card Skeleton ---
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

  // --- Rich Design: Post Card Component ---
  const PostCard = ({ post }: { post: Post }) => {
    const timeSince = new Date(post.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });

    return (
      <Card className="p-4 rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
        {/* Post Header */}
        <div className="flex items-center space-x-3 mb-3">
          {/* User Icon */}
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <User className="h-4 w-4" />
          </div>
          
          {/* Handle positioned before Display Name and sized small */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline flex-wrap">
                <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">
                    @{post.profiles.handle}
                </span>
                <span className="font-semibold text-foreground text-md truncate">
                    {post.profiles.display_name}
                </span>
            </div>
          </div>
          
          <span className="text-xs text-muted-foreground whitespace-nowrap">{timeSince}</span>
        </div>

        {/* Post Content */}
        <p className="text-foreground text-base mb-4 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Post Footer - Actions */}
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
