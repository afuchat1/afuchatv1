import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Search, Camera, CheckCheck, VolumeX, Pin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import NewChatDialog from '@/components/ui/NewChatDialog';
import { Button } from '@/components/ui/button';
import { ChatStoriesHeader } from '@/components/chat/ChatStoriesHeader';
import { StoryAvatar } from '@/components/moments/StoryAvatar';

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
    is_verified: boolean | null;
    is_organization_verified: boolean | null;
  };
  is_muted?: boolean;
  is_pinned?: boolean;
  is_read?: boolean;
}

const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const messageDate = new Date(date);
  messageDate.setHours(0, 0, 0, 0);
  
  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dayNames[date.getDay()];
};

const Chats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [showFab, setShowFab] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        // Fetch all chat data in parallel with optimized queries
        const { data: chatMembers, error } = await supabase
          .from('chat_members')
          .select(`
            chat_id,
            chats!inner(id, name, is_group, updated_at)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        if (!chatMembers || chatMembers.length === 0) {
          setChats([]);
          setLoading(false);
          return;
        }

        const chatIds = chatMembers.map(m => m.chats.id);

        // Batch fetch all members for all chats
        const { data: allChatMembers } = await supabase
          .from('chat_members')
          .select('chat_id, user_id')
          .in('chat_id', chatIds);

        // Batch fetch last messages for all chats
        const messagesPromises = chatIds.map(chatId =>
          supabase
            .from('messages')
            .select('encrypted_content, attachment_type, audio_url, sent_at, sender_id, read_at, chat_id')
            .eq('chat_id', chatId)
            .order('sent_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        );

        // Batch fetch unread counts for all chats
        const unreadPromises = chatIds.map(chatId =>
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatId)
            .neq('sender_id', user.id)
            .is('read_at', null)
        );

        const [messagesResults, unreadResults] = await Promise.all([
          Promise.all(messagesPromises),
          Promise.all(unreadPromises)
        ]);

        // Get unique other user IDs
        const otherUserIds = new Set<string>();
        chatMembers.forEach((member) => {
          if (!member.chats.is_group) {
            const members = allChatMembers?.filter(m => m.chat_id === member.chats.id);
            const otherUserId = members?.find(m => m.user_id !== user.id)?.user_id;
            if (otherUserId) otherUserIds.add(otherUserId);
          }
        });

        // Batch fetch all profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, handle, avatar_url, is_verified, is_organization_verified')
          .in('id', Array.from(otherUserIds));

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        // Build chat data
        const validChats: Chat[] = [];
        chatMembers.forEach((member, index) => {
          const chatId = member.chats.id;
          const members = allChatMembers?.filter(m => m.chat_id === chatId);

          // Skip self-chats
          if (members && members.length === 2) {
            const memberIds = members.map(m => m.user_id);
            if (memberIds[0] === memberIds[1]) return;
          }

          const lastMessageResult = messagesResults[index];
          const unreadResult = unreadResults[index];
          const lastMessage = lastMessageResult.data;

          let chatData: Chat = {
            ...member.chats,
            last_message_content: '',
            updated_at: lastMessage?.sent_at || member.chats.updated_at,
            is_read: lastMessage ? (lastMessage.sender_id === user.id || !!lastMessage.read_at) : true,
            unread_count: unreadResult.count || 0
          };

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

          if (!member.chats.is_group) {
            const otherUserId = members?.find(m => m.user_id !== user.id)?.user_id;
            if (otherUserId) {
              const profile = profileMap.get(otherUserId);
              if (profile) {
                chatData.other_user = profile;
              }
            }
          }

          validChats.push(chatData);
        });

        validChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setChats(validChats);
      } catch (err) {
        console.error('Error fetching chats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const currentScrollY = scrollRef.current.scrollTop;
      const scrollHeight = scrollRef.current.scrollHeight;
      const clientHeight = scrollRef.current.clientHeight;
      
      // Check if at bottom (within 100px threshold for easier triggering)
      const atBottom = scrollHeight - (currentScrollY + clientHeight) < 100;
      setIsAtBottom(atBottom);
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up');
      }
      
      setScrollPosition(currentScrollY);
      
      // FAB visibility
      if (currentScrollY < 10) {
        setShowFab(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowFab(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowFab(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener('scroll', handleScroll);
    
    // Check initial position
    if (scrollElement) {
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      const atBottom = scrollHeight - clientHeight < 100;
      setIsAtBottom(atBottom);
    }
    
    return () => scrollElement?.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex-1 p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Stories Header - Expandable */}
      <ChatStoriesHeader 
        scrollPosition={scrollPosition}
        isAtBottom={isAtBottom}
        scrollDirection={scrollDirection}
      />

      {/* Chat List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {chats.map((chat) => {
          const chatName = chat.is_group 
            ? (chat.name || 'Group Chat')
            : (chat.other_user?.display_name || 'User');
          
          return (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
            >
              {/* Avatar with Story Ring */}
              <div className="relative flex-shrink-0">
                {chat.other_user ? (
                  <StoryAvatar
                    userId={chat.other_user.id}
                    avatarUrl={chat.other_user.avatar_url}
                    name={chat.other_user.display_name}
                    size="lg"
                    showStoryRing={true}
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xl font-semibold text-muted-foreground">
                      {chatName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Chat info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {chatName}
                  </h3>
                  {chat.other_user?.is_verified && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <CheckCheck className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                  {chat.is_muted && (
                    <VolumeX className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {chat.is_read && (
                    <CheckCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.last_message_content || 'No messages yet'}
                  </p>
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {chat.is_pinned && (
                    <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(chat.updated_at)}
                  </span>
                </div>
                {chat.unread_count && chat.unread_count > 0 && (
                  <div className="bg-muted rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {chat.unread_count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <Button
        size="lg"
        onClick={() => setIsNewChatDialogOpen(true)}
        className={`fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 z-50 ${
          showFab ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <Camera className="h-6 w-6" />
      </Button>

      <NewChatDialog
        isOpen={isNewChatDialogOpen}
        onClose={() => setIsNewChatDialogOpen(false)}
      />
    </div>
  );
};

export default Chats;
