import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowLeft, Send, Loader2, Phone, Video, MoreVertical, X,
  MessageSquare, Mic, MicOff, ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

// --- Import New Components (FIXED PATHS) ---
import { MessageBubble } from '../components/chat/MessageBubble';
import { DateDivider } from '../components/chat/DateDivider';

// --- Types (Export for MessageBubble) ---
export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_emoji: string;
}

export interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
  sender_id: string;
  sent_at: string;
  reply_to_message_id?: string | null;
  profiles: {
    display_name: string;
    handle: string;
  };
  message_reactions: Reaction[];
  reply_to_message?: Message; // We will populate this
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
  const [online, setOnline] = useState(false); // Simulated
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [audioPlayers, setAudioPlayers] = useState<{ [key: string]: { isPlaying: boolean; audio: HTMLAudioElement | null } }>({});
  const [replyTo, setReplyTo] = useState<Message | null>(null); // --- For Replies ---
  const [showScroll, setShowScroll] = useState(false); // --- For Scroll to Bottom ---

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        async (payload) => {
          // New message received. Fetch its profile and reply info.
          const newMessage = payload.new as Message;

          // 1. Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, handle')
            .eq('id', newMessage.sender_id)
            .single();

          if (profile) {
            newMessage.profiles = profile;
          }

          // 2. Fetch replied-to message (if it's a reply)
          if (newMessage.reply_to_message_id) {
            const { data: repliedMsg } = await supabase
              .from('messages')
              .select('*, profiles(display_name)')
              .eq('id', newMessage.reply_to_message_id)
              .single();
            if (repliedMsg) {
              newMessage.reply_to_message = repliedMsg as Message;
            }
          }

          // 3. Add to state
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRecording();
    };
  }, [chatId, user]);

  useEffect(() => {
    // Only auto-scroll if we're near the bottom
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 150;
      if (isNearBottom) {
        scrollToBottom('smooth');
      } else {
        setShowScroll(true); // Show "scroll to bottom" button
      }
    }
  }, [messages]);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScroll(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - clientHeight - scrollTop > 300) {
      setShowScroll(true);
    } else {
      setShowScroll(false);
    }
  };
  
  const fetchChatInfo = async () => {
    const { data } = await supabase
      .from('chats')
      .select('name, is_group')
      .eq('id', chatId)
      .single();
    
    if (data) {
      setChatInfo(data);
      if (!data.is_group) {
        setOnline(Math.random() > 0.5); // Still simulated
      }
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(display_name, handle), message_reactions(*), reply_to_message:messages!reply_to_message_id(*, profiles(display_name))')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load messages');
    }
    if (data) {
      setMessages(data as Message[]);
    }
    setLoading(false);
    setTimeout(() => scrollToBottom('auto'), 100);
  };

  const startRecording = async () => {
    // ... (no changes)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setRecording(true);
      toast.success('Recording... Tap to stop');
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = async () => {
    // ... (no changes)
     if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.success('Recorded! Tap to share.');
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !user || !chatId) return;

    setUploading(true);
    try {
      const fileName = `voice-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });

      if (error) throw error;
      
      const publicUrl = supabase.storage.from('voice-messages').getPublicUrl(data.path).data.publicUrl;

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          encrypted_content: '[Voice Message]',
          audio_url: publicUrl,
          reply_to_message_id: replyTo ? replyTo.id : null,
        });

      if (insertError) throw insertError;
      
      setAudioBlob(null);
      setReplyTo(null);
    } catch (err) {
      toast.error('Failed to send voice message');
    }
    setUploading(false);
  };

  const toggleAudio = (messageId: string, audioUrl: string) => {
    // ... (no changes)
     setAudioPlayers((prev) => {
      const current = prev[messageId];
      if (current?.isPlaying) {
        current.audio?.pause();
        return { ...prev, [messageId]: { ...current, isPlaying: false } };
      } else {
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => setAudioPlayers((p) => ({ ...p, [messageId]: { ...p[messageId], isPlaying: false } }));
        return { ...prev, [messageId]: { audio, isPlaying: true } };
      }
    });
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
        reply_to_message_id: replyTo ? replyTo.id : null,
      });

    if (error) {
      console.error('Send error details:', error);
      toast.error(`Failed to send: ${error.message}`);
    } else {
      setNewMessage('');
      setReplyTo(null);
      // We DON'T add to state optimistically.
      // The real-time channel will receive our message and add it.
      // This prevents duplicate messages.
    }
    setSending(false);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    // Optimistic update
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    
    const msg = messages[msgIndex];
    const existingReaction = msg.message_reactions.find(
      r => r.user_id === user.id && r.reaction_emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      setMessages(prev => prev.map(m => 
        m.id === messageId 
        ? { ...m, message_reactions: m.message_reactions.filter(r => r.id !== existingReaction.id) } 
        : m
      ));
      await supabase.from('message_reactions').delete().eq('id', existingReaction.id);
    } else {
      // Add reaction
      const tempId = `temp-${Date.now()}`;
      const newReaction: Reaction = { id: tempId, message_id: messageId, user_id: user.id, reaction_emoji: emoji };
      setMessages(prev => prev.map(m => 
        m.id === messageId 
        ? { ...m, message_reactions: [...m.message_reactions, newReaction] } 
        : m
      ));
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        reaction_emoji: emoji,
      });
    }
  };

  const handleBack = () => {
    navigate('/chats'); // Navigate to the chat list
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10 flex items-center px-4 py-3 gap-3 min-h-[60px]">
          <Button variant="ghost" size="icon" className="h-12 w-12 p-0" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-base font-semibold text-foreground truncate">
              {chatInfo?.name || (chatInfo?.is_group ? 'Group Chat' : 'Direct Message')}
            </h1>
            <p className={`text-xs ${online ? 'text-green-600' : 'text-muted-foreground'}`}>
              {online ? 'online' : 'last seen recently'}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* These are still placeholders, WebRTC is a separate, large feature */}
            <Button variant="ghost" size="icon" className="h-10 w-10 p-0"><Video className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 p-0"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 p-0"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* --- Messages Container --- */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 space-y-1 relative"
        >
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user?.id;
            
            // --- Grouping & Date Logic ---
            const prevMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            
            const messageDate = new Date(message.sent_at).toDateString();
            const prevMessageDate = prevMessage ? new Date(prevMessage.sent_at).toDateString() : null;
            const showDateDivider = messageDate !== prevMessageDate;
            
            const isGrouped = nextMessage &&
                              nextMessage.sender_id === message.sender_id &&
                              messageDate === new Date(nextMessage.sent_at).toDateString() &&
                              (new Date(nextMessage.sent_at).getTime() - new Date(message.sent_at).getTime() < 120000); // 2 mins

            return (
              <div key={message.id}>
                {showDateDivider && <DateDivider date={message.sent_at} />}
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  isGrouped={!!isGrouped}
                  isOnline={online}
                  onReply={setReplyTo}
                  onReaction={(emoji) => handleReaction(message.id, emoji)}
                  onToggleAudio={() => toggleAudio(message.id, message.audio_url!)}
                  audioPlayerState={audioPlayers[message.id] || { isPlaying: false }}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          
          {/* --- Scroll to Bottom Button --- */}
          {showScroll && (
            <Button
              size="icon"
              className="rounded-full absolute bottom-4 right-4 z-10 shadow-lg"
              onClick={() => scrollToBottom('smooth')}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* --- Input Area --- */}
        <div className="bg-card border-t border-border px-4 py-3 pb-[env(safe-area-inset-bottom)] space-y-2">
          
          {/* --- Reply Preview --- */}
          {replyTo && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted border-l-4 border-primary">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-primary truncate">
                  Replying to {replyTo.profiles.display_name}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {replyTo.audio_url ? '[Voice Message]' : replyTo.encrypted_content}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* --- Main Input --- */}
          <div className="flex items-end gap-2">
            {recording ? (
              <Button variant="ghost" size="icon" className="h-12 w-12" onClick={stopRecording}>
                <MicOff className="h-5 w-5 text-destructive" />
              </Button>
            ) : audioBlob ? (
              <Button variant="ghost" size="icon" className="h-12 w-12" onClick={sendVoiceMessage} disabled={uploading}>
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 text-primary" />}
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-12 w-12" onClick={startRecording}>
                <Mic className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 relative min-w-0">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (handleSend(), e.preventDefault())}
                className="h-12 pr-12 min-h-[44px]"
                disabled={sending || uploading || recording}
              />
              <Button size="icon" variant="ghost" className="absolute right-2 bottom-2 h-8 w-8">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending || uploading || recording}
              className="h-12 w-12 min-h-[44px] flex-shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChatRoom;
