import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, User, CheckCircle2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  display_name: string;
  handle: string;
  bio?: string;
  is_verified?: boolean;
  is_private?: boolean;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, handle, bio, is_verified, is_private')
      .or(`display_name.ilike.%${query}%,handle.ilike.%${query}%`)
      .limit(20);
    
    if (data) {
      setResults(data as SearchResult[]);
    }
    setLoading(false);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleStartChat = async (userId: string) => {
    // Create or find existing 1-1 chat
    const { data: existingChats } = await supabase
      .from('chat_members')
      .select('chat_id, chats(is_group)')
      .eq('user_id', userId);

    // Find if there's already a 1-1 chat
    let chatId = null;
    if (existingChats) {
      for (const chat of existingChats) {
        const { data: members } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chat.chat_id);
        
        if (members && members.length === 2) {
          chatId = chat.chat_id;
          break;
        }
      }
    }

    if (!chatId) {
      // Create new 1-1 chat
      const { data: newChat } = await supabase
        .from('chats')
        .insert({ is_group: false, created_by: (await supabase.auth.getUser()).data.user?.id })
        .select()
        .single();
      
      if (newChat) {
        chatId = newChat.id;
        await supabase.from('chat_members').insert([
          { chat_id: chatId, user_id: (await supabase.auth.getUser()).data.user?.id },
          { chat_id: chatId, user_id: userId }
        ]);
      }
    }

    if (chatId) {
      navigate(`/chat/${chatId}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-card shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-foreground mb-4">Search</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <SearchIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Searching...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {query ? 'No users found' : 'Search for users by name or handle'}
          </div>
        ) : (
          results.map((user) => (
            <Card key={user.id} className="p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => handleViewProfile(user.id)}
              >
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {user.display_name}
                    </h3>
                    {user.is_verified && (
                      <svg
                        viewBox="0 0 22 22"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                      >
                        <path
                          d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                          fill="#1d9bf0"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{user.handle}</p>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground truncate mt-1">{user.bio}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Search;
