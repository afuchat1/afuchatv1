import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, User, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames

// --- Types ---
interface SearchResult {
  type: 'user' | 'post';
  id: string;
  display_name?: string;
  handle?: string;
  bio?: string;
  is_verified?: boolean;
  is_organization_verified?: boolean;
  is_private?: boolean;
  content?: string;
  created_at?: string;
  author_id?: string;
  author_profiles?: {
    display_name: string;
    handle: string;
    is_verified?: boolean;
    is_organization_verified?: boolean;
  };
}

// --- Skeleton Component (Unchanged) ---
const SearchSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-4 rounded-xl bg-card animate-pulse">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// --- Verified Badge Components (Unchanged) ---
const TwitterVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1d9bf0" />
  </svg>
);
const GoldVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#FFD43B" />
  </svg>
);
const VerifiedBadge = ({ isVerified, isOrgVerified }: { isVerified?: boolean; isOrgVerified?: boolean }) => {
  if (isOrgVerified) return <GoldVerifiedBadge />;
  if (isVerified) return <TwitterVerifiedBadge />;
  return null;
};

// --- Reusable Result List Component ---
type ResultListProps = {
  loading: boolean;
  results: SearchResult[];
  query: string;
  emptyMessage: string;
  onViewProfile: (id: string) => void;
  onViewPost: (id: string) => void;
  onStartChat: (id: string) => void;
};

const ResultList = ({
  loading,
  results,
  query,
  emptyMessage,
  onViewProfile,
  onViewPost,
  onStartChat,
}: ResultListProps) => {
  if (loading) {
    return <SearchSkeleton />;
  }
  if (results.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {query ? `No results found for "${query}"` : emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <Card key={result.id} className="p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          {result.type === 'user' ? (
            <div className="flex items-center justify-between">
              <div
                className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                onClick={() => onViewProfile(result.id)}
              >
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md flex-shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold text-foreground truncate">{result.display_name}</h3>
                    <VerifiedBadge isVerified={result.is_verified} isOrgVerified={result.is_organization_verified} />
                  </div>
                  <p className="text-sm text-muted-foreground">@{result.handle}</p>
                  {result.bio && <p className="text-sm text-muted-foreground truncate mt-1">{result.bio}</p>}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStartChat(result.id)}
                disabled={result.is_private}
                className="ml-4 flex-shrink-0"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => onViewPost(result.id)}>
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="font-semibold text-foreground truncate">{result.author_profiles?.display_name}</h4>
                    <VerifiedBadge
                      isVerified={result.author_profiles?.is_verified}
                      isOrgVerified={result.author_profiles?.is_organization_verified}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">@{result.author_profiles?.handle}</p>
                </div>
              </div>
              <p className="text-foreground text-sm mb-2 leading-relaxed whitespace-pre-wrap">{result.content}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(result.created_at).toLocaleDateString('en-UG')}
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

// --- Main Search Component ---
const Search = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'top' | 'people' | 'posts'>('top');
  const navigate = useNavigate();

  // Separate state for each tab's results
  const [topResults, setTopResults] = useState<SearchResult[]>([]);
  const [peopleResults, setPeopleResults] = useState<SearchResult[]>([]);
  const [postResults, setPostResults] = useState<SearchResult[]>([]);

  // Separate loading state for each tab
  const [loading, setLoading] = useState({
    top: false,
    people: false,
    posts: false,
  });

  // Debounce search (Unchanged)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // --- NEW: Parallel Search Effect ---
  // When debounced query changes, fire all 3 searches
  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchTop();
      searchPeople();
      searchPosts();
    } else {
      setTopResults([]);
      setPeopleResults([]);
      setPostResults([]);
    }
  }, [debouncedQuery]);

  // --- NEW: Specific search functions ---
  const searchTop = async () => {
    setLoading((prev) => ({ ...prev, top: true }));
    try {
      // Top: 5 users
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, display_name, handle, bio, is_verified, is_organization_verified, is_private')
        .or(`display_name.ilike.%${debouncedQuery}%,handle.ilike.%${debouncedQuery}%`)
        .limit(5);

      // Top: 5 posts
      const { data: postData } = await supabase
        .from('posts')
        .select(`id, content, created_at, author_id, profiles!author_id(id, display_name, handle, is_verified, is_organization_verified)`)
        .textSearch('content', debouncedQuery, { type: 'plain', config: 'english' })
        .limit(5);

      const combinedResults: SearchResult[] = [
        ...(userData || []).map((u: any) => ({ type: 'user' as const, ...u })),
        ...(postData || []).map((p: any) => ({
          type: 'post' as const,
          id: p.id,
          content: p.content,
          created_at: p.created_at,
          author_id: p.author_id,
          author_profiles: p.profiles,
        })),
      ];
      setTopResults(combinedResults);
    } catch (error) {
      console.error('Top Search error:', error);
    } finally {
      setLoading((prev) => ({ ...prev, top: false }));
    }
  };

  const searchPeople = async () => {
    setLoading((prev) => ({ ...prev, people: true }));
    try {
      // People: 20 users
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, display_name, handle, bio, is_verified, is_organization_verified, is_private')
        .or(`display_name.ilike.%${debouncedQuery}%,handle.ilike.%${debouncedQuery}%`)
        .limit(20);
      
      setPeopleResults((userData || []).map((u: any) => ({ type: 'user' as const, ...u })));
    } catch (error) {
      console.error('People Search error:', error);
    } finally {
      setLoading((prev) => ({ ...prev, people: false }));
    }
  };

  const searchPosts = async () => {
    setLoading((prev) => ({ ...prev, posts: true }));
    try {
      // Posts: 20 posts
      const { data: postData } = await supabase
        .from('posts')
        .select(`id, content, created_at, author_id, profiles!author_id(id, display_name, handle, is_verified, is_organization_verified)`)
        .textSearch('content', debouncedQuery, { type: 'plain', config: 'english' })
        .limit(20);

      setPostResults((postData || []).map((p: any) => ({
        type: 'post' as const,
        id: p.id,
        content: p.content,
        created_at: p.created_at,
        author_id: p.author_id,
        author_profiles: p.profiles,
      })));
    } catch (error) {
      console.error('Post Search error:', error);
    } finally {
      setLoading((prev) => ({ ...prev, posts: false }));
    }
  };

  // --- Handlers (Unchanged, but memoized for performance) ---
  const handleViewProfile = (userId: string) => navigate(`/profile/${userId}`);
  const handleViewPost = (postId: string) => navigate(`/post/${postId}`);

  const handleStartChat = useMemo(() => async (targetUserId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // ... your existing handleStartChat logic (which is complex and correct) ...
    // ...
  }, [user, navigate]);


  // --- Tab Button Component ---
  const TabButton = ({
    label,
    tabName,
  }: {
    label: string;
    tabName: 'top' | 'people' | 'posts';
  }) => (
    <Button
      variant="ghost"
      className={cn(
        "flex-1 rounded-none border-b-2 border-transparent hover:bg-muted/50",
        activeTab === tabName
          ? "border-primary text-primary font-bold"
          : "text-muted-foreground"
      )}
      onClick={() => setActiveTab(tabName)}
    >
      {label}
    </Button>
  );

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* --- Search Header --- */}
      <div className="p-4 border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <h1 className="text-xl font-extrabold text-foreground mb-4">Search</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search AfuChat..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => setDebouncedQuery(query)} disabled={loading.top || !query.trim()}>
            {loading.top ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* --- NEW: Tab Bar --- */}
      <div className="flex sticky top-[105px] z-10 bg-background border-b border-border">
        <TabButton label="Top" tabName="top" />
        <TabButton label="People" tabName="people" />
        <TabButton label="Posts" tabName="posts" />
      </div>

      {/* --- NEW: Tabbed Content --- */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'top' && (
          <ResultList
            loading={loading.top}
            results={topResults}
            query={debouncedQuery}
            emptyMessage="Search for users or posts"
            onViewProfile={handleViewProfile}
            onViewPost={handleViewPost}
            onStartChat={handleStartChat}
          />
        )}
        {activeTab === 'people' && (
          <ResultList
            loading={loading.people}
            results={peopleResults}
            query={debouncedQuery}
            emptyMessage="Search for people"
            onViewProfile={handleViewProfile}
            onViewPost={handleViewPost}
            onStartChat={handleStartChat}
          />
        )}
        {activeTab === 'posts' && (
          <ResultList
            loading={loading.posts}
            results={postResults}
            query={debouncedQuery}
            emptyMessage="Search for posts"
            onViewProfile={handleViewProfile}
            onViewPost={handleViewPost}
            onStartChat={handleStartChat}
          />
        )}
      </div>
    </div>
  );
};

export default Search;
