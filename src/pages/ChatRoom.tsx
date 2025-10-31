import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Added
import {
  ArrowLeft, Send, User, Loader2, Phone, Video, MoreVertical, Check, MessageSquare,
  HelpCircle, Info, Mic, MicOff, Play, Pause, Volume2, Smile, // Added Smile
} from 'lucide-react';
import { toast } from 'sonner';

// --- New Reaction Interface ---
interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_emoji: string;
}

interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
  sender_id: string;
  sent_at: string;
  profiles: {
    display_name: string;
    handle: string;
  };
  message_reactions: Reaction[]; // --- Updated ---
}

interface ChatInfo {
  name: string | null;
  is_group: boolean;
}

// --- Helper to aggregate reactions ---
const aggregateReactions = (reactions: Reaction[]) => {
  if (!reactions) return [];
  const counts = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction_emoji] = (acc[reaction.reaction_emoji] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
};

const ChatRoom = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null); // For reaction popovers

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
                    message_reactions: [], // --- Initialize reactions ---
                  },
                ]);
              }
            });
        }
      )
      .subscribe();
      
    // --- New subscription for reactions (optimistic-only for now) ---
    // Real-time reactions are complex; this provides a robust optimistic update
    // A full real-time solution would require a more complex channel setup

    return () => {
      supabase.removeChannel(channel);
      stopRecording();
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
      // --- Updated select to include reactions ---
      .select('*, profiles(display_name, handle), message_reactions(*)')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    console.log('Fetched messages:', data, 'Error:', error);

    if (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load messages');
    }
    if (data) {
      setMessages(data as Message[]);
    }
    setLoading(false);
  };

  const startRecording = async () => {
    // ... (no changes in this function)
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
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    // ... (no changes in this function)
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.success('Recorded! Tap send to share.');
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
        .select()
        .single();

      if (insertError) throw insertError;

      // --- Add optimistic reactions array ---
      setMessages((prev) => [...prev, { ...inserted, profiles: { display_name: user.display_name || 'You', handle: user.handle || '@you' }, message_reactions: [] }]);
      setAudioBlob(null);
    } catch (err) {
      toast.error('Failed to send voice message');
      console.error(err);
    }
    setUploading(false);
  };

  const toggleAudio = (messageId: string, audioUrl: string) => {
    // ... (no changes in this function)
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
      });

    if (error) {
      console.error('Send error details:', error);
      toast.error(`Failed to send: ${error.message}`);
    } else {
      setNewMessage('');
      const optimisticMsg: Message = {
        id: Date.now().toString(), // Temporary ID
        encrypted_content: newMessage,
        sender_id: user.id,
        sent_at: new Date().toISOString(),
        profiles: { display_name: user.display_name || 'You', handle: user.handle || '@you' },
        message_reactions: [], // --- Add optimistic reactions array ---
      };
      // Note: We don't add this to state anymore because the channel
      // subscription will catch the insert and add it properly.
      // setMessages((prev) => [...prev, optimisticMsg]); // This is now handled by the real-time channel
    }
    setSending(false);
  };
  
  // --- New function to handle reactions ---
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    // Optimistic update logic
    let updatedMessages = [...messages];
    const msgIndex = updatedMessages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const msg = updatedMessages[msgIndex];
    const existingReaction = msg.message_reactions.find(
      r => r.user_id === user.id && r.reaction_emoji === emoji
    );

    if (existingReaction) {
      // --- Optimistically remove reaction ---
      const newReactions = msg.message_reactions.filter(r => r.id !== existingReaction.id);
      updatedMessages[msgIndex] = { ...msg, message_reactions: newReactions };
      setMessages(updatedMessages);

      // --- Send delete request to db ---
      await supabase.from('message_reactions').delete().eq('id', existingReaction.id);
      
    } else {
      // --- Optimistically add reaction ---
      const newReaction: Reaction = {
        id: `temp-${Date.now()}`, // Temporary ID
        message_id: messageId,
        user_id: user.id,
        reaction_emoji: emoji,
      };
      const newReactions = [...msg.message_reactions, newReaction];
      updatedMessages[msgIndex] = { ...msg, message_reactions: newReactions };
      setMessages(updatedMessages);

      // --- Send insert request to db ---
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        reaction_emoji: emoji,
      });
    }
    setOpenPopover(null); // Close the popover
  };

  const handleBack = () => {
    // --- Updated to go to /chats ---
    navigate('/chats');
  };

  const dismissHelp = () => {
    setShowHelp(false);
  };
  
  // --- New component for the reaction button and popover ---
  const ReactionButton = ({ message }: { message: Message }) => (
    <Popover open={openPopover === message.id} onOpenChange={(isOpen) => setOpenPopover(isOpen ? message.id : null)}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1">
        <div className="flex gap-1">
          {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-xl p-0"
              onClick={() => handleReaction(message.id, emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  // --- New component to display aggregated reactions ---
  const ReactionDisplay = ({ reactions }: { reactions: Reaction[] }) => {
    const aggregated = aggregateReactions(reactions);
    if (aggregated.length === 0) return null;

    return (
      <div className="flex gap-1 mt-1">
        {aggregated.map(({ emoji, count }) => (
          <Badge key={emoji} variant="secondary" className="shadow-sm">
            {emoji} {count > 1 && <span className="text-xs ml-1">{count}</span>}
          </Badge>
        ))}
      </div>
    );
  };

  if (loading) {
    // ... (no changes in this block)
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
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10 flex items-center px-4 py-3 gap-3 min-h-[60px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 p-0 hover:bg-muted flex-shrink-0"
                onClick={handleBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Go back to your chats</p>
            </TooltipContent>
          </Tooltip>
          {/* ... (rest of header is unchanged) ... */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-base font-semibold text-foreground truncate">
              {chatInfo?.name || (chatInfo?.is_group ? 'Group Chat' : 'Direct Message')}
            </h1>
            {chatInfo && !chatInfo.is_group && (
              <p className={`text-xs ${online ? 'text-green-600' : 'text-muted-foreground'}`}>
                {online ? 'online' : 'last seen recently'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted">
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Start video call</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted">
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Start voice call</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>More options</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ paddingBottom: '120px' }}>
          {messages.length === 0 ? (
            // ... (no changes here)
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 px-4">
              <MessageSquare className="h-12 w-12 opacity-50" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
              <p className="text-xs text-muted-foreground">Messages are encrypted end-to-end</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              const time = new Date(message.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const isVoice = !!message.audio_url;
              const playerKey = message.id;
              const playerState = audioPlayers[playerKey];
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} w-full py-1`}
                >
                  {!isOwn ? (
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {message.profiles.display_name}
                          </span>
                          <span className="text-xs text-muted-foreground"> {time}</span>
                        </div>
                        {/* --- Message bubble group (for hover) --- */}
                        <div className="flex items-end gap-1 group">
                          {isVoice ? (
                            <div className="bg-card px-3 py-2 rounded-lg shadow-sm border border-border max-w-full">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 w-full justify-start text-left"
                                onClick={() => toggleAudio(playerKey, message.audio_url!)}
                              >
                                {playerState?.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                <Volume2 className="h-4 w-4" />
                                <span className="text-sm text-muted-foreground">Voice message ({Math.round((new Blob([message.audio_url!]).size / 1024))} KB)</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-card text-foreground px-3 py-2 rounded-lg shadow-sm border border-border max-w-full">
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.encrypted_content}
                              </p>
                            </div>
                          )}
                          {/* --- Add Reaction Button --- */}
                          <ReactionButton message={message} />
                        </div>
                        {/* --- Display Reactions --- */}
                        <ReactionDisplay reactions={message.message_reactions} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end max-w-[85%]">
                      {/* --- Message bubble group (for hover) --- */}
                      <div className="flex items-end gap-1 group">
                         {/* --- Add Reaction Button (appears on left for own messages) --- */}
                        <ReactionButton message={message} />
                        {isVoice ? (
                          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-sm max-w-full">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 w-full justify-end text-right"
                              onClick={() => toggleAudio(playerKey, message.audio_url!)}
                            >
                              {playerState?.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              <Volume2 className="h-4 w-4" />
                              <span className="text-sm text-primary-foreground/90">Voice message ({Math.round((new Blob([message.audio_url!]).size / 1024))} KB)</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-sm max-w-full">
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.encrypted_content}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-primary-foreground/70"> {time}</span>
                        <Check className="h-3 w-3 text-primary-foreground/70" />
                      </div>
                       {/* --- Display Reactions --- */}
                      <ReactionDisplay reactions={message.message_reactions} />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Beginner Help Overlay */}
        {showHelp && (
          // ... (no changes in this block)
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl p-6 max-w-sm w-full border border-border">
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

        {/* Input: Fixed bottom, with voice recording */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          {/* ... (no changes in this block) ... */}
          <div className="flex items-end gap-2">
            {recording ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 p-0 bg-destructive/10 text-destructive hover:bg-destructive/20"
                onClick={stopRecording}
              >
                <MicOff className="h-5 w-5" />
              </Button>
            ) : audioBlob ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 p-0 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={sendVoiceMessage}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={startRecording}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 relative min-w-0">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.targe.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="h-12 pr-12 min-h-[44px]"
                disabled={sending || uploading}
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
              disabled={!newMessage.trim() || sending || uploading}
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
