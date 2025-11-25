import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Search, Camera, CheckCheck, VolumeX, Pin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomLoader } from '@/components/ui/CustomLoader';
import NewChatDialog from '@/components/ui/NewChatDialog';
import { Button } from '@/components/ui/button';
import { ChatStoriesHeader } from '@/components/chat/ChatStoriesHeader';
import { StoryAvatar } from '@/components/moments/StoryAvatar';
import { CreateGroupDialog } from '@/components/chat/CreateGroupDialog';
import { toast } from 'sonner';

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
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [showFab, setShowFab] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [shouldCollapseStories, setShouldCollapseStories] = useState(true);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const chatName = chat.is_group 
      ? (chat.name || 'Group Chat')
      : (chat.other_user?.display_name || 'User');
    const lastMessage = chat.last_message_content || '';
    return (
      chatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  useEffect(() => {
    if (!user) return;

    const fetchChats = async (isInitial = true) => {
      if (isInitial) {
        // Try to load cached chats first for instant display
        const cachedChats = sessionStorage.getItem('cachedChats');
        if (cachedChats) {
          try {
            setChats(JSON.parse(cachedChats));
            setLoading(false); // Show cached content immediately
          } catch (e) {
            console.error('Failed to parse cached chats:', e);
          }
        }
      }
      
      try {
        const BATCH_SIZE = 30;
        const offset = isInitial ? 0 : chats.length;

        // Fetch chat members with limit and offset for pagination
        const { data: chatMembers, error } = await supabase
          .from('chat_members')
          .select(`
            chat_id,
            chats!inner(
              id, 
              name, 
              is_group, 
              updated_at,
              chat_members!inner(
                user_id,
                profiles(id, display_name, handle, avatar_url, is_verified, is_organization_verified)
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('chats.is_group', false)
          .order('updated_at', { foreignTable: 'chats', ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) throw error;

        if (!chatMembers || chatMembers.length === 0) {
          setHasMore(false);
          if (isInitial) {
            setChats([]);
          }
          return;
        }

        if (chatMembers.length < BATCH_SIZE) {
          setHasMore(false);
        }

        const chatIds = chatMembers.map(m => m.chats.id);

        // Optimized: Fetch all messages and unread counts in bulk with fewer queries
        const [allMessages, allUnreadCounts] = await Promise.all([
          supabase
            .from('messages')
            .select('chat_id, encrypted_content, attachment_type, audio_url, sent_at, sender_id, read_at')
            .in('chat_id', chatIds)
            .order('sent_at', { ascending: false }),
          supabase
            .from('messages')
            .select('chat_id, id')
            .in('chat_id', chatIds)
            .neq('sender_id', user.id)
            .is('read_at', null)
        ]);

        // Group messages by chat_id to get last message for each
        const messagesByChat = new Map<string, any>();
        allMessages.data?.forEach(msg => {
          if (!messagesByChat.has(msg.chat_id)) {
            messagesByChat.set(msg.chat_id, msg);
          }
        });

        // Count unread messages per chat
        const unreadByChat = new Map<string, number>();
        allUnreadCounts.data?.forEach(msg => {
          unreadByChat.set(msg.chat_id, (unreadByChat.get(msg.chat_id) || 0) + 1);
        });

        // Build chat data
        const validChats: Chat[] = [];
        chatMembers.forEach((member) => {
          const chatId = member.chats.id;
          const chatMemb = member.chats.chat_members || [];

          // Skip self-chats
          if (chatMemb.length === 2) {
            const memberIds = chatMemb.map((m: any) => m.user_id);
            if (memberIds[0] === memberIds[1]) return;
          }

          const lastMessage = messagesByChat.get(chatId);
          const unreadCount = unreadByChat.get(chatId) || 0;

          let chatData: Chat = {
            ...member.chats,
            last_message_content: '',
            updated_at: lastMessage?.sent_at || member.chats.updated_at,
            is_read: lastMessage ? (lastMessage.sender_id === user.id || !!lastMessage.read_at) : true,
            unread_count: unreadCount
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
            const otherMember = chatMemb.find((m: any) => m.user_id !== user.id);
            if (otherMember?.profiles) {
              chatData.other_user = {
                id: otherMember.profiles.id,
                display_name: otherMember.profiles.display_name,
                handle: otherMember.profiles.handle,
                avatar_url: otherMember.profiles.avatar_url,
                is_verified: otherMember.profiles.is_verified,
                is_organization_verified: otherMember.profiles.is_organization_verified
              };
            }
          }

          validChats.push(chatData);
        });

        validChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        
        if (isInitial) {
          setChats(validChats);
          sessionStorage.setItem('cachedChats', JSON.stringify(validChats));
        } else {
          setChats(prev => [...prev, ...validChats]);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchChats(true);

    // Real-time subscription for new messages AND when messages are marked as read
    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        fetchChats(true); // Refresh to show new message
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        // Only refresh if read_at was updated (message was read)
        if (payload.new.read_at && !payload.old.read_at) {
          fetchChats(true); // Refresh to update unread counts
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const scrollElement = scrollRef.current;
      const currentScrollY = scrollElement.scrollTop;
      const scrollingDown = currentScrollY > lastScrollY.current;
      
      // Collapse stories when user scrolls down past threshold
      if (scrollingDown && currentScrollY > 30 && !shouldCollapseStories) {
        setShouldCollapseStories(true);
      }

      // Hide bottom nav when scrolling down, show when scrolling up
      if (scrollingDown && currentScrollY > 100) {
        setHideBottomNav(true);
      } else if (!scrollingDown && currentScrollY < lastScrollY.current - 10) {
        setHideBottomNav(false);
      }

      // FAB visibility
      if (currentScrollY < 10) {
        setShowFab(true);
      } else if (scrollingDown && currentScrollY > 50) {
        setShowFab(false);
      } else if (!scrollingDown) {
        setShowFab(true);
      }

      // Load more chats when near bottom
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      const isNearBottom = scrollHeight - currentScrollY - clientHeight < 200;
      
      if (isNearBottom && hasMore && !loadingMore && !loading) {
        setLoadingMore(true);
        // Trigger loading more chats
        if (user) {
          const fetchMoreChats = async () => {
            try {
              const BATCH_SIZE = 30;
              const offset = chats.length;

              const { data: chatMembers, error } = await supabase
                .from('chat_members')
                .select(`
                  chat_id,
                  chats!inner(
                    id, 
                    name, 
                    is_group, 
                    updated_at,
                    chat_members!inner(
                      user_id,
                      profiles(id, display_name, handle, avatar_url, is_verified, is_organization_verified)
                    )
                  )
                `)
                .eq('user_id', user.id)
                .eq('chats.is_group', false)
                .order('updated_at', { foreignTable: 'chats', ascending: false })
                .range(offset, offset + BATCH_SIZE - 1);

              if (error) throw error;

              if (!chatMembers || chatMembers.length === 0) {
                setHasMore(false);
                setLoadingMore(false);
                return;
              }

              if (chatMembers.length < BATCH_SIZE) {
                setHasMore(false);
              }

              const chatIds = chatMembers.map(m => m.chats.id);

              const [allMessages, allUnreadCounts] = await Promise.all([
                supabase
                  .from('messages')
                  .select('chat_id, encrypted_content, attachment_type, audio_url, sent_at, sender_id, read_at')
                  .in('chat_id', chatIds)
                  .order('sent_at', { ascending: false }),
                supabase
                  .from('messages')
                  .select('chat_id, id')
                  .in('chat_id', chatIds)
                  .neq('sender_id', user.id)
                  .is('read_at', null)
              ]);

              const messagesByChat = new Map<string, any>();
              allMessages.data?.forEach(msg => {
                if (!messagesByChat.has(msg.chat_id)) {
                  messagesByChat.set(msg.chat_id, msg);
                }
              });

              const unreadByChat = new Map<string, number>();
              allUnreadCounts.data?.forEach(msg => {
                unreadByChat.set(msg.chat_id, (unreadByChat.get(msg.chat_id) || 0) + 1);
              });

              const validChats: Chat[] = [];
              chatMembers.forEach((member) => {
                const chatId = member.chats.id;
                const chatMemb = member.chats.chat_members || [];

                if (chatMemb.length === 2) {
                  const memberIds = chatMemb.map((m: any) => m.user_id);
                  if (memberIds[0] === memberIds[1]) return;
                }

                const lastMessage = messagesByChat.get(chatId);
                const unreadCount = unreadByChat.get(chatId) || 0;

                let chatData: Chat = {
                  ...member.chats,
                  last_message_content: '',
                  updated_at: lastMessage?.sent_at || member.chats.updated_at,
                  is_read: lastMessage ? (lastMessage.sender_id === user.id || !!lastMessage.read_at) : true,
                  unread_count: unreadCount
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
                  const otherMember = chatMemb.find((m: any) => m.user_id !== user.id);
                  if (otherMember?.profiles) {
                    chatData.other_user = {
                      id: otherMember.profiles.id,
                      display_name: otherMember.profiles.display_name,
                      handle: otherMember.profiles.handle,
                      avatar_url: otherMember.profiles.avatar_url,
                      is_verified: otherMember.profiles.is_verified,
                      is_organization_verified: otherMember.profiles.is_organization_verified
                    };
                  }
                }

                validChats.push(chatData);
              });

              validChats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
              setChats(prev => [...prev, ...validChats]);
            } catch (err) {
              console.error('Error loading more chats:', err);
            } finally {
              setLoadingMore(false);
            }
          };
          fetchMoreChats();
        }
      }
      
      lastScrollY.current = currentScrollY;
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Dispatch custom event to hide/show bottom nav in Layout
    const handleNavVisibility = () => {
      window.dispatchEvent(new CustomEvent('chat-scroll-state', { detail: { hide: hideBottomNav } }));
    };
    
    handleNavVisibility();
    
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [shouldCollapseStories, hideBottomNav, hasMore, loadingMore, loading, chats.length, user]);

  if (loading && chats.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <CustomLoader size="lg" text="Loading chats..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Stories Header - Sticky with collapse/expand */}
      <ChatStoriesHeader 
        shouldCollapse={shouldCollapseStories} 
        onToggleCollapse={setShouldCollapseStories}
        onSearch={setSearchQuery}
      />

      {/* Chat List Container - Main scrollable area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin pb-20"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {searchQuery && (
          <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/30 border-b border-border">
            {filteredChats.length} {filteredChats.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </div>
        )}
        {filteredChats.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No chats found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try searching with different keywords</p>
          </div>
        ) : (
          <>
          {filteredChats.map((chat) => {
          const chatName = chat.is_group 
            ? (chat.name || 'Group Chat')
            : (chat.other_user?.display_name || 'User');
          
          return (
            <div
               key={chat.id}
               onClick={() => navigate(`/chat/${chat.id}`)}
               className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 active:bg-muted/20 cursor-pointer transition-colors"
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
                  {chat.other_user?.is_organization_verified ? (
                    <svg
                      viewBox="0 0 22 22"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 ml-1 flex-shrink-0"
                      style={{ fill: '#FFD700' }}
                      aria-label="Verified Organization"
                    >
                      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                    </svg>
                  ) : chat.other_user?.is_verified ? (
                    <svg
                      viewBox="0 0 22 22"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 ml-1 flex-shrink-0"
                      style={{ fill: '#17B8E8' }}
                      aria-label="Verified Account"
                    >
                      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                    </svg>
                  ) : null}
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
                  <div className="bg-foreground text-background rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                    <span className="text-xs font-semibold">
                      {chat.unread_count > 99 ? '99+' : chat.unread_count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loadingMore && (
          <div className="py-8 flex justify-center">
            <CustomLoader size="sm" text="Loading more..." />
          </div>
        )}
        </>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-6 flex flex-col gap-3 z-50">
        {/* Create Group Button */}
        <Button
          size="lg"
          onClick={() => setIsCreateGroupDialogOpen(true)}
          className={`h-14 w-14 rounded-full shadow-lg bg-secondary hover:bg-secondary/90 active:scale-95 transition-all duration-300 ${
            showFab ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90 pointer-events-none'
          }`}
        >
          <Users className="h-6 w-6" />
        </Button>
        
        {/* New Chat Button */}
        <Button
          size="lg"
          onClick={() => setIsNewChatDialogOpen(true)}
          className={`h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 active:scale-95 transition-all duration-300 ${
            showFab ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90 pointer-events-none'
          }`}
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>

      <NewChatDialog
        isOpen={isNewChatDialogOpen}
        onClose={() => setIsNewChatDialogOpen(false)}
      />

      <CreateGroupDialog
        isOpen={isCreateGroupDialogOpen}
        onClose={() => setIsCreateGroupDialogOpen(false)}
        onGroupCreated={(groupId) => {
          navigate(`/chat/${groupId}`);
          toast.success('Group created! Add members to get started.');
        }}
      />
    </div>
  );
};

export default Chats;
