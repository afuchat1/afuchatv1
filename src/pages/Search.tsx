import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, User, MessageSquare, Loader2, TrendingUp, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

// --- Type Definitions ---
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

interface Trend {
  id: number;
  topic: string; // Could be a hashtag or keyword
  post_count: number;
}

// --- Placeholder for Trends (Replace with real Supabase fetch later) ---
const mockTrends: Trend[] = [
  { id: 1, topic: '#AfuchatUpdate', post_count: 5240 },
  { id: 2, topic: 'Supabase Features', post_count: 3100 },
  { id: 3, topic: 'Ugandan Devs', post_count: 2850 },
  { id: 4, topic: 'Frontend React Tips', post_count: 1520 },
  { id: 5, topic: '#KampalaTech', post_count: 1200 },
];

// --- Verified Badge Components (Unchanged) ---
const TwitterVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1 fill-[#1d9bf0] flex-shrink-0`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);

const GoldVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1 fill-[#FFD43B] flex-shrink-0`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);

const VerifiedBadge = ({ isVerified, isOrgVerified }: { isVerified?: boolean; isOrgVerified?: boolean }) => {
  if (isOrgVerified) {
    return <GoldVerifiedBadge />;
  }
  if (isVerified) {
    return <TwitterVerifiedBadge />;
  }
  return null;
};

// --- Skeleton Component (Unchanged) ---
const SearchSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className="p-4 rounded-xl shadow-md animate-pulse">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

// --- New Trending Section Component ---
const TrendingSection = ({ onTrendClick }: { onTrendClick: (topic: string) => void }) => {
  // In a real app, you would fetch real data here
  const trends: Trend[] = mockTrends; 

  return (
    <div className="p-0 space-y-3">
      <h2 className="text-xl font-bold text-foreground flex items-center mb-4">
        <TrendingUp className="h-6 w-6 mr-2 text-primary" /> Trending Now
      </h2>
      <Card className="p-0 divide-y">
        {trends.map((trend) => (
          <div
            key={trend.id}
            className="flex flex-col p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onTrendClick(trend.topic)}
          >
            <div className="flex items-center text-sm font-medium text-muted-foreground">
              <Hash className="h-4 w-4 mr-1 text-primary" />
              <span className="text-primary hover:underline">{trend.topic}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {trend.post_count.toLocaleString()} posts
            </p>
          </div>
        ))}
      </Card>
      <div className="text-center text-sm text-muted-foreground pt-4">
        Tap a topic to search
      </div>
    </div>
  );
};

// --- Search Component ---
const Search = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const handleSearch = useCallback(async () => {
    const trimmedQuery = debouncedQuery.trim();
    if (!trimmedQuery) return;
    
    setLoading(true);

    // Prepare search term for Postgres Full-Text Search (FTS)
    // We use websearch_to_tsquery for a Google/Telegram-like experience (supports quotes, OR, negation)
    // Note: You must ensure your 'posts' table has a tsvector column indexed for FTS on 'content'.
    // If not set up, the `.textSearch` function will likely fail or be very slow.
    const searchConfig = 'english'; // or 'simple' for non-language specific
    const searchTsQuery = trimmedQuery.replace(/ /g, ' | '); // Basic "OR" logic for multiple words

    try {
      // 1. Search Users (by name or handle)
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, display_name, handle, bio, is_verified, is_organization_verified, is_private')
        .or(`display_name.ilike.%${trimmedQuery}%,handle.ilike.%${trimmedQuery}%`)
        .limit(5);

      // 2. Search Posts (by content using FTS)
      // Note: This requires the 'posts' table to have a full-text search index on the 'content' column.
      const { data: postData } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, author_id,
          profiles!author_id(display_name, handle, is_verified, is_organization_verified)
        `)
        // Using `.textSearch` is the Supabase client-side wrapper for FTS
        .textSearch('content', searchTsQuery, { type: 'plain', config: searchConfig })
        .limit(10);

      const combinedResults: SearchResult[] = [
        ...(userData || []).map((u: any) => ({
          type: 'user' as const,
          ...u,
        })),
        ...(postData || []).map((p: any) => ({
          type: 'post' as const,
          id: p.id,
          content: p.content,
          created_at: p.created_at,
          author_id: p.author_id,
          author_profiles: p.profiles,
        })),
      ];

      // Simple consolidation/filtering is needed here to sort by relevance or type
      // For simplicity, we just combine and set. Advanced ranking requires database functions.

      setResults(combinedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleViewPost = (postId: string) => {
    navigate(`/post/${postId}`); 
  };
  
  const handleTrendClick = (topic: string) => {
    setQuery(topic);
    // Debounce will handle the search automatically
  };

  const handleStartChat = async (targetUserId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // --- Chat Logic (Kept for completeness but condensed) ---
    try {
      // Logic to find or create 1-1 chat...
      // [Your existing chat logic here]

      // For the sake of a clean file and assuming a helper function exists:
      const chatId = await findOrCreateOneToOneChat(user.id, targetUserId);

      if (chatId) {
        navigate(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error('Chat creation error:', error);
    }
  };
  
  // NOTE: The function below should ideally be moved to a service file (e.g., chatService.ts)
  const findOrCreateOneToOneChat = async (currentUserId: string, targetUserId: string) => {
    // 1. Check for existing 1-1 chat
    const { data: memberData } = await supabase
      .from('chat_members')
      .select('chat_id, chats!inner(id, is_group)')
      .eq('user_id', currentUserId)
      .eq('chats.is_group', false);

    if (memberData) {
      for (const member of memberData) {
        const { data: otherMembers } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', member.chat_id)
          .neq('user_id', currentUserId);

        if (otherMembers && otherMembers.length === 1 && otherMembers[0].user_id === targetUserId) {
          return member.chat_id;
        }
      }
    }

    // 2. Create new 1-1 chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({ is_group: false, created_by: currentUserId })
      .select('id')
      .single();

    if (createError || !newChat) throw createError;

    // 3. Add both members
    const { error: memberError } = await supabase
      .from('chat_members')
      .insert([
        { chat_id: newChat.id, user_id: currentUserId },
        { chat_id: newChat.id, user_id: targetUserId },
      ]);

    if (memberError) throw memberError;
    return newChat.id;
  };
  // --- End Chat Logic ---


  // --- Render Logic ---
  const isSearchActive = !!query.trim();

  const userResults = results.filter(r => r.type === 'user');
  const postResults = results.filter(r => r.type === 'post');

  return (
    <div className="h-full flex flex-col">
      {/* Search Header and Input */}
      <div className="p-4 bg-card shadow-sm sticky top-0 z-10 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground mb-4">Explore</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search all users, posts, and topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-full bg-muted/70 focus:bg-background h-10 px-4"
          />
          <Button 
            onClick={handleSearch} 
            disabled={loading || !isSearchActive} 
            className="rounded-full h-10 w-10 p-0"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SearchIcon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <SearchSkeleton />
        ) : !isSearchActive ? (
          // Display Trends when search bar is empty
          <TrendingSection onTrendClick={handleTrendClick} />
        ) : results.length === 0 ? (
          // Display No Results when search is active but results are empty
          <div className="text-center text-muted-foreground py-8">
            No results found for **"{query}"**.
          </div>
        ) : (
          // Display Search Results
          <div className="space-y-6">
            {/* User Results Section */}
            {userResults.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground mb-3 border-b pb-1">People</h2>
                <div className="space-y-3">
                  {userResults.map((result) => (
                    <Card key={result.id} className="p-4 hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center space-x-3 cursor-pointer flex-1"
                          onClick={() => handleViewProfile(result.id)}
                        >
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md flex-shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {result.display_name}
                              </h3>
                              <VerifiedBadge isVerified={result.is_verified} isOrgVerified={result.is_organization_verified} />
                            </div>
                            <p className="text-sm text-muted-foreground truncate">@{result.handle}</p>
                            {result.bio && (
                              <p className="text-sm text-muted-foreground truncate mt-1">{result.bio}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartChat(result.id)}
                          disabled={result.is_private}
                          className="ml-4 flex-shrink-0"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Post Results Section */}
            {postResults.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground mb-3 border-b pb-1">Posts</h2>
                <div className="space-y-3">
                  {postResults.map((result) => (
                    <Card
                      key={result.id}
                      className="p-4 hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => handleViewPost(result.id)}
                    >
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="font-semibold text-foreground truncate">
                              {result.author_profiles?.display_name}
                            </h4>
                            <VerifiedBadge
                              isVerified={result.author_profiles?.is_verified}
                              isOrgVerified={result.author_profiles?.is_organization_verified}
                            />
                            <p className="text-xs text-muted-foreground truncate">
                              @{result.author_profiles?.handle}
                            </p>
                            <span className="text-xs text-muted-foreground mx-1">·</span>
                            <p className="text-xs text-muted-foreground flex-shrink-0">
                              {result.created_at ? new Date(result.created_at).toLocaleDateString('en-UG') : 'Unknown Date'}
                            </p>
                          </div>
                          <p className="text-foreground text-sm mt-1 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                            {result.content}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
