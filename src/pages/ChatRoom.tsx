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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Unique Header: Modern with subtle glow */}
      <div className="bg-white/90 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-10 flex items-center px-4 py-3 gap-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-indigo-100 h-10 w-10 p-0 rounded-lg"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5 text-indigo-600" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {chatInfo?.name || (chatInfo?.is_group ? 'Group Chat' : 'Direct Message')}
          </h1>
          {chatInfo && !chatInfo.is_group && (
            <p className={`text-xs font-medium ${online ? 'text-green-600' : 'text-gray-500'}`}>
              {online ? 'online' : 'last seen recently'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-indigo-100 rounded-lg">
            <Video className="h-4 w-4 text-indigo-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-indigo-100 rounded-lg">
            <Phone className="h-4 w-4 text-indigo-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-indigo-100 rounded-lg">
            <MoreVertical className="h-4 w-4 text-indigo-600" />
          </Button>
        </div>
      </div>

      {/* Messages: Unique Bubble Style with Glow & Curves */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-indigo-300">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-3">
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">No messages yet. Start the conversation!</p>
            <p className="text-xs text-gray-400 bg-white/50 px-3 py-1 rounded-full">End-to-end encrypted</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            const time = new Date(message.sent_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} fade-in-up`}
              >
                {!isOwn ? (
                  <div className="flex items-start gap-3 max-w-[75%]">
                    {/* Avatar with Glow */}
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-indigo-100/50">
                      {message.profiles.display_name.charAt(0).toUpperCase()}
                    </div>
                    {/* Bubble */}
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {message.profiles.display_name}
                        </span>
                        <span className="text-xs text-gray-500"> {time}</span>
                      </div>
                      <div className="bg-white text-gray-900 px-5 py-4 rounded-2xl shadow-md border border-gray-200/50 max-w-full ring-1 ring-indigo-100/30">
                        <p className="text-sm leading-relaxed break-words">
                          {message.encrypted_content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end max-w-[75%]">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 rounded-2xl shadow-lg ring-1 ring-indigo-500/30 max-w-full">
                      <p className="text-sm leading-relaxed break-words">
                        {message.encrypted_content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-white/80"> {time}</span>
                      <Check className="h-3 w-3 text-white/80" />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input: Unique Pill with Glow Effect */}
      <div className="bg-white/90 backdrop-blur-md border-t border-indigo-100 px-4 py-3 shadow-sm">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="h-14 pr-14 bg-indigo-50/50 dark:bg-purple-900/20 border-indigo-200 dark:border-purple-800 rounded-2xl placeholder-gray-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent text-sm pl-4"
              disabled={sending}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-3 bottom-3 h-8 w-8 p-0 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-14 w-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ring-1 ring-indigo-500/20 transition-all duration-200"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rotate-45" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
