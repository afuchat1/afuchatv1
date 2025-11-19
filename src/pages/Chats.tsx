import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Users, User, Clock, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import NewChatDialog from '@/components/ui/NewChatDialog';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  updated_at: string;
  last_message_content?: string; 
}

const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)}h`;
  if (diffInMinutes < 48 * 60) return 'yesterday';
  
  return date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short' });
};

const Chats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceLoaded, setForceLoaded] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const effectiveLoading = loading && !forceLoaded;

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        const { data: chatMembers, error } = await supabase
          .from('chat_members')
          .select('chat_id, chats(id, name, is_group, updated_at)')
          .eq('user_id', user.id);

        if (error) throw error;

        if (chatMembers && chatMembers.length > 0) {
          // Filter out chats where the user is chatting with themselves
          const validChats: Chat[] = [];
          
          for (const member of chatMembers) {
            if (!member.chats) continue;
            
            // Get all members of this chat
            const { data: allMembers } = await supabase
              .from('chat_members')
              .select('user_id')
              .eq('chat_id', member.chats.id);
            
            // Skip if it's a 1-on-1 chat with yourself
            if (allMembers && allMembers.length === 2) {
              const memberIds = allMembers.map(m => m.user_id);
              if (memberIds[0] === memberIds[1]) continue;
            }
            
            validChats.push({
              ...member.chats,
              last_message_content: member.chats.id.startsWith('group') ? t('chat.lastGroupMessage') : t('chat.lastOneOnOneMessage')
            });
          }
          
          validChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          
          setChats(validChats);
          setFilteredChats(validChats);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchChats(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, t]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat => {
        const chatName = chat.name || (chat.is_group ? t('chat.groupChat') : t('chat.oneOnOne'));
        return chatName.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats, t]);
  
  const ChatItemSkeleton = () => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 animate-pulse">
      <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" /> 
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
  );

  if (effectiveLoading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(6)].map((_, i) => <ChatItemSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const ChatCard = ({ chat }: { chat: Chat }) => {
    const chatName = chat.name || (chat.is_group ? t('chat.groupChat') : t('chat.oneOnOne'));
    const Icon = chat.is_group ? Users : User;
    const timeDisplay = formatTime(chat.updated_at);
    const lastMessagePreview = chat.last_message_content || t('chat.startChatting');

    return (
      <Card
        key={chat.id}
        className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-card to-card/50 hover:-translate-y-0.5 cursor-pointer transition-all duration-300"
        onClick={() => navigate(`/chat/${chat.id}`)}
      >
        <div className="flex items-center gap-4">
          <div className={`relative h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
            chat.is_group 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
              : 'bg-gradient-to-br from-primary to-primary/80'
          }`}>
            <Icon className="h-6 w-6 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate text-foreground group-hover:text-primary transition-colors">
                {chatName}
              </h3>
              {chat.is_group && (
                <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                  {t('chat.group')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate leading-relaxed">
              {lastMessagePreview}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" />
              {timeDisplay}
            </span>
            {/* Unread badge placeholder */}
            {/* <Badge className="bg-primary text-primary-foreground rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-bold px-1.5">2</Badge> */}
          </div>
        </div>

        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 p-6">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('chat.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredChats.length} {filteredChats.length === 1 ? t('chat.conversation') : t('chat.conversations')}
              </p>
            </div>
            <Button 
              size="lg"
              className="rounded-full shadow-lg hover:shadow-xl h-12 w-12 p-0 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
              onClick={() => setIsNewChatDialogOpen(true)}
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('chat.searchChats')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 rounded-xl bg-background/50 backdrop-blur-sm focus:bg-background transition-colors"
            />
          </div>
        </div>
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-full p-8">
                <MessageSquarePlus className="h-16 w-16 text-primary/60" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {searchQuery ? t('chat.noChatsFound') : t('chat.noChats')}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {searchQuery ? t('chat.tryDifferentSearch') : t('chat.startChatting')}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsNewChatDialogOpen(true)}
                size="lg"
                className="rounded-full shadow-lg hover:shadow-xl"
              >
                <MessageSquarePlus className="h-5 w-5 mr-2" />
                {t('chat.startNewChat')}
              </Button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatCard key={chat.id} chat={chat} />
          ))
        )}
      </div>
      
      <NewChatDialog
        isOpen={isNewChatDialogOpen}
        onClose={() => setIsNewChatDialogOpen(false)}
      />
    </div>
  );
};

export default Chats;
