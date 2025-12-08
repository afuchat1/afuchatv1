import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { ArrowLeft, Send, User, Phone, Video, MoreVertical, Check, MessageSquare, HelpCircle, Info, Mic, MicOff, Play, Pause, Volume2, X, Smile, Paperclip, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { messageSchema } from '@/lib/validation';
import { ChatRedEnvelope } from '@/components/chat/ChatRedEnvelope';
import { SendRedEnvelopeDialog } from '@/components/chat/SendRedEnvelopeDialog';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { GroupSettingsSheet } from '@/components/chat/GroupSettingsSheet';
import { DateDivider } from '@/components/chat/DateDivider';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { isSameDay, formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { FileUploadPreview } from '@/components/chat/FileUploadPreview';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { useChatPreferences } from '@/hooks/useChatPreferences';

interface ChatTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface ChatWallpaper {
  id: string;
  name: string;
  image_url: string;
}

interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
  sender_id: string;
  sent_at: string;
  delivered_at?: string | null;
  read_at?: string | null;
  edited_at?: string | null;
  reply_to_message_id?: string | null;
  message_reactions?: Array<{
    reaction: string;
    user_id: string;
  }>;
  reply_to_message?: {
    audio_url?: string;
    encrypted_content: string;
    sender_id: string;
    profiles: {
      display_name: string;
      avatar_url?: string | null;
    };
  };
  profiles: {
    display_name: string;
    handle: string;
    avatar_url?: string | null;
    is_verified: boolean | null;
    is_organization_verified: boolean | null;
    is_affiliate: boolean | null;
    affiliated_business_id: string | null;
  };
  message_status?: Array<{
    read_at: string | null;
    delivered_at: string | null;
    user_id: string;
  }>;
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
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
}

interface OtherUserProfile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  last_seen: string | null;
  show_online_status: boolean | null;
  is_verified: boolean | null;
  is_organization_verified: boolean | null;
  is_affiliate: boolean | null;
  affiliated_business_id: string | null;
}

const ChatRoom = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { preferences: chatPreferences, loading: prefsLoading } = useChatPreferences();
  const [messages, setMessages] = useState<Message[]>([]);
  const [redEnvelopes, setRedEnvelopes] = useState<RedEnvelope[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);
  
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [audioPlayers, setAudioPlayers] = useState<{ [key: string]: { isPlaying: boolean; audio: HTMLAudioElement | null } }>({});
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ChatTheme | null>(null);
  const [currentWallpaper, setCurrentWallpaper] = useState<ChatWallpaper | null>(null);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [prevMessageCount, setPrevMessageCount] = useState(0);

  // Improved scroll behavior - scroll to bottom on new messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant',
        block: 'end'
      });
    }
  };

  useEffect(() => {
    if (messages.length > prevMessageCount) {
      // Only smooth scroll for new messages, instant for initial load
      scrollToBottom(prevMessageCount > 0);
      setPrevMessageCount(messages.length);
    }
  }, [messages.length, prevMessageCount]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [loading]);

  // Load theme and wallpaper data
  useEffect(() => {
    const loadThemeAndWallpaper = async () => {
      if (!chatPreferences.chatTheme) return;
      
      try {
        const { data: themeData } = await supabase
          .from('chat_themes')
          .select('*')
          .eq('id', chatPreferences.chatTheme)
          .single();
        
        if (themeData) {
          setCurrentTheme({
            id: themeData.id,
            name: themeData.name,
            colors: typeof themeData.colors === 'string' 
              ? JSON.parse(themeData.colors) 
              : themeData.colors
          });
        }
      } catch (error) {
        // Silent fail - theme loading is not critical
      }

      if (!chatPreferences.wallpaper) return;
      
      try {
        const { data: wallpaperData } = await supabase
          .from('chat_wallpapers')
          .select('*')
          .eq('id', chatPreferences.wallpaper)
          .single();
        
        if (wallpaperData) {
          setCurrentWallpaper({
            id: wallpaperData.id,
            name: wallpaperData.name,
            image_url: wallpaperData.image_url
          });
        }
      } catch (error) {
        // Silent fail - wallpaper loading is not critical
      }
    };

    if (!prefsLoading) {
      loadThemeAndWallpaper();
    }
  }, [chatPreferences.chatTheme, chatPreferences.wallpaper, prefsLoading]);

  // Update user's last_seen on mount and interval
  useEffect(() => {
    if (!user) return;

    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Set up presence tracking
  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase.channel(`presence-${chatId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Check if other user is present
        if (otherUser) {
          const isPresent = Object.keys(state).some(key => 
            state[key].some((p: any) => p.user_id === otherUser.id)
          );
          setOnline(isPresent);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (otherUser && newPresences.some((p: any) => p.user_id === otherUser.id)) {
          setOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (otherUser && leftPresences.some((p: any) => p.user_id === otherUser.id)) {
          setOnline(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    setPresenceChannel(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user, otherUser]);

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
            .select('display_name, handle, is_verified, is_organization_verified, is_affiliate, affiliated_business_id')
            .eq('id', payload.new.sender_id)
            .single()
            .then(async ({ data: profile, error }) => {
              if (error) {
                // Silent fail - profile fetch is not critical
                return;
              }
              if (profile) {
                const newMsg = {
                  id: payload.new.id,
                  encrypted_content: payload.new.encrypted_content,
                  audio_url: payload.new.audio_url,
                  attachment_url: payload.new.attachment_url,
                  attachment_type: payload.new.attachment_type,
                  attachment_name: payload.new.attachment_name,
                  attachment_size: payload.new.attachment_size,
                  sender_id: payload.new.sender_id,
                  sent_at: payload.new.sent_at,
                  profiles: profile,
                } as Message;
                
                setMessages((prev) => [...prev, newMsg]);
                
                // Mark as delivered and read if we're the recipient
                if (user && payload.new.sender_id !== user.id) {
                  // Update the messages table read_at
                  await supabase
                    .from('messages')
                    .update({ read_at: new Date().toISOString() })
                    .eq('id', payload.new.id);
                  
                  // Also update message_status
                  await supabase
                    .from('message_status')
                    .upsert({
                      message_id: payload.new.id,
                      user_id: user.id,
                      delivered_at: new Date().toISOString(),
                      read_at: new Date().toISOString(),
                    });
                }
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

    // Subscribe to message status changes (read receipts)
    const statusChannel = supabase
      .channel(`message-status-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_status',
        },
        () => {
          fetchMessages();
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
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(reactionsChannel);
      stopRecording();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, user]);

  const fetchChatInfo = async () => {
    const { data } = await supabase
      .from('chats')
      .select('name, is_group, description, avatar_url, created_by')
      .eq('id', chatId)
      .single();
    
    if (data) {
      setChatInfo(data);
      
      // Check if current user is member and admin for groups
      if (data.is_group && user) {
        const { data: memberData } = await supabase
          .from('chat_members')
          .select('is_admin')
          .eq('chat_id', chatId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (memberData) {
          setIsMember(true);
          setIsGroupAdmin(memberData.is_admin || false);
        } else {
          setIsMember(false);
          setIsGroupAdmin(false);
        }
      }
      
      // For 1-on-1 chats, fetch the other user's profile
      if (!data.is_group && user) {
        const { data: members } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chatId)
          .neq('user_id', user.id)
          .limit(1);
        
        if (members && members.length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, handle, avatar_url, last_seen, show_online_status, is_verified, is_organization_verified, is_affiliate, affiliated_business_id')
            .eq('id', members[0].user_id)
            .single();
          
          if (profile) {
            setOtherUser(profile);
            // Check if user is online (last seen within 5 minutes)
            if (profile.last_seen && profile.show_online_status) {
              const lastSeenTime = new Date(profile.last_seen).getTime();
              const now = new Date().getTime();
              setOnline(now - lastSeenTime < 5 * 60 * 1000);
            }
          }
        }
      }
    }
  };

  const fetchMessages = async () => {
    console.log('Fetching messages for chatId:', chatId);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles(display_name, handle, avatar_url, is_verified, is_organization_verified, is_affiliate, affiliated_business_id),
        message_reactions(reaction, user_id),
        message_status(read_at, delivered_at, user_id),
        reply_to_message:messages!reply_to_message_id(
          encrypted_content,
          audio_url,
          sender_id,
          profiles(display_name, avatar_url)
        )
      `)
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });

    console.log('Fetched messages:', data, 'Error:', error);

    if (error) {
      toast.error('Failed to load messages');
      return;
    }
    if (data) {
      setMessages(data);
      // Mark messages as delivered and read
      if (user) {
        const messageIds = data
          .filter((msg) => msg.sender_id !== user.id)
          .map((msg) => msg.id);
        
        if (messageIds.length > 0) {
          await markMessagesAsRead(messageIds);
        }
      }
    }
    setLoading(false);
  };

  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!user) return;

    // Update the messages table read_at field
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .is('read_at', null);

    // Also update message_status for detailed tracking
    for (const messageId of messageIds) {
      await supabase
        .from('message_status')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          delivered_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
        });
    }
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
      // Use user folder structure for RLS compliance
      const fileName = `${user.id}/voice-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, { 
          contentType: 'audio/webm',
          upsert: false 
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(data.path);

      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          encrypted_content: '[Voice Message]',
          audio_url: publicUrl,
        })
        .select('*, profiles(display_name, handle, is_verified, is_organization_verified, is_affiliate, affiliated_business_id)')
        .single();

      if (insertError) throw insertError;

      // Create message_status entries for other chat members
      const { data: members } = await supabase
        .from('chat_members')
        .select('user_id')
        .eq('chat_id', chatId)
        .neq('user_id', user.id);

      if (members && members.length > 0 && inserted) {
        const statusEntries = members.map(member => ({
          message_id: inserted.id,
          user_id: member.user_id,
          delivered_at: new Date().toISOString(),
        }));

        await supabase
          .from('message_status')
          .insert(statusEntries);
      }

      if (inserted) {
        setMessages((prev) => [...prev, inserted as Message]);
      }
      setAudioBlob(null);
      toast.success('Voice message sent');
    } catch (err) {
      toast.error('Failed to send voice message');
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
    if ((!newMessage.trim() && !selectedFile) || !user || sending) return;

    try {
      if (newMessage.trim()) {
        messageSchema.parse(newMessage);
      }
    } catch (error) {
      toast.error('Message is too long or invalid');
      return;
    }

    setSending(true);
    
    try {
      let attachmentUrl = null;
      let attachmentType = null;
      let attachmentName = null;
      let attachmentSize = null;

      // Upload file if selected
      if (selectedFile) {
        setUploadingFile(true);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          toast.error('Failed to upload file');
          setSending(false);
          setUploadingFile(false);
          return;
        }

        attachmentUrl = fileName;
        attachmentType = selectedFile.type;
        attachmentName = selectedFile.name;
        attachmentSize = selectedFile.size;
        setUploadingFile(false);
      }

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          encrypted_content: newMessage || '',
          reply_to_message_id: replyToMessage?.id || null,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: attachmentName,
          attachment_size: attachmentSize,
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to send message');
      } else {
        // Create message_status entries for other chat members
        const { data: members } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chatId)
          .neq('user_id', user.id);

        if (members && members.length > 0) {
          const statusEntries = members.map(member => ({
            message_id: inserted.id,
            user_id: member.user_id,
            delivered_at: new Date().toISOString(),
          }));

          await supabase
            .from('message_status')
            .insert(statusEntries);
        }

        setNewMessage('');
        setSelectedFile(null);
        setReplyToMessage(null);
        removeTypingIndicator();
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
    
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported');
      return;
    }

    setSelectedFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      // Silent fail - reaction errors are not critical
    }
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleJoinGroup = async () => {
    if (!user || !chatId) return;
    
    setIsJoining(true);
    try {
      const { error } = await supabase
        .from('chat_members')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          is_admin: false
        });

      if (error) throw error;

      toast.success(t('chat.joinedGroup'));
      setIsMember(true);
      
      // Refresh chat info
      await fetchChatInfo();
    } catch (error) {
      toast.error(t('chat.joinGroupError'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !chatId || !chatInfo?.is_group) return;
    
    try {
      const { error } = await supabase
        .from('chat_members')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('chat.leftGroup'));
      navigate('/chats');
    } catch (error) {
      toast.error(t('chat.leaveGroupError'));
    }
  };


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <CustomLoader size="lg" text="Loading chat..." />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="fixed inset-0 flex flex-col bg-background" style={{ overflow: 'hidden' }}>
        {/* WhatsApp-style Header - Fixed at top */}
        <header className="flex-shrink-0 flex items-center gap-3 px-2 py-2 bg-card/95 backdrop-blur-xl border-b border-border shadow-sm z-10 pt-[env(safe-area-inset-top)]">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserAvatar 
              userId={chatInfo?.is_group ? chatId! : (otherUser?.id || 'unknown')}
              avatarUrl={chatInfo?.is_group ? chatInfo.avatar_url : otherUser?.avatar_url} 
              name={chatInfo?.is_group ? (chatInfo.name || 'Group') : (otherUser?.display_name || 'Chat')} 
              size={40}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h2 className="font-semibold text-base truncate">
                  {chatInfo?.is_group ? (chatInfo.name || 'Group') : (otherUser?.display_name || 'Chat')}
                </h2>
                {otherUser && !chatInfo?.is_group && (
                  <VerifiedBadge
                    isVerified={otherUser.is_verified || false}
                    isOrgVerified={otherUser.is_organization_verified || false}
                    isAffiliate={otherUser.is_affiliate || false}
                    size="sm"
                  />
                )}
              </div>
              {!chatInfo?.is_group && otherUser && (
                <p className="text-xs text-muted-foreground">
                  {online ? 'online' : otherUser.last_seen ? `last seen at ${new Date(otherUser.last_seen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'offline'}
                </p>
              )}
              {chatInfo?.is_group && chatInfo.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {chatInfo.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!chatInfo?.is_group && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <Phone className="h-5 w-5" />
              </Button>
            )}
            {chatInfo?.is_group && isGroupAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setIsGroupSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
            {chatInfo?.is_group && isMember ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleLeaveGroup}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('chat.leaveGroup')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            )}
          </div>
        </header>

        {/* Messages container - only this scrolls */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4" 
          style={{ 
            fontSize: `${chatPreferences.fontSize}px`,
            ...(currentWallpaper?.image_url 
              ? currentWallpaper.image_url.startsWith('http')
                ? {
                    backgroundImage: `url(${currentWallpaper.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }
                : {
                    background: currentWallpaper.image_url
                  }
              : {
                  background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--muted)/0.3) 100%)',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.03'/%3E%3C/svg%3E")`
                }
            )
          }}
        >
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
                  const currentDate = 'sent_at' in item ? new Date(item.sent_at) : new Date((item as RedEnvelope).created_at);
                  const prevDate = index > 0 
                    ? ('sent_at' in sortedItems[index - 1] ? new Date((sortedItems[index - 1] as Message).sent_at) : new Date((sortedItems[index - 1] as RedEnvelope).created_at))
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
                  
                  // Look back to find previous message from same sender
                  let prevMessage: Message | null = null;
                  for (let i = index - 1; i >= 0; i--) {
                    if (itemsWithDividers[i].type !== 'red_envelope' && itemsWithDividers[i].type !== 'date_divider' && 'sender_id' in itemsWithDividers[i]) {
                      prevMessage = itemsWithDividers[i] as Message;
                      break;
                    }
                  }
                  const isGrouped = prevMessage?.sender_id === message.sender_id;

                  // Look forward to find next message to determine if this is last in group
                  let nextMessage: Message | null = null;
                  for (let i = index + 1; i < itemsWithDividers.length; i++) {
                    if (itemsWithDividers[i].type !== 'red_envelope' && itemsWithDividers[i].type !== 'date_divider' && 'sender_id' in itemsWithDividers[i]) {
                      nextMessage = itemsWithDividers[i] as Message;
                      break;
                    }
                  }
                  const isLastInGroup = nextMessage?.sender_id !== message.sender_id;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      isGrouped={isGrouped}
                      isLastInGroup={isLastInGroup}
                      isOnline={online}
                      onReply={handleReply}
                      onReaction={handleReaction}
                      onToggleAudio={() => message.audio_url && toggleAudio(message.id, message.audio_url)}
                      audioPlayerState={audioPlayers[message.id] || { isPlaying: false }}
                      onEdit={handleEditMessage}
                      bubbleStyle={chatPreferences.bubbleStyle as 'rounded' | 'square' | 'minimal'}
                      themeColors={currentTheme?.colors}
                      showReadReceipts={chatPreferences.readReceipts}
                      fontSize={chatPreferences.fontSize}
                    />
                  );
                });
              })()}
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <TypingIndicator userName={typingUsers[0]} />
              )}
            </>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Reply Preview - positioned above input */}
        {isMember && replyToMessage && !selectedFile && (
          <div className="flex-shrink-0 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-primary rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary truncate">
                  Replying to {replyToMessage.profiles?.display_name || 'User'}
                </p>
                <p className="text-sm text-foreground/80 truncate mt-0.5">
                  {replyToMessage.audio_url ? '🎤 Voice message' : replyToMessage.encrypted_content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted flex-shrink-0"
                onClick={() => setReplyToMessage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* File Upload Preview */}
        {isMember && selectedFile && (
          <FileUploadPreview
            file={selectedFile}
            onRemove={() => setSelectedFile(null)}
          />
        )}

        {/* Join Group Button for Non-Members */}
        {chatInfo?.is_group && !isMember && (
          <div className="flex-shrink-0 bg-card border-t border-border px-4 py-4 pb-[env(safe-area-inset-bottom)]">
            <Button
              onClick={handleJoinGroup}
              disabled={isJoining}
              className="w-full h-12 rounded-xl font-semibold"
            >
              {isJoining ? t('chat.joining') : t('chat.joinGroup')}
            </Button>
          </div>
        )}

        {/* Input: WhatsApp style - Fixed at bottom */}
        {isMember && (
          <div className="flex-shrink-0 bg-card border-t border-border px-2 py-2 pb-[env(safe-area-inset-bottom)]">
            <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
          />
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
            {recording ? (
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-card rounded-full border border-border">
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
                  {uploading ? <MicOff className="h-5 w-5 opacity-50" /> : <MicOff className="h-5 w-5" />}
                </Button>
              </div>
            ) : audioBlob ? (
              <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-card rounded-full border border-border">
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
                  {uploading ? <Send className="h-5 w-5 opacity-50" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            ) : (
              <>
                <Dialog open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full hover:bg-muted text-muted-foreground flex-shrink-0"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-full w-auto">
                    <EmojiPicker
                      onEmojiClick={(emojiData: EmojiClickData) => {
                        setNewMessage(prev => prev + emojiData.emoji);
                        setEmojiPickerOpen(false);
                      }}
                      searchDisabled
                      skinTonesDisabled
                      previewConfig={{ showPreview: false }}
                    />
                  </DialogContent>
                </Dialog>
                
                <div className="flex-1 bg-card rounded-full border border-border flex items-center px-3 gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder={selectedFile ? 'Add a caption...' : 'Message'}
                    className="flex-1 bg-transparent border-none h-10 text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-0 px-0"
                    disabled={sending}
                  />
                  {!newMessage.trim() && !selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground flex-shrink-0 p-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                {(newMessage.trim() || selectedFile) ? (
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
                    disabled={sending || uploadingFile}
                  >
                    {(sending || uploadingFile) ? <Send className="h-4 w-4 opacity-50" /> : <Send className="h-4 w-4" />}
                  </Button>
                ) : (
                  <>
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
                      className="h-10 w-10 rounded-full hover:bg-muted text-primary flex-shrink-0"
                      onClick={startRecording}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </>
            )}
          </form>
        </div>
        )}
      </div>

      {/* Group Settings Sheet */}
      {chatInfo?.is_group && (
        <GroupSettingsSheet
          isOpen={isGroupSettingsOpen}
          onClose={() => setIsGroupSettingsOpen(false)}
          chatId={chatId!}
          isAdmin={isGroupAdmin}
        />
      )}
    </TooltipProvider>
  );
};

export default ChatRoom;
