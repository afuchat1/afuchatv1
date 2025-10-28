import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, ThumbsUp } from 'lucide-react';

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
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

    const { error } = await supabase.from('posts').insert({
      content: newPost,
      author_id: user.id,
    });

    if (error) {
      toast.error('Failed to post');
    } else {
      setNewPost('');
      toast.success('Posted!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading feed...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold mb-4">Feed</h1>
        
        <Card className="p-4">
          <Textarea
            placeholder="What's happening? (280 characters max)"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            maxLength={280}
            rows={3}
            className="mb-2 resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {newPost.length}/280
            </span>
            <Button onClick={handlePost} disabled={!newPost.trim()}>
              Post
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No posts yet. Be the first to post!
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="mb-2">
                <span className="font-semibold">{post.profiles.display_name}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  @{post.profiles.handle}
                </span>
              </div>
              <p className="mb-3">{post.content}</p>
              <div className="flex gap-4 text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-primary">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Reply</span>
                </button>
                <button className="flex items-center gap-1 hover:text-accent">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">Acknowledge</span>
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;