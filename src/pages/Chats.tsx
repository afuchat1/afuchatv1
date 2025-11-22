import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Users, User, Clock, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import NewChatDialog from '@/components/ui/NewChatDialog';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { ChatStoriesHeader } from '@/components/chat/ChatStoriesHeader';

interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  updated_at: string;
  last_message_content?: string;
  unread_count?: number;
  other_user?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
    last_seen: string | null;
    show_online_status: boolean | null;
    is_verified: boolean | null;
    is_organization_verified: boolean | null;
    is_affiliate: boolean | null;
    affiliated_business_id: string | null;
  };
  is_online?: boolean;
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
          .select(`
            chat_id,
            chats!inner(id, name, is_group, updated_at)
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching chat members:', error);
          throw error;
        }

        console.log('Chat members fetched:', chatMembers);

        if (chatMembers && chatMembers.length > 0) {
          const validChats: Chat[] = [];
          
          for (const member of chatMembers) {
            if (!member.chats) continue;
            
            const chatId = member.chats.id;
            
            // Get all members of this chat
            const { data: allMembers, error: membersError } = await supabase
              .from('chat_members')
              .select('user_id')
              .eq('chat_id', chatId);
            
            if (membersError) {
              console.error('Error fetching members for chat:', chatId, membersError);
              continue;
            }
            
            // Skip if it's a 1-on-1 chat with yourself
            if (allMembers && allMembers.length === 2) {
              const memberIds = allMembers.map(m => m.user_id);
              if (memberIds[0] === memberIds[1]) {
                console.log('Skipping self-chat:', chatId);
                continue;
              }
            }
            
            // Fetch the last message for this chat first
            const { data: lastMessage, error: messageError } = await supabase
              .from('messages')
              .select('encrypted_content, attachment_type, audio_url, sent_at')
              .eq('chat_id', chatId)
              .order('sent_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            let chatData: Chat = {
              ...member.chats,
              last_message_content: '',
              // Use last message timestamp for sorting, fallback to chat updated_at
              updated_at: lastMessage?.sent_at || member.chats.updated_at
            };
            
            if (messageError) {
              console.error('Error fetching last message for chat:', chatId, messageError);
            }
            
            if (lastMessage) {
              if (lastMessage.audio_url) {
                chatData.last_message_content = '🎤 Voice message';
              } else if (lastMessage.attachment_type?.startsWith('image/')) {
                chatData.last_message_content = '📷 Photo';
              } else if (lastMessage.attachment_type) {
                chatData.last_message_content = '📎 Attachment';
              } else {
                chatData.last_message_content = lastMessage.encrypted_content || 'Message';
              }
            }
            
            // For 1-on-1 chats, fetch the other user's profile
            if (!member.chats.is_group && allMembers) {
              const otherUserId = allMembers.find(m => m.user_id !== user.id)?.user_id;
              if (otherUserId) {
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('id, display_name, handle, avatar_url, last_seen, show_online_status, is_verified, is_organization_verified, is_affiliate, affiliated_business_id')
                  .eq('id', otherUserId)
                  .maybeSingle();
                
                if (profileError) {
                  console.error('Error fetching profile for user:', otherUserId, profileError);
                }
                
                if (profile) {
                  chatData.other_user = profile;
                  // Check if user is online (last seen within 5 minutes)
                  if (profile.last_seen && profile.show_online_status) {
                    const lastSeenTime = new Date(profile.last_seen).getTime();
                    const now = new Date().getTime();
                    chatData.is_online = now - lastSeenTime < 5 * 60 * 1000;
                  }
                }
              }
            }
            
            // Count unread messages - simplified query
            const { count: unreadCount, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chatId)
              .neq('sender_id', user.id)
              .is('read_at', null);
            
            if (countError) {
              console.error('Error counting unread messages for chat:', chatId, countError);
            }
            
            chatData.unread_count = unreadCount || 0;
            
            validChats.push(chatData);
            console.log('Added chat to validChats:', chatData);
          }
          
          validChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          
          console.log('Final valid chats:', validChats);
          setChats(validChats);
          setFilteredChats(validChats);
        } else {
          console.log('No chat members found');
          setChats([]);
          setFilteredChats([]);
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
        <div className="flex-1 p-4 space-y-3">
          {[...Array(6)].map((_, i) => <ChatItemSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const ChatCard = ({ chat }: { chat: Chat }) => {
    const chatName = chat.is_group 
      ? (chat.name || t('chat.groupChat'))
      : (chat.other_user?.display_name || chat.other_user?.handle || 'User');
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
          <div 
            className="relative flex-shrink-0 cursor-pointer transition-transform duration-300 group-hover:scale-110"
            onClick={(e) => {
              if (!chat.is_group && chat.other_user) {
                e.stopPropagation();
                navigate(`/profile/${chat.other_user.handle}`);
              }
            }}
          >
            {chat.is_group ? (
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Icon className="h-6 w-6 text-white" />
              </div>
            ) : chat.other_user ? (
              <>
                {chat.other_user.avatar_url ? (
                  <img
                    src={chat.other_user.avatar_url}
                    alt={chat.other_user.display_name}
                    className="h-14 w-14 rounded-full object-cover shadow-lg"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-semibold text-white">
                      {chat.other_user.display_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                {chat.is_online && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-card" />
                )}
              </>
            ) : (
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="font-semibold text-base truncate text-foreground group-hover:text-primary transition-colors">
                {chatName}
              </h3>
              {!chat.is_group && chat.other_user && (
                <VerifiedBadge
                  isVerified={chat.other_user.is_verified || false}
                  isOrgVerified={chat.other_user.is_organization_verified || false}
                  isAffiliate={chat.other_user.is_affiliate || false}
                  size="sm"
                />
              )}
              {chat.is_group && (
                <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                  {t('chat.group')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate leading-relaxed">
              {chat.last_message_content || t('chat.startChatting')}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" />
              {timeDisplay}
            </span>
            {chat.unread_count && chat.unread_count > 0 && (
              <Badge className="bg-primary text-primary-foreground rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-bold px-1.5">
                {chat.unread_count > 99 ? '99+' : chat.unread_count}
              </Badge>
            )}
          </div>
        </div>

        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/20 relative">
      <div className="pt-6 pb-4">
        {/* Stories Header */}
        <ChatStoriesHeader />
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-full p-8">
                <Pencil className="h-16 w-16 text-primary/60" />
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
                <Pencil className="h-5 w-5 mr-2" />
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

      {/* New Chat FAB */}
      <Button
        size="lg"
        onClick={() => setIsNewChatDialogOpen(true)}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 z-50"
      >
        <Pencil className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Chats;
