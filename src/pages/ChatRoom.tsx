import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Send, User, Loader2, Phone, Video, MoreVertical, Check, MessageSquare, HelpCircle, Info, Mic, MicOff, Play, Pause, Volume2, X, Smile, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { messageSchema } from '@/lib/validation';
import { ChatRedEnvelope } from '@/components/chat/ChatRedEnvelope';
import { SendRedEnvelopeDialog } from '@/components/chat/SendRedEnvelopeDialog';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { DateDivider } from '@/components/chat/DateDivider';
import { isSameDay } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
  sender_id: string;
  sent_at: string;
  edited_at?: string | null;
  reply_to_message_id?: string | null;
  message_reactions?: Array<{
    reaction: string;
    user_id: string;
  }>;
  reply_to_message?: {
    audio_url?: string;
    encrypted_content: string;
    profiles: {
      display_name: string;
    };
  };
  profiles: {
    display_name: string;
    handle: string;
  };
}

interface RedEnvelope {
  id: string;
  sender_id: string;
  total_amount: number;
  recipient_count: number;
  claimed_count: number;
  message: string | null;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url: string | null;
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
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [redEnvelopes, setRedEnvelopes] = useState<RedEnvelope[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [audioPlayers, setAudioPlayers] = useState<{ [key: string]: { isPlaying: boolean; audio: HTMLAudioElement | null } }>({});
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    fetchChatInfo();
    fetchMessages();
    fetchRedEnvelopes();

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
                    id: payload.new.id,
                    encrypted_content: payload.new.encrypted_content,
                    audio_url: payload.new.audio_url,
                    sender_id: payload.new.sender_id,
                    sent_at: payload.new.sent_at,
                    profiles: profile,
                  } as Message,
                ]);
              }
            });
        }
      )
      .subscribe();

    // Real-time red envelope updates
    const envelopeChannel = supabase
      .channel(`red-envelopes-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'red_envelopes',
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          fetchRedEnvelopes();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'red_envelope_claims',
        },
        (payload) => {
          // Show notification when someone claims
          const claim = payload.new;
          if (claim.claimer_id !== user?.id) {
            toast.info('Someone just claimed a red envelope! 🧧', {
              duration: 2000
            });
            fetchRedEnvelopes();
          }
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const typingUserId = payload.new.user_id;
            if (typingUserId !== user?.id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', typingUserId)
                .single();
              
              if (profile) {
                setTypingUsers(prev => [...new Set([...prev, profile.display_name])]);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const typingUserId = payload.old.user_id;
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', typingUserId)
              .single();
            
            if (profile) {
              setTypingUsers(prev => prev.filter(name => name !== profile.display_name));
            }
          }
        }
      )
      .subscribe();

    // Subscribe to message reactions
    const reactionsChannel = supabase
      .channel(`reactions-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(envelopeChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(reactionsChannel);
      stopRecording();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
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
      if (!data.is_group) {
        setOnline(Math.random() > 0.5);
      }
    }
  };

  const fetchMessages = async () => {
    console.log('Fetching messages for chatId:', chatId);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles(display_name, handle),
        message_reactions(reaction, user_id),
        reply_to_message:messages!reply_to_message_id(
          encrypted_content,
          audio_url,
          profiles(display_name)
        )
      `)
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    console.log('Fetched messages:', data, 'Error:', error);

    if (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load messages');
    }
    if (data) {
      setMessages(data as any);
    }
    setLoading(false);
  };

  const fetchRedEnvelopes = async () => {
    const { data } = await supabase
      .from('red_envelopes')
      .select(`
        *,
        sender:profiles!red_envelopes_sender_id_fkey(display_name, avatar_url)
      `)
      .eq('chat_id', chatId)
      .eq('is_expired', false)
      .order('created_at', { ascending: true });

    if (data) {
      setRedEnvelopes(data);
    }
  };

  const startRecording = async () => {
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
      toast.success(t('chat.recording'));
    } catch (err) {
      toast.error(t('chat.stopRecording'));
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.success(t('chatRoom.messageSent'));
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !user || !chatId) return;

    setUploading(true);
    try {
      const fileName = `voice-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('voice-messages') // Assume bucket created
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });

      if (error) throw error;

      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          encrypted_content: '[Voice Message]', // Placeholder text
          audio_url: supabase.storage.from('voice-messages').getPublicUrl(data.path).data.publicUrl,
        })
        .select('*, profiles(display_name, handle)')
        .single();

      if (insertError) throw insertError;

      if (inserted) {
        setMessages((prev) => [...prev, inserted as Message]);
      }
      setAudioBlob(null);
    } catch (err) {
      toast.error('Failed to send voice message');
      console.error(err);
    }
    setUploading(false);
  };

  const toggleAudio = (messageId: string, audioUrl: string) => {
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
    if (!newMessage.trim() || !user || sending) return;

    try {
      messageSchema.parse(newMessage);
    } catch (error) {
      toast.error('Message is too long or invalid');
      return;
    }

    setSending(true);
    
    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: user.id,
      encrypted_content: newMessage,
      reply_to_message_id: replyToMessage?.id || null,
    });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      setReplyToMessage(null);
      removeTypingIndicator();
    }
    setSending(false);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    if (value.trim()) {
      updateTypingIndicator();
    } else {
      removeTypingIndicator();
    }
  };

  const updateTypingIndicator = async () => {
    if (!user || !chatId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await supabase
      .from('typing_indicators')
      .upsert({
        chat_id: chatId,
        user_id: user.id,
        started_at: new Date().toISOString(),
      });

    typingTimeoutRef.current = setTimeout(removeTypingIndicator, 3000);
  };

  const removeTypingIndicator = async () => {
    if (!user || !chatId) return;

    await supabase
      .from('typing_indicators')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', user.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!user) return;

    try {
      messageSchema.parse(newContent);

      const { error } = await supabase
        .from('messages')
        .update({ 
          encrypted_content: newContent,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, encrypted_content: newContent, edited_at: new Date().toISOString() }
          : msg
      ));

      toast.success('Message edited');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        toast.error('Message is too long or invalid');
      } else {
        console.error('Error editing message:', error);
        toast.error('Failed to edit message');
      }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        reaction: emoji,
      });

    if (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const dismissHelp = () => {
    setShowHelp(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <div className="text-center p-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-dvh flex flex-col bg-background overflow-hidden dark">
        {/* Header - Telegram style */}
        <div className="bg-card sticky top-0 z-10 flex items-center px-4 py-3 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 p-0 hover:bg-muted/50 rounded-full flex-shrink-0"
            onClick={handleBack}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          {/* Profile Picture */}
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
            {chatInfo?.name?.charAt(0).toUpperCase() || 'T'}
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-medium truncate">
              {chatInfo?.name || (chatInfo?.is_group ? 'Group Chat' : 'Direct Message')}
            </h1>
            {typingUsers.length > 0 ? (
              <p className="text-xs text-primary">
                {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
              </p>
            ) : chatInfo && !chatInfo.is_group && (
              <p className="text-xs text-muted-foreground">
                {online ? 'online' : 'last seen 19:28'}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted/50 rounded-full">
              <Phone className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted/50 rounded-full">
              <MoreVertical className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Messages - Telegram background */}
        <div className="flex-1 overflow-y-auto px-4 py-4 telegram-bg" style={{ paddingBottom: '120px' }}>
          {messages.length === 0 && redEnvelopes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 px-4">
              <MessageSquare className="h-14 w-14 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-foreground/80">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Display messages and red envelopes chronologically */}
              {(() => {
                const sortedItems = [...messages, ...redEnvelopes.map(e => ({ ...e, type: 'red_envelope' as const }))]
                  .sort((a, b) => {
                    const timeA = 'sent_at' in a ? new Date(a.sent_at).getTime() : new Date(a.created_at).getTime();
                    const timeB = 'sent_at' in b ? new Date(b.sent_at).getTime() : new Date(b.created_at).getTime();
                    return timeA - timeB;
                  });

                const itemsWithDividers = sortedItems.reduce((acc: any[], item, index) => {
                  const currentDate = 'sent_at' in item ? new Date(item.sent_at) : new Date(item.created_at);
                  const prevDate = index > 0 
                    ? ('sent_at' in sortedItems[index - 1] ? new Date((sortedItems[index - 1] as any).sent_at) : new Date((sortedItems[index - 1] as any).created_at))
                    : null;

                  if (!prevDate || !isSameDay(currentDate, prevDate)) {
                    acc.push({ type: 'date_divider', date: currentDate });
                  }
                  acc.push(item);
                  return acc;
                }, []);

                return itemsWithDividers.map((item: any, index: number) => {
                  if (item.type === 'date_divider') {
                    return <DateDivider key={`date-${index}`} date={item.date} />;
                  }
                  
                  if (item.type === 'red_envelope') {
                    return (
                      <ChatRedEnvelope
                        key={item.id}
                        envelope={item}
                        onClaim={() => {
                          toast.success('Red envelope claimed!');
                          fetchRedEnvelopes();
                        }}
                      />
                    );
                  }

                  const message = item as Message;
                  const isOwn = message.sender_id === user?.id;
                  
                  // Look back in the itemsWithDividers array to find the previous message
                  let prevMessage: Message | null = null;
                  for (let i = index - 1; i >= 0; i--) {
                    if (itemsWithDividers[i].type !== 'red_envelope' && itemsWithDividers[i].type !== 'date_divider' && 'sender_id' in itemsWithDividers[i]) {
                      prevMessage = itemsWithDividers[i] as Message;
                      break;
                    }
                  }
                  const isGrouped = prevMessage?.sender_id === message.sender_id;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      isGrouped={isGrouped}
                      isOnline={online}
                      onReply={handleReply}
                      onReaction={handleReaction}
                      onToggleAudio={() => message.audio_url && toggleAudio(message.id, message.audio_url)}
                      audioPlayerState={audioPlayers[message.id] || { isPlaying: false }}
                      onEdit={handleEditMessage}
                    />
                  );
                });
              })()}
              
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Beginner Help Overlay */}
        {showHelp && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Welcome to your chat!</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="flex-shrink-0 mt-0.5">1</Badge>
                  <span>Type your message below and hit send (or Enter).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="flex-shrink-0 mt-0.5">2</Badge>
                  <span>Tap the mic icon to record voice messages.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="flex-shrink-0 mt-0.5">3</Badge>
                  <span>Use the back arrow to return to your chats.</span>
                </li>
              </ul>
              <div className="flex gap-2">
                <Button variant="outline" onClick={dismissHelp} className="flex-1">
                  Got it!
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Need more help? Check our guide.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Reply Preview */}
        {replyToMessage && (
          <div className="fixed bottom-[68px] left-0 right-0 z-20 bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-primary rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary">
                  {replyToMessage.profiles?.display_name || 'User'}
                </p>
                <p className="text-sm text-foreground truncate mt-0.5">
                  {replyToMessage.audio_url ? '🎤 Voice message' : replyToMessage.encrypted_content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setReplyToMessage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Input: Telegram style */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-card px-3 py-2 pb-[env(safe-area-inset-bottom)]">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-1.5">
            {recording ? (
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-destructive/10 rounded-3xl">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  <span className="text-sm text-destructive font-medium">Recording...</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={stopRecording}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MicOff className="h-5 w-5" />}
                </Button>
              </div>
            ) : audioBlob ? (
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-primary/10 rounded-3xl">
                <Volume2 className="h-5 w-5 text-primary" />
                <span className="text-sm text-primary font-medium flex-1">Voice message ready</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-primary"
                  onClick={sendVoiceMessage}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full hover:bg-muted/30 text-muted-foreground flex-shrink-0"
                >
                  <Smile className="h-6 w-6" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Message"
                  className="flex-1 bg-secondary border-none rounded-xl px-4 py-2.5 h-11 text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-0"
                  disabled={sending}
                />
                {chatInfo?.is_group && (
                  <SendRedEnvelopeDialog 
                    chatId={chatId!} 
                    onSuccess={fetchRedEnvelopes}
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full hover:bg-muted/30 text-muted-foreground flex-shrink-0"
                >
                  <Paperclip className="h-6 w-6" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full hover:bg-muted/30 text-muted-foreground flex-shrink-0"
                  onClick={startRecording}
                >
                  <Mic className="h-6 w-6" />
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChatRoom;
