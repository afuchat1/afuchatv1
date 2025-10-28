import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, ThumbsUp, User, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

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
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();

    // Subscribe to new posts
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
          // Optimistically update the list by adding the new post data
          const newPost = { ...payload.new, profiles: { display_name: user?.user_metadata?.display_name || 'User', handle: user?.user_metadata?.handle || 'user' } } as Post;
          setPosts(currentPosts => [newPost, ...currentPosts]);
          setNewPost(''); // Clear field on successful insert (optional)
        }
      )
      .subscribe();
      
    // Re-fetch on channel connection or error (less aggressive than full fetch on every insert)
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
      setPosts(data);
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;

    if (newPost.length > 280) {
      toast.error('Post must be 280 characters or less');
      return;
    }

    // Client-side content validation is crucial for Instantaneous Utility
    const postContent = newPost.trim();

    // Reset UI state immediately for faster perceived responsiveness
    setNewPost(''); 
    
    const { error } = await supabase.from('posts').insert({
      content: postContent,
      author_id: user.id,
    });

    if (error) {
      // Revert if API fails
      toast.error('Failed to post. Please try again.');
      setNewPost(postContent); 
    } else {
      // Success toast is handled by the real-time channel updating the state
      toast.success('Post sent instantly!');
    }
  };
  
  // --- Rich Design: Card Skeleton for a Text Post ---
  const PostSkeleton = () => (
    <div className="p-4 border border-border rounded-xl bg-card shadow-lg space-y-3 animate-pulse">
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
        {/* Skeleton for the Post Input Card */}
        <div className="p-4 border border-border rounded-xl bg-card shadow-lg space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
        {/* Skeleton for the Feed List */}
        {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  // --- Rich Design: Post Card Component ---
  const PostCard = ({ post }: { post: Post }) => {
    const timeSince = new Date(post.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });

    return (
      <Card className="p-4 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
        {/* Post Header */}
        <div className="flex items-center space-x-3 mb-3">
          {/* User Icon - Rich placeholder emphasizing NO PROFILE PICTURES */}
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-md">{post.profiles.display_name}</p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{timeSince}</span>
        </div>

        {/* Post Content */}
        <p className="text-foreground text-base mb-4 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Post Footer - Actions */}
        <div className="flex justify-start space-x-6 text-sm text-muted-foreground border-t pt-3">
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
      {/* Post Creation Area - Elevated and Richer Input */}
      <Card className="p-4 rounded-xl shadow-lg mb-6 sticky top-0 z-10 bg-background/90 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-3 text-foreground">Share an Update</h3>
        <Textarea
          placeholder="What's happening? (Text-only, max 280 characters)"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          maxLength={280}
          rows={3}
          className="mb-3 resize-none border-input focus-visible:ring-primary"
        />
        <div className="flex justify-between items-center">
          <span className={`text-sm ${newPost.length > 250 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {280 - newPost.length} characters left
          </span>
          <Button 
            onClick={handlePost} 
            disabled={!newPost.trim() || newPost.length > 280} 
            className="flex items-center space-x-2 shadow-md rounded-full px-5"
          >
            <Send className="h-4 w-4" />
            <span>Post</span>
          </Button>
        </div>
      </Card>

      {/* Feed Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No posts yet. Be the first to post!
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
