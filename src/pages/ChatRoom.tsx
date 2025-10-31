import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, User, Loader2, Phone, Video, MoreVertical, Check, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  encrypted_content: string;
  sender_id: string;
  sent_at: string;
  profiles: {
    display_name: string;
    handle: string;
  };
}

interface ChatInfo {
  name: string | null;
  is_group: boolean;
}

const ChatRoom = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false); // Placeholder for online status
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    fetchChatInfo();
    fetchMessages();

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          supabase
            .from('profiles')
            .select('display_name, handle')
            .eq('id', payload.new.sender_id)
            .single()
            .then(({ data: profile, error }) => {
              if (error) {
                console.error('Error fetching sender profile:', error);
                return;
              }
              if (profile) {
                setMessages((prev) => [
                  ...prev,
                  {
                    ...payload.new,
                    profiles: profile,
                  },
                ]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatInfo = async () => {
    const { data } = await supabase
      .from('chats')
      .select('name, is_group')
      .eq('id', chatId)
      .single();
    
    if (data) {
      setChatInfo(data);
      // Fetch other user's online status (if schema updated)
      if (!data.is_group) {
        // Placeholder: Set online randomly for demo; replace with real fetch
        setOnline(Math.random() > 0.5);
      }
    }
  };

  const fetchMessages = async () => {
    console.log('Fetching messages for chatId:', chatId); // Debug log
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(display_name, handle)')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    console.log('Fetched messages:', data, 'Error:', error); // Debug log

    if (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load messages');
    }
    if (data) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !chatId) return;

    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        encrypted_content: newMessage,
      });

    if (error) {
      console.error('Send error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      toast.error(`Failed to send: ${error.message}`);
    } else {
      setNewMessage('');
      // Optimistic append for instant feedback (before Realtime)
      const optimisticMsg: Message = {
        id: Date.now().toString(), // Temp ID
        encrypted_content: newMessage,
        sender_id: user.id,
        sent_at: new Date().toISOString(),
        profiles: { display_name: user.display_name || 'You', handle: user.handle || '@you' }, // Assume from auth
      };
      setMessages((prev) => [...prev, optimisticMsg]);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header: Sticky top, platform colors */}
      <div className="bg-card border-b border-border sticky top-0 z-10 flex items-center px-4 py-3 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 p-0 hover:bg-muted"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {chatInfo?.name || (chatInfo?.is_group ? 'Group Chat' : 'Direct Message')}
          </h1>
          {chatInfo && !chatInfo.is_group && (
            <p className={`text-xs ${online ? 'text-green-600' : 'text-muted-foreground'}`}>
              {online ? 'online' : 'last seen recently'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-muted">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-muted">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages: Full height minus header/input, platform colors */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: '80px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
            <MessageSquare className="h-12 w-12 opacity-50" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
            <p className="text-xs text-muted-foreground">Messages are encrypted end-to-end</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            const time = new Date(message.sent_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwn ? (
                  <div className="flex items-end gap-2 max-w-[75%]">
                    {/* Avatar */}
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                    {/* Bubble */}
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {message.profiles.display_name}
                        </span>
                        <span className="text-xs text-muted-foreground">• {time}</span>
                      </div>
                      <div className="bg-card text-foreground px-4 py-3 rounded-lg shadow-sm border border-border max-w-full">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.encrypted_content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end max-w-[75%]">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-sm">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.encrypted_content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-primary-foreground/70"> {time}</span>
                      <Check className="h-3 w-3 text-primary-foreground/70" />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input: Fixed bottom, platform colors, doesn't move */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="h-12 pr-12"
              disabled={sending}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 bottom-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-12 w-12"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
