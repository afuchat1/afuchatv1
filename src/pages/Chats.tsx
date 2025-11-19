import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Users, User, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import NewChatDialog from '@/components/ui/NewChatDialog';
import { useTranslation } from 'react-i18next';

interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  updated_at: string;
  last_message_content?: string; 
}

// Function to format the time since the last update
const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)}h`;
  
  return date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short' });
};

const Chats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceLoaded, setForceLoaded] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 5000); // Force load after 5 seconds to prevent hanging

    return () => clearTimeout(timer);
  }, []);

  const effectiveLoading = loading && !forceLoaded;

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        // NOTE: In a production app, you would fetch the last message content here too.
        const { data: chatMembers, error } = await supabase
          .from('chat_members')
          .select('chat_id, chats(id, name, is_group, updated_at)')
          .eq('user_id', user.id);

        if (error) throw error;

        if (chatMembers && chatMembers.length > 0) {
          const chatsData: Chat[] = chatMembers
            .map((member: any) => ({
              ...member.chats,
              // Mocking a last message to make the UI rich
              last_message_content: member.chats.id.startsWith('group') ? 'Last group message...' : 'Last 1:1 message...' 
            }))
            .filter(Boolean);
          
          // Sort by updated_at (most recent first)
          chatsData.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          
          setChats(chatsData);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        // Re-fetch chats or update state on new message arrival
        () => {
          fetchChats(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  // --- Rich Design: Chat Item Skeleton (Borders Removed) ---
  const ChatItemSkeleton = () => (
    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-card shadow-md animate-pulse">
      <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full" /> 
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 sm:h-4 w-3/4" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <Skeleton className="h-3 sm:h-4 w-8 sm:w-10" />
    </div>
  );

  if (effectiveLoading) {
    return (
      <div className="h-full flex flex-col space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-5">
         {[...Array(5)].map((_, i) => <ChatItemSkeleton key={i} />)}
      </div>
    );
  }

  // --- Rich Design: Chat Card Component (Borders Removed) ---
  const ChatCard = ({ chat }: { chat: Chat }) => {
    const chatName = chat.name || (chat.is_group ? 'New Group' : 'Direct Message');
    const Icon = chat.is_group ? Users : User;
    const timeDisplay = formatTime(chat.updated_at);
    const lastMessagePreview = chat.last_message_content || 'Tap to start conversation...';

    return (
      <Card
        key={chat.id}
        className="p-3 sm:p-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-muted/30 cursor-pointer transition-all duration-200"
        onClick={() => navigate(`/chat/${chat.id}`)}
      >
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Visual Indicator (Text-only profile concept) */}
          <div className={`h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center text-primary-foreground shadow-sm ${chat.is_group ? 'bg-indigo-500' : 'bg-primary'}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate text-foreground">{chatName}</h3>
            {/* Last Message Preview */}
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{lastMessagePreview}</p>
          </div>

          <div className="flex flex-col items-end space-y-1">
            {/* Timestamp */}
            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeDisplay}
            </span>
            {/* Placeholder for unread count badge */}
            {/* <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">2</span> */}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Defined by shadow, not border */}
      <div className="p-3 sm:p-4 md:p-5 bg-card shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-foreground">Conversations</h1>
        <Button 
          size="icon" 
          variant="default" 
          className="rounded-full shadow-md h-9 w-9 sm:h-10 sm:w-10"
          onClick={() => setIsNewChatDialogOpen(true)}
        >
          <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground mb-2">No conversations found.</p>
            <p className="text-sm text-muted-foreground">
              Tap the plus button to start a new chat!
            </p>
          </div>
        ) : (
          // Use space-y-3 for separation instead of a divider
          chats.map((chat) => (
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
