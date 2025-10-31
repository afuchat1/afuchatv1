import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, User, Loader2, Phone, Video, MoreVertical, Check, CheckCheck, MessageSquare } from 'lucide-react';
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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Telegram-like Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10 flex items-center px-4 py-3 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full h-10 w-10 p-0"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {chatInfo?.name || (chatInfo?.is_group ? 'Group Chat' : 'Direct Message')}
          </h1>
          {chatInfo && !chatInfo.is_group && (
            <p className={`text-xs ${online ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {online ? 'online' : 'last seen recently'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages - Telegram Bubble Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 space-y-2">
            <MessageSquare className="h-12 w-12 opacity-50" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
            <p className="text-xs text-gray-400">Messages are encrypted end-to-end</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            const time = new Date(message.sent_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}
              >
                {!isOwn ? (
                  <div className="flex items-end gap-2 max-w-[75%]">
                    {/* Avatar */}
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {message.profiles.display_name.charAt(0).toUpperCase()}
                    </div>
                    {/* Bubble */}
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {message.profiles.display_name}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">• {time}</span>
                      </div>
                      <div
                        className="max-w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-3xl rounded-br-md shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.encrypted_content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end max-w-[75%]">
                    <div
                      className="bg-blue-500 text-white px-4 py-3 rounded-3xl rounded-bl-md shadow-lg"
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.encrypted_content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-blue-100"> {time}</span>
                      <Check className="h-3 w-3 text-blue-100" />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Telegram Style */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="h-12 pr-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-full placeholder-gray-500 dark:placeholder-gray-400 focus-visible:ring-primary focus-visible:ring-1"
              disabled={sending}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 bottom-2 h-8 w-8 p-0 text-gray-400 hover:text-primary"
            >
              {/* Add emoji picker or attachment here */}
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
