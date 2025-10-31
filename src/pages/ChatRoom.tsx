import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Send, User, Loader2, Phone, Video, MoreVertical, Check, MessageSquare, HelpCircle, Info, Mic, MicOff, Play, Pause, Volume2, Waveform, ThumbsUp, Heart, Laugh, Surprised, Sad, Angry } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
  audio_duration?: number;
  sender_id: string;
  sent_at: string;
  profiles: {
    display_name: string;
    handle: string;
  };
  reactions?: { reaction: string; count: number; users: string[] }[];
}

interface ChatInfo {
  name: string | null;
  is_group: boolean;
}

const EMOJIS = [
  { emoji: '👍', icon: ThumbsUp },
  { emoji: '❤️', icon: Heart },
  { emoji: '😂', icon: Laugh },
  { emoji: '😮', icon: Surprised },
  { emoji: '😢', icon: Sad },
  { emoji: '😡', icon: Angry },
];

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
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showReactions, setShowReactions] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [audioPlayers, setAudioPlayers] = useState<{ [key: string]: { isPlaying: boolean; audio: HTMLAudioElement | null; duration: number; currentTime: number } }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    fetchChatInfo();
    fetchMessagesWithReactions();

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
                const newMsg = { ...payload.new, profiles: profile, reactions: [] };
                setMessages((prev) => [...prev, newMsg]);
              }
            });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${chatId}`, // Fixed: Use a broader filter or refetch; this was the bug
        },
        () => fetchMessagesWithReactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRecording();
      Object.values(audioPlayers).forEach(player => player.audio?.pause());
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

  const fetchMessagesWithReactions = async () => {
    console.log('Fetching messages for chatId:', chatId);
    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .select('*, profiles(display_name, handle)')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    if (msgError) {
      console.error('Fetch messages error:', msgError);
      toast.error('Failed to load messages');
      setLoading(false);
      return;
    }

    if (data) {
      const messagesWithReactions = await Promise.all(
        msgData.map(async (msg) => {
          const { data: reactionsData } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', msg.id);

          if (reactionsData) {
            const reactionsMap = reactionsData.reduce((acc, r) => {
              if (!acc[r.reaction]) acc[r.reaction] = { count: 0, users: [] };
              acc[r.reaction].count++;
              acc[r.reaction].users.push(r.user_id);
              return acc;
            }, {} as Record<string, { count: number; users: string[] }>);

            return { ...msg, reactions: Object.entries(reactionsMap).map(([reaction, data]) => ({ reaction, count: data.count, users: data.users })) };
          }
          return { ...msg, reactions: [] };
        })
      );
      setMessages(messagesWithReactions as Message[]);
    }
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 44100, echoCancellation: true } });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setRecording(true);
      setRecordedDuration(0);

      recordIntervalRef.current = setInterval(() => setRecordedDuration((prev) => prev + 1), 1000);

      toast.success('Recording voice message...', { duration: 2000 });
    } catch (err) {
      toast.error('Microphone access denied. Check permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      recordIntervalRef.current && clearInterval(recordIntervalRef.current);
      setRecording(false);
      toast.success(`Recorded ${recordedDuration}s voice message. Tap to send.`);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !user || !chatId) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const fileName = `voice-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: true,
        });

      if (error) throw error;

      const interval = setInterval(() => setUploadProgress((prev) => Math.min(prev + 20, 90)), 200);
      setTimeout(() => clearInterval(interval), 1000);

      const publicUrl = supabase.storage.from('voice-messages').getPublicUrl(data.path).data.publicUrl;

      // Fixed: Cast chat_id to uuid in insert
      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId as string, // Ensure string for UUID
          sender_id: user.id,
          encrypted_content: '[Voice Message]',
          audio_url: publicUrl,
          audio_duration: recordedDuration,
        })
        .select()
        .single();

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);

      if (insertError) throw insertError;

      setMessages((prev) => [...prev, { ...inserted, profiles: { display_name: user.display_name || 'You', handle: user.handle || '@you' } }]);
      setAudioBlob(null);
      setRecordedDuration(0);
      toast.success('Voice message sent!');
    } catch (err) {
      toast.error('Failed to send voice message');
      console.error(err);
    }
    setUploading(false);
  };

  const toggleAudio = (messageId: string, audioUrl: string, duration: number) => {
    setAudioPlayers((prev) => {
      const current = prev[messageId];
      if (current?.isPlaying) {
        current.audio?.pause();
        return { ...prev, [messageId]: { ...current, isPlaying: false, currentTime: current.audio?.currentTime || 0 } };
      } else {
        const audio = new Audio(audioUrl);
        audio.volume = 0.5;
        audio.play();
        audio.ontimeupdate = () => setAudioPlayers((p) => ({ ...p, [messageId]: { ...p[messageId], currentTime: audio.currentTime } }));
        audio.onended = () => setAudioPlayers((p) => ({ ...p, [messageId]: { ...p[messageId], isPlaying: false } }));
        return { ...prev, [messageId]: { audio, isPlaying: true, duration, currentTime: 0 } };
      }
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !chatId) return;

    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId as string, // Fixed cast
        sender_id: user.id,
        encrypted_content: newMessage,
      });

    if (error) {
      console.error('Send error details:', error);
      toast.error(`Failed to send: ${error.message}`);
    } else {
      setNewMessage('');
      const optimisticMsg: Message = {
        id: Date.now().toString(),
        encrypted_content: newMessage,
        sender_id: user.id,
        sent_at: new Date().toISOString(),
        profiles: { display_name: user.display_name || 'You', handle: user.handle || '@you' },
      };
      setMessages((prev) => [...prev, optimisticMsg]);
    }
    setSending(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const dismissHelp = () => {
    setShowHelp(false);
  };

  const handleLongPress = (e: React.MouseEvent | React.TouchEvent, messageId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setShowReactions({ messageId, x: rect.left + window.scrollX, y: rect.top + window.scrollY });
  };

  const handleReact = async (messageId: string, reaction: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('message_reactions')
      .upsert({ message_id: messageId, user_id: user.id, reaction }, { ignoreDuplicates: false });

    if (error) {
      toast.error('Failed to react');
    } else {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: msg.reactions
                  ? [
                      ...(msg.reactions.filter((r) => r.reaction !== reaction) || []),
                      { reaction, count: (msg.reactions?.find((r) => r.reaction === reaction)?.count || 0) + 1, users: [...(msg.reactions?.find((r) => r.reaction === reaction)?.users || []), user.id] },
                    ]
                  : [{ reaction, count: 1, users: [user.id] }],
              }
            : msg
        )
      );
    }
    setShowReactions(null);
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
                <Button variant="ghost" size="icon" className="h-10 w-9 p-0 hover:bg-muted">
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
              const progress = playerState ? (playerState.currentTime / (playerState.duration || 1)) * 100 : 0;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} w-full py-1`}
                  onTouchStart={(e) => handleLongPress(e, message.id)}
                  onContextMenu={(e) => handleLongPress(e, message.id)}
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
                        {isVoice ? (
                          <div className="bg-card px-3 py-2 rounded-lg shadow-sm border border-border max-w-full">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 w-full justify-start text-left rounded-lg hover:bg-muted"
                              onClick={() => toggleAudio(playerKey, message.audio_url!, message.audio_duration || 0)}
                            >
                              <div className="relative">
                                <Waveform className="h-4 w-4 opacity-50" />
                                {playerState?.isPlaying && (
                                  <div className="absolute inset-0 bg-primary/20 rounded animate-pulse" />
                                )}
                              </div>
                              <Volume2 className={`h-4 w-4 ${playerState?.isPlaying ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div className="flex-1 text-left">
                                <div className="text-xs text-muted-foreground">Voice message • {formatDuration(message.audio_duration || 0)}</div>
                                <Progress value={progress} className="h-1 mt-1 bg-muted" />
                              </div>
                              {playerState?.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-card text-foreground px-3 py-2 rounded-lg shadow-sm border border-border max-w-full">
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.encrypted_content}
                            </p>
                          </div>
                        )}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {message.reactions.map((r) => (
                              <Badge key={r.reaction} variant="outline" className="text-xs">
                                {r.reaction} {r.count}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end max-w-[85%]">
                      {isVoice ? (
                        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-sm max-w-full">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 w-full justify-end text-right rounded-lg hover:bg-primary/80"
                            onClick={() => toggleAudio(playerKey, message.audio_url!, message.audio_duration || 0)}
                          >
                            {playerState?.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            <Volume2 className={`h-4 w-4 ${playerState?.isPlaying ? 'text-primary-foreground' : 'text-primary-foreground/70'}`} />
                            <div className="flex-1 text-right">
                              <div className="text-xs text-primary-foreground/90">Voice message • {formatDuration(message.audio_duration || 0)}</div>
                              <Progress value={progress} className="h-1 mt-1 bg-primary/20" />
                            </div>
                            <div className="relative">
                              <Waveform className="h-4 w-4 text-primary-foreground/70" />
                              {playerState?.isPlaying && (
                                <div className="absolute inset-0 bg-primary/30 rounded animate-pulse" />
                              )}
                            </div>
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-sm max-w-full">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.encrypted_content}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-primary-foreground/70"> {time}</span>
                        <Check className="h-3 w-3 text-primary-foreground/70" />
                      </div>
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {message.reactions.map((r) => (
                            <Badge key={r.reaction} variant="secondary" className="text-xs text-primary-foreground">
                              {r.reaction} {r.count}
                            </Badge>
                          ))}
                        </div>
                      )}
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
                  <span>Tap the mic to record voice messages—tap again to stop, then send.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="flex-shrink-0 mt-0.5">3</Badge>
                  <span>Tap voice messages to play; use the back arrow to return.</span>
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

        {/* Reaction Picker */}
        {showReactions && (
          <div
            className="fixed bg-card border border-border rounded-lg p-2 shadow-lg z-30 flex gap-1"
            style={{ left: showReactions.x, top: showReactions.y }}
          >
            {EMOJIS.map(({ emoji, icon: Icon }) => (
              <Tooltip key={emoji}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => handleReact(showReactions.messageId, emoji)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>React with {emoji}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="fixed bottom-0 left
