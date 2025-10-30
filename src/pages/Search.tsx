import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, User, CheckCircle2, MessageSquare, Loader2, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

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

const SearchSkeleton = ({ tab }: { tab: 'users' | 'posts' }) => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-4 rounded-xl bg-card shadow-md animate-pulse">
        <div className="flex items-center space-x-3">
          <Skeleton className={`h-10 w-10 rounded-full ${tab === 'users' ? '' : 'bg-primary/20'}`} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            {tab === 'posts' && <Skeleton className="h-3 w-full" />}
          </div>
          {tab === 'users' && <Skeleton className="h-8 w-20 rounded-full" />}
        </div>
      </div>
    ))}
  </div>
);

// --- Twitter Verified Badge (Blue) ---
const TwitterVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className={`${size} ml-1`}
  >
    <path
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      fill="#1d9bf0"
    />
  </svg>
);

// --- Gold Verified Badge (for Organizations) ---
const GoldVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className={`${size} ml-1`}
  >
    <path
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      fill="#FFD43B"
    />
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

const Search = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
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
  }, [debouncedQuery, activeTab]);

  const handleSearch = async () => {
    if (!debouncedQuery.trim()) return;
    
    setLoading(true);
    try {
      let searchData = [];
      if (activeTab === 'users') {
        // Search users
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, display_name, handle, bio, is_verified, is_organization_verified, is_private')
          .or(`display_name.ilike.%${debouncedQuery}%,handle.ilike.%${debouncedQuery}%`)
          .limit(10);

        searchData = (userData || []).map((u: any) => ({
          type: 'user' as const,
          ...u,
        }));
      } else {
        // Search posts
        const { data: postData } = await supabase
          .from('posts')
          .select(`
            id, content, created_at, author_id,
            profiles!author_id(id, display_name, handle, is_verified, is_organization_verified)
          `)
          .textSearch('content', debouncedQuery, { type: 'plain', config: 'english' })
          .limit(10);

        searchData = (postData || []).map((p: any) => ({
          type: 'post' as const,
          id: p.id,
          content: p.content,
          created_at: p.created_at,
          author_id: p.author_id,
          author_profiles: p.profiles,
        }));
      }

      setResults(searchData);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleViewPost = (postId: string) => {
    navigate(`/post/${postId}`); // Assuming post detail route
  };

  const handleStartChat = async (targetUserId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // Find existing 1-1 chat between current user and target
      const { data: memberData } = await supabase
        .from('chat_members')
        .select(`
          chat_id,
          chats!inner(id, is_group)
        `)
        .eq('user_id', user.id)
        .eq('chats.is_group', false);

      let chatId = null;
      if (memberData) {
        for (const member of memberData) {
          const { data: otherMembers } = await supabase
            .from('chat_members')
            .select('user_id')
            .eq('chat_id', member.chat_id)
            .neq('user_id', user.id);

          if (otherMembers && otherMembers.length === 1 && otherMembers[0].user_id === targetUserId) {
            chatId = member.chat_id;
            break;
          }
        }
      }

      if (!chatId) {
        // Create new 1-1 chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({ is_group: false, created_by: user.id })
          .select()
          .single();

        if (createError) throw createError;

        if (newChat) {
          chatId = newChat.id;
          const { error: memberError } = await supabase
            .from('chat_members')
            .insert([
              { chat_id: chatId, user_id: user.id },
              { chat_id: chatId, user_id: targetUserId },
            ]);

          if (memberError) throw memberError;
        }
      }

      if (chatId) {
        navigate(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error('Chat creation error:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-card shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-foreground mb-4">Search</h1>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search users or posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-full"
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()} className="rounded-full shadow-lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'users' | 'posts')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-full shadow-inner">
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:font-bold transition-all duration-300"
            >
              <User className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="posts" 
              className="flex items-center gap-2 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:font-bold transition-all duration-300"
            >
              <FileText className="h-4 w-4" />
              Posts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <SearchSkeleton tab={activeTab} />
          ) : results.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${activeTab === 'users' ? 'bg-primary/10' : 'bg-muted/10'}`}>
                {activeTab === 'users' ? <User className="h-8 w-8 text-primary" /> : <FileText className="h-8 w-8 text-muted-foreground" />}
              </div>
              <p className="font-semibold text-foreground mb-1">{debouncedQuery ? 'No results found' : `Search for ${activeTab}`}</p>
              <p className="text-sm">{debouncedQuery ? 'Try a different query' : 'Start typing to discover'}</p>
            </div>
          ) : (
            results.map((result) => (
              <Card key={result.id} className="p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                {result.type === 'user' ? (
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => handleViewProfile(result.id)}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${result.is_organization_verified ? 'bg-yellow-500/20' : 'bg-primary/20'} border-2 border-primary/20`}>
                        <User className={`h-5 w-5 ${result.is_organization_verified ? 'text-yellow-600' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {result.display_name}
                          </h3>
                          <VerifiedBadge isVerified={result.is_verified} isOrgVerified={result.is_organization_verified} />
                        </div>
                        <p className="text-sm text-muted-foreground">@{result.handle}</p>
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
                      className="ml-4 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer transition-all duration-200 hover:bg-muted/20 p-2 rounded-lg"
                    onClick={() => handleViewPost(result.id)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <h4 className="font-semibold text-foreground truncate">
                            {result.author_profiles?.display_name}
                          </h4>
                          <VerifiedBadge 
                            isVerified={result.author_profiles?.is_verified} 
                            isOrgVerified={result.author_profiles?.is_organization_verified} 
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">@{result.author_profiles?.handle}</p>
                      </div>
                    </div>
                    <p className="text-foreground text-sm mb-2 leading-relaxed whitespace-pre-wrap">
                      {result.content}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(result.created_at).toLocaleDateString('en-UG')}
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </div>
    </div>
  );
};

export default Search;
