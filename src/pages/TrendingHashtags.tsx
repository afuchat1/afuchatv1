import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, TrendingUp, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface HashtagTrend {
  hashtag: string;
  count: number;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    handle: string;
  };
}

export default function TrendingHashtags() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedHashtag = searchParams.get('tag');
  
  const [trends, setTrends] = useState<HashtagTrend[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  useEffect(() => {
    if (selectedHashtag) {
      fetchPostsByHashtag(selectedHashtag);
    }
  }, [selectedHashtag]);

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trending_topics', {
        hours_ago: 168, // Last week
        num_topics: 20
      });

      if (error) throw error;
      
      const hashtagTrends = data
        .filter((item: any) => item.topic.startsWith('#'))
        .map((item: any) => ({
          hashtag: item.topic.substring(1),
          count: item.post_count
        }));

      setTrends(hashtagTrends);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      toast.error('Failed to load trending hashtags');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsByHashtag = async (hashtag: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          profiles (
            id,
            display_name,
            handle
          )
        `)
        .ilike('content', `%#${hashtag}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/trending?tag=${encodeURIComponent(hashtag)}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Trending Hashtags
            </h1>
            <p className="text-sm text-muted-foreground">Discover what's popular on AfuChat</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Trending List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : trends.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No trending hashtags yet</p>
              ) : (
                trends.map((trend, index) => (
                  <button
                    key={trend.hashtag}
                    onClick={() => handleHashtagClick(trend.hashtag)}
                    className={`w-full p-3 rounded-lg hover:bg-accent transition-colors text-left ${
                      selectedHashtag === trend.hashtag ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-medium">#{index + 1}</span>
                        <div>
                          <p className="font-semibold text-primary">#{trend.hashtag}</p>
                          <p className="text-xs text-muted-foreground">{trend.count} posts</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{trend.count}</Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Posts Preview */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedHashtag ? `#${selectedHashtag}` : 'Select a hashtag'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedHashtag ? (
                <p className="text-center text-muted-foreground py-8">
                  Click on a hashtag to see posts
                </p>
              ) : loadingPosts ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full mb-2" />
                ))
              ) : posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No posts found</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="w-full p-3 rounded-lg hover:bg-accent transition-colors text-left border border-border"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">@{post.profiles.handle}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {post.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
