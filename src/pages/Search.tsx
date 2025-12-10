import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, User, MessageSquare, Users, Clock, X, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { searchSchema } from '@/lib/validation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ProfileDrawer } from '@/components/ProfileDrawer';

const SEARCH_HISTORY_KEY = 'afuchat_search_history';
const MAX_SEARCH_HISTORY = 10;

const getSearchHistory = (): string[] => {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addToSearchHistory = (query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return;
  
  const history = getSearchHistory();
  const filtered = history.filter(h => h.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...filtered].slice(0, MAX_SEARCH_HISTORY);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
};

const removeFromSearchHistory = (query: string) => {
  const history = getSearchHistory();
  const updated = history.filter(h => h !== query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
};

const clearSearchHistory = () => {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
};

interface PostImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface SearchResult {
  type: 'user' | 'post' | 'group';
  id: string;
  display_name?: string;
  handle?: string;
  bio?: string;
  is_verified?: boolean;
  is_organization_verified?: boolean;
  is_private?: boolean;
  avatar_url?: string;
  content?: string;
  created_at?: string;
  author_id?: string;
  image_url?: string;
  post_images?: PostImage[];
  author_profiles?: {
    display_name: string;
    handle: string;
    is_verified?: boolean;
    is_organization_verified?: boolean;
    avatar_url?: string;
  };
  name?: string;
  description?: string;
  member_count?: number;
  is_member?: boolean;
}

interface Trend {
  topic: string;
  post_count: number;
}

const TwitterVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-0.5 fill-[#1d9bf0] flex-shrink-0`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);

const GoldVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-0.5 fill-[#FFD43B] flex-shrink-0`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);

const VerifiedBadge = ({ isVerified, isOrgVerified }: { isVerified?: boolean; isOrgVerified?: boolean }) => {
  if (isOrgVerified) return <GoldVerifiedBadge />;
  if (isVerified) return <TwitterVerifiedBadge />;
  return null;
};

const TABS = ['For You', 'Trending', 'News', 'Sports', 'Entertainment'];

const formatPostCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M posts`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K posts`;
  return `${count} posts`;
};

const TrendingItem = ({ 
  trend, 
  index, 
  category,
  onClick 
}: { 
  trend: Trend; 
  index: number;
  category?: string;
  onClick: () => void;
}) => (
  <div 
    className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-start"
    onClick={onClick}
  >
    <div className="flex-1 min-w-0">
      <p className="text-[13px] text-muted-foreground">
        {category || `${index + 1} · Trending`}
      </p>
      <p className="font-bold text-[15px] text-foreground mt-0.5">
        {trend.topic.startsWith('#') ? trend.topic : trend.topic}
      </p>
      <p className="text-[13px] text-muted-foreground mt-0.5">
        {formatPostCount(trend.post_count)}
      </p>
    </div>
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground -mr-2">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </div>
);

const TrendingSection = ({ onTrendClick }: { onTrendClick: (topic: string) => void }) => {
  const { t } = useTranslation();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_trending_topics', {
          hours_ago: 24,
          num_topics: 10,
        });

        if (error) {
          console.error('Error fetching trends:', error);
          setTrends([]);
        } else if (Array.isArray(data)) {
          const formattedData = data.map((d: Trend) => ({
            ...d,
            topic: d.topic.charAt(0).toUpperCase() + d.topic.slice(1),
          }));
          setTrends(formattedData);
        } else {
          setTrends([]);
        }
      } catch (error) {
        console.error('RPC call failed:', error);
        setTrends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CustomLoader size="sm" />
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 text-sm">
        {t('search.noTrends')}
      </div>
    );
  }

  const categories = ['Trending', 'Politics · Trending', 'Entertainment · Trending', 'Sports · Trending', 'Technology · Trending'];

  return (
    <div className="divide-y divide-border">
      {trends.map((trend, index) => (
        <TrendingItem
          key={index}
          trend={trend}
          index={index}
          category={categories[index % categories.length]}
          onClick={() => onTrendClick(trend.topic)}
        />
      ))}
    </div>
  );
};

const SearchHistorySection = ({ 
  onHistoryClick, 
  onRemove, 
  onClearAll 
}: { 
  onHistoryClick: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
}) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const handleRemove = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromSearchHistory(query);
    setHistory(getSearchHistory());
    onRemove(query);
  };

  const handleClearAll = () => {
    clearSearchHistory();
    setHistory([]);
    onClearAll();
  };

  if (history.length === 0) return null;

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-[15px] font-bold text-foreground">
          {t('search.recentSearches', 'Recent')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-xs text-primary hover:text-primary/80 h-auto p-0"
        >
          {t('search.clearAll', 'Clear all')}
        </Button>
      </div>
      <div className="divide-y divide-border">
        {history.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onHistoryClick(item)}
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-[15px] text-foreground">{item}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => handleRemove(item, e)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Search = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [historyKey, setHistoryKey] = useState(0);
  const [activeTab, setActiveTab] = useState('For You');
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string | null; display_name?: string } | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', user.id)
        .single();
      if (data) setUserProfile(data);
    };
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('q') || '';
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [location.search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = useCallback(async () => {
    const trimmedQuery = debouncedQuery.trim();
    if (!trimmedQuery) return;
    
    try {
      searchSchema.parse(trimmedQuery);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || 'Invalid search query');
      setLoading(false);
      return;
    }

    setLoading(true);
    addToSearchHistory(trimmedQuery);
    setHistoryKey(prev => prev + 1);
    navigate(`?q=${encodeURIComponent(trimmedQuery)}`, { replace: true });

    const searchConfig = 'english'; 
    const searchTsQuery = trimmedQuery.replace(/ /g, ' | '); 

    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id, display_name, handle, bio, is_verified, is_organization_verified, is_private, avatar_url')
        .or(`display_name.ilike.%${trimmedQuery}%,handle.ilike.%${trimmedQuery}%`)
        .limit(5);

      const { data: postData } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, author_id, image_url,
          profiles!author_id(display_name, handle, is_verified, is_organization_verified, avatar_url),
          post_images(id, image_url, display_order)
        `)
        .textSearch('content', searchTsQuery, { type: 'plain', config: searchConfig })
        .limit(10);

      const { data: groupData } = await supabase
        .from('chats')
        .select('id, name, description, avatar_url')
        .eq('is_group', true)
        .or(`name.ilike.%${trimmedQuery}%,description.ilike.%${trimmedQuery}%`)
        .limit(8);

      let groupsWithMembership = groupData || [];
      if (groupData && groupData.length > 0) {
        const groupIds = groupData.map((g: any) => g.id);
        
        const { data: memberCounts } = await supabase
          .from('chat_members')
          .select('chat_id')
          .in('chat_id', groupIds);
        
        const countMap = new Map<string, number>();
        memberCounts?.forEach(m => {
          countMap.set(m.chat_id, (countMap.get(m.chat_id) || 0) + 1);
        });

        let memberGroupIds = new Set<string>();
        if (user) {
          const { data: userMemberships } = await supabase
            .from('chat_members')
            .select('chat_id')
            .eq('user_id', user.id)
            .in('chat_id', groupIds);
          memberGroupIds = new Set(userMemberships?.map(m => m.chat_id) || []);
        }

        groupsWithMembership = groupData.map((g: any) => ({
          ...g,
          is_member: memberGroupIds.has(g.id),
          member_count: countMap.get(g.id) || 0,
        }));
      }

      const combinedResults: SearchResult[] = [
        ...(userData || []).map((u: any) => ({
          type: 'user' as const,
          ...u,
        })),
        ...(groupsWithMembership || []).map((g: any) => ({
          type: 'group' as const,
          id: g.id,
          name: g.name,
          description: g.description,
          avatar_url: g.avatar_url,
          member_count: g.member_count,
          is_member: g.is_member,
        })),
        ...(postData || []).map((p: any) => ({
          type: 'post' as const,
          id: p.id,
          content: p.content,
          created_at: p.created_at,
          author_id: p.author_id,
          image_url: p.image_url,
          post_images: p.post_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [],
          author_profiles: p.profiles,
        })),
      ];

      setResults(combinedResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, navigate, user]);
  
  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch();
    } else if (location.search.includes('q=')) {
        navigate('', { replace: true }); 
        setResults([]);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, handleSearch, navigate, location.search]);

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleViewPost = (postId: string) => {
    navigate(`/post/${postId}`); 
  };
  
  const handleTrendClick = (topic: string) => {
    setQuery(topic); 
  };

  const handleStartChat = async (targetUserId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data: chatId, error } = await supabase
        .rpc('get_or_create_chat', {
          other_user_id: targetUserId
        })
        .single();

      if (error) throw error;

      if (chatId) {
        navigate(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error('Chat creation error:', error);
      toast.error('Failed to create chat');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_members')
        .insert({
          chat_id: groupId,
          user_id: user.id,
          is_admin: false,
        });

      if (error) throw error;

      toast.success(t('search.joinedGroup'));
      navigate(`/chat/${groupId}`);
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error(t('search.joinGroupError'));
    }
  };

  const isSearchActive = !!query.trim();
  const userResults = results.filter(r => r.type === 'user');
  const groupResults = results.filter(r => r.type === 'group');
  const postResults = results.filter(r => r.type === 'post');
  const hasAnyResults = results.length > 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-2">
          <ProfileDrawer
            trigger={
              <button className="flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userProfile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full bg-muted/70 border-0 focus-visible:ring-1 focus-visible:ring-primary h-10 pl-10 pr-4 text-[15px]"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {!isSearchActive && (
          <ScrollArea className="w-full">
            <div className="flex border-b border-border">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-3 text-[15px] font-medium transition-colors relative ${
                    activeTab === tab 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && isSearchActive ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <CustomLoader size="md" text="Searching..." />
          </div>
        ) : !isSearchActive ? (
          <>
            <SearchHistorySection 
              key={historyKey}
              onHistoryClick={(term) => setQuery(term)}
              onRemove={() => {}}
              onClearAll={() => toast.success(t('search.historyCleared', 'Search history cleared'))}
            />
            <TrendingSection onTrendClick={handleTrendClick} />
          </>
        ) : !hasAnyResults ? (
          <div className="text-center text-muted-foreground py-12 text-[15px]">
            {t('search.noResults', { query })}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* People Results */}
            {userResults.length > 0 && (
              <div>
                <h2 className="px-4 py-3 text-[20px] font-extrabold text-foreground">
                  {t('search.people')}
                </h2>
                <div className="divide-y divide-border">
                  {userResults.map((result) => (
                    <div 
                      key={result.id} 
                      className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewProfile(result.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={result.avatar_url || ''} alt={result.display_name} />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {result.display_name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-0.5">
                            <span className="font-bold text-[15px] text-foreground truncate">
                              {result.display_name}
                            </span>
                            <VerifiedBadge isVerified={result.is_verified} isOrgVerified={result.is_organization_verified} />
                          </div>
                          <p className="text-[15px] text-muted-foreground truncate">@{result.handle}</p>
                          {result.bio && (
                            <p className="text-[15px] text-foreground line-clamp-2 mt-1">{result.bio}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups Results */}
            {groupResults.length > 0 && (
              <div>
                <h2 className="px-4 py-3 text-[20px] font-extrabold text-foreground">
                  {t('search.groups')}
                </h2>
                <div className="divide-y divide-border">
                  {groupResults.map((result) => (
                    <div 
                      key={result.id} 
                      className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => result.is_member && navigate(`/chat/${result.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={result.avatar_url || ''} alt={result.name} />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <Users className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[15px] text-foreground truncate">
                              {result.name || 'Unnamed Group'}
                            </span>
                            {result.is_member ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/chat/${result.id}`);
                                }}
                                className="h-8 rounded-full text-sm font-bold"
                              >
                                Open
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinGroup(result.id);
                                }}
                                className="h-8 rounded-full text-sm font-bold"
                              >
                                Join
                              </Button>
                            )}
                          </div>
                          <p className="text-[13px] text-muted-foreground">
                            {result.member_count} {result.member_count === 1 ? 'member' : 'members'}
                          </p>
                          {result.description && (
                            <p className="text-[15px] text-foreground line-clamp-2 mt-1">{result.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Results */}
            {postResults.length > 0 && (
              <div>
                <h2 className="px-4 py-3 text-[20px] font-extrabold text-foreground">
                  {t('search.posts')}
                </h2>
                <div className="divide-y divide-border">
                  {postResults.map((result) => (
                    <div
                      key={result.id}
                      className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewPost(result.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={result.author_profiles?.avatar_url || ''} alt={result.author_profiles?.display_name} />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {result.author_profiles?.display_name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-[15px] text-foreground">
                              {result.author_profiles?.display_name}
                            </span>
                            <VerifiedBadge
                              isVerified={result.author_profiles?.is_verified}
                              isOrgVerified={result.author_profiles?.is_organization_verified}
                            />
                            <span className="text-[15px] text-muted-foreground">
                              @{result.author_profiles?.handle}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-[15px] text-muted-foreground">
                              {result.created_at ? new Date(result.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                          <p className="text-[15px] text-foreground mt-1 leading-normal line-clamp-3 whitespace-pre-wrap">
                            {result.content}
                          </p>
                          {(result.post_images && result.post_images.length > 0) ? (
                            <div className={`mt-3 grid gap-0.5 rounded-2xl overflow-hidden border border-border ${result.post_images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {result.post_images.slice(0, 4).map((img, idx) => (
                                <div key={img.id} className="relative aspect-video">
                                  <img 
                                    src={img.image_url} 
                                    alt={`Post image ${idx + 1}`} 
                                    className="w-full h-full object-cover"
                                  />
                                  {result.post_images && result.post_images.length > 4 && idx === 3 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <span className="text-white font-bold text-lg">+{result.post_images.length - 4}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : result.image_url ? (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                              <img 
                                src={result.image_url} 
                                alt="Post image" 
                                className="w-full h-auto max-h-72 object-cover"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
