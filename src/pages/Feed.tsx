import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ThumbsUp, User, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: {
    display_name: string;
    handle: string;
    verified?: boolean;
  } | null;
}

export function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          // Try to load verified; if missing, Supabase ignores it gracefully
          .select('*, profiles(display_name, handle, verified)')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.warn('Supabase query failed, retrying without verified...', error.message);
          // Retry without verified (fallback)
          const retry = await supabase
            .from('posts')
            .select('*, profiles(display_name, handle)')
            .order('created_at', { ascending: false })
            .limit(50);
          if (retry.error) throw retry.error;
          setPosts(retry.data as Post[]);
        } else {
          setPosts(data as Post[]);
        }
      } catch (err) {
        console.error('Error loading posts:', err);
        toast.error('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        No posts available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted flex items-center justify-center w-10 h-10">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground text-md truncate flex items-center gap-1">
                    {post.profiles?.display_name || 'Unknown'}
                    {post.profiles?.verified && (
                      <div className="bg-sky-500 rounded-full p-[2px] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  @{post.profiles?.handle || 'anonymous'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-line">
              {post.content}
            </p>
            <div className="flex items-center gap-6 mt-3 text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-foreground transition">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">Like</span>
              </button>
              <button className="flex items-center gap-1 hover:text-foreground transition">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Comment</span>
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
