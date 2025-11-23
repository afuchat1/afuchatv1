import { motion } from 'framer-motion';
import { Check, CheckCheck, Play, Pause, Volume2, Smile, Reply, Pencil, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AttachmentPreview } from './AttachmentPreview';
import { useState } from 'react';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { VerifiedBadge } from '@/components/VerifiedBadge';

export interface Reaction {
  reaction: string;
}

export interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
  sender_id: string;
  sent_at: string;
  edited_at?: string | null;
  reply_to_message_id?: string | null;
  message_reactions?: Reaction[];
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

// --- Helper to aggregate reactions ---
const aggregateReactions = (reactions: Reaction[]) => {
  if (!reactions || reactions.length === 0) return [];
  const counts = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
};

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isGrouped: boolean; // Is it part of a group of messages?
  isLastInGroup: boolean; // Is it the last message in a group?
  isOnline: boolean; // (Simulated)
  onReply: (message: Message) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleAudio: () => void;
  audioPlayerState: { isPlaying: boolean };
  onEdit?: (messageId: string, newContent: string) => void;
  bubbleStyle?: 'rounded' | 'square' | 'minimal';
  chatTheme?: string;
  showReadReceipts?: boolean;
}

export const MessageBubble = ({
  message,
  isOwn,
  isGrouped,
  isLastInGroup,
  isOnline,
  onReply,
  onReaction,
  onToggleAudio,
  audioPlayerState,
  onEdit,
  bubbleStyle = 'rounded',
  chatTheme = 'teal',
  showReadReceipts = true,
}: MessageBubbleProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const time = new Date(message.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isVoice = !!message.audio_url;
  const hasAttachment = !!message.attachment_url;
  
  // Check read status for own messages
  const allRead = showReadReceipts && isOwn && message.message_status && message.message_status.every(s => s.read_at);
  const anyDelivered = showReadReceipts && isOwn && message.message_status && message.message_status.some(s => s.delivered_at);
  
  // Check if message can be edited (within 15 minutes)
  const canEdit = isOwn && !isVoice && !hasAttachment && message.sent_at && 
    (Date.now() - new Date(message.sent_at).getTime()) < 15 * 60 * 1000;

  // Dynamic bubble border radius based on style
  const getBubbleRadius = () => {
    if (bubbleStyle === 'square') return 'rounded-md';
    if (bubbleStyle === 'minimal') return 'rounded-sm';
    
    // Default rounded style
    if (isLastInGroup) {
      return isOwn ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md';
    }
    return 'rounded-2xl';
  };

  // Theme color mapping
  const getThemeColor = () => {
    const themes: Record<string, string> = {
      teal: 'hsl(174, 72%, 42%)',
      purple: 'hsl(271, 76%, 53%)',
      blue: 'hsl(217, 91%, 60%)',
      pink: 'hsl(340, 82%, 52%)',
      green: 'hsl(142, 76%, 36%)',
      orange: 'hsl(24, 95%, 53%)',
    };
    return themes[chatTheme] || themes.teal;
  };

  // Swipe-to-reply gesture
  const handleDragEnd = (event: any, info: any) => {
    if (!isOwn && info.offset.x > 80) {
      onReply(message);
    } else if (isOwn && info.offset.x < -80) {
      onReply(message);
    }
  };

  const handleDownload = async () => {
    if (!message.attachment_url) return;
    
    try {
      const response = await fetch(message.attachment_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.attachment_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Find the message being replied to (if any)
  // In a real app, this might be fetched or passed in
  const repliedMessage = message.reply_to_message;


  const ReactionButton = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-muted"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 border-border/50 shadow-lg">
        <div className="flex gap-1">
          {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-xl p-0 hover:bg-muted rounded-lg transition-colors"
              onClick={() => onReaction(message.id, emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  const ReactionDisplay = () => {
    const aggregated = aggregateReactions(message.message_reactions || []);
    if (aggregated.length === 0) return null;
    return (
      <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {aggregated.map(({ emoji, count }) => (
          <Badge 
            key={emoji} 
            variant="secondary" 
            className="rounded-full px-2 py-0.5 text-xs border border-border/50 shadow-sm"
          >
            {emoji} {typeof count === 'number' && count > 1 && <span className="ml-1 opacity-70">{count}</span>}
          </Badge>
        ))}
      </div>
    );
  };
  
  const ReadStatus = () => {
    if (!isOwn || !showReadReceipts) return null;
    
    if (allRead) {
      return <CheckCheck className="h-3.5 w-3.5 text-accent" />;
    } else if (anyDelivered) {
      return <CheckCheck className="h-3.5 w-3.5 opacity-60" />;
    }
    return <Check className="h-3.5 w-3.5 opacity-60" />;
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: isOwn ? -100 : 0, right: isOwn ? 0 : 100 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className={`flex w-full group ${isOwn ? 'justify-end' : 'justify-start'} relative ${
        isLastInGroup ? 'mb-2' : 'mb-0.5'
      }`}
    >
      <div className={`flex items-end gap-1.5 max-w-[75%] sm:max-w-[65%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* --- Avatar --- */}
        {!isOwn && (
          isLastInGroup ? (
            <div className="mb-0.5">
              <Avatar name={message.profiles?.display_name || 'User'} userId={message.sender_id} />
            </div>
          ) : (
            <div className="w-8 flex-shrink-0" />
          )
        )}
        
        {/* --- Message Container --- */}
        <div className="flex flex-col min-w-0">
          <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* --- Message Bubble --- */}
            <div
              className={`${
                isOwn
                  ? 'text-primary-foreground shadow-sm'
                  : 'bg-muted text-foreground shadow-sm'
              } ${getBubbleRadius()}`}
              style={isOwn ? { backgroundColor: getThemeColor() } : {}}
            >
              {/* --- Reply Preview --- */}
              {repliedMessage && (
                <div className={`px-3 py-2 mb-1 border-l-2 ${
                  isOwn ? 'border-primary-foreground/40 bg-primary-foreground/10' : 'border-primary bg-muted/50'
                }`}>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs truncate ${
                      isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {repliedMessage.audio_url ? '🎤 Voice message' : repliedMessage.encrypted_content}
                    </span>
                  </div>
                </div>
              )}
              
              {/* --- Main Content (Text or Voice or Attachment) --- */}
              {hasAttachment ? (
                <div className="p-2">
                  <AttachmentPreview
                    url={message.attachment_url!}
                    type={message.attachment_type || ''}
                    name={message.attachment_name || 'Attachment'}
                    size={message.attachment_size}
                    isOwn={isOwn}
                    onDownload={message.attachment_type?.startsWith('image/') 
                      ? () => setLightboxOpen(true)
                      : handleDownload
                    }
                  />
                  {message.encrypted_content && (
                    <div className="px-2 py-2 mt-1">
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {message.encrypted_content}
                      </p>
                    </div>
                  )}
                </div>
              ) : isVoice ? (
                <div className="flex items-center gap-3 px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-full flex-shrink-0 ${
                      isOwn ? 'hover:bg-primary-foreground/20' : 'hover:bg-primary/10'
                    }`}
                    onClick={onToggleAudio}
                  >
                    {audioPlayerState?.isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-1 flex-1 bg-current opacity-20 rounded-full">
                      <div className="h-full w-1/3 bg-current opacity-60 rounded-full" />
                    </div>
                    <span className="text-xs opacity-60">0:42</span>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2">
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                    {message.encrypted_content}
                  </p>
                </div>
              )}
              
              {/* --- Timestamp & Status --- */}
              <div className={`flex items-center justify-end gap-1 px-3 pb-1.5 ${isVoice ? 'mt-0' : '-mt-1'}`}>
                {message.edited_at && (
                  <span className="text-[11px] opacity-50">edited</span>
                )}
                <span className="text-[11px] opacity-60">{time}</span>
                <ReadStatus />
              </div>
            </div>
            
            {/* --- Action Buttons --- */}
            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              isOwn ? 'flex-row-reverse' : 'flex-row'
            }`}>
              {canEdit && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-0 rounded-full hover:bg-muted"
                  onClick={() => {
                    const newContent = prompt('Edit message:', message.encrypted_content);
                    if (newContent && newContent.trim() && newContent !== message.encrypted_content) {
                      onEdit(message.id, newContent.trim());
                    }
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              <ReactionButton />
            </div>
          </div>

          {/* --- Reactions --- */}
          <ReactionDisplay />
        </div>
      </div>
      
      {/* Image Lightbox */}
      {lightboxOpen && hasAttachment && message.attachment_type?.startsWith('image/') && (
        <ImageLightbox
          images={[{ url: message.attachment_url!, alt: message.attachment_name || 'Image' }]}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </motion.div>
  );
};
