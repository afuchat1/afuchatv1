import { motion } from 'framer-motion';
import { Check, CheckCheck, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttachmentPreview } from './AttachmentPreview';
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { MessageActionsSheet } from './MessageActionsSheet';

// Helper function to parse message content with clickable links, mentions, and hashtags
const parseMessageContent = (content: string): React.ReactNode => {
  if (!content || typeof content !== 'string') return content;
  
  const combinedRegex = /(@[a-zA-Z0-9_-]+|#\w+|https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  const matches = Array.from(content.matchAll(combinedRegex));
  
  if (matches.length === 0) return content;
  
  matches.forEach((match, idx) => {
    const matchText = match[0];
    const index = match.index!;
    
    if (index > lastIndex) {
      parts.push(content.substring(lastIndex, index));
    }
    
    if (matchText.startsWith('@')) {
      const handle = matchText.substring(1);
      parts.push(
        <Link 
          key={`mention-${idx}`} 
          to={`/${handle}`} 
          className="text-blue-300 hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {matchText}
        </Link>
      );
    } else if (matchText.startsWith('#')) {
      const hashtag = matchText.substring(1);
      parts.push(
        <Link
          key={`hashtag-${idx}`}
          to={`/search?q=${encodeURIComponent(hashtag)}`}
          className="text-blue-300 hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {matchText}
        </Link>
      );
    } else {
      // It's a URL (either with http/https or a plain domain)
      const url = matchText.startsWith('http') ? matchText : `https://${matchText}`;
      parts.push(
        <a
          key={`url-${idx}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {matchText.length > 40 ? matchText.substring(0, 40) + '...' : matchText}
        </a>
      );
    }
    
    lastIndex = index + matchText.length;
  });

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }
  
  return <>{parts}</>;
};

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
  reply_to_message?: Array<{
    audio_url?: string;
    encrypted_content: string;
    sender_id?: string;
    profiles?: {
      display_name: string;
      avatar_url?: string | null;
    };
  }>;
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
  onDelete?: (messageId: string) => void;
  bubbleStyle?: 'rounded' | 'square' | 'minimal';
  themeColors?: { primary: string; secondary: string; accent: string };
  showReadReceipts?: boolean;
  fontSize?: number;
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
  onDelete,
  bubbleStyle = 'rounded',
  themeColors,
  showReadReceipts = true,
  fontSize = 16,
}: MessageBubbleProps) => {
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const time = new Date(message.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isVoice = !!message.audio_url;
  const hasAttachment = !!message.attachment_url;
  
  // Check read/delivered status for own messages
  const hasStatus = message.message_status && message.message_status.length > 0;
  const allRead = hasStatus && message.message_status!.every(s => s.read_at);
  const anyDelivered = hasStatus && message.message_status!.some(s => s.delivered_at);
  
  // Check if message can be edited (within 15 minutes)
  const canEdit = isOwn && !isVoice && !hasAttachment && message.sent_at && 
    (Date.now() - new Date(message.sent_at).getTime()) < 15 * 60 * 1000;

  // Dynamic bubble border radius based on style
  const getBubbleRadius = () => {
    if (bubbleStyle === 'square') {
      // Square style - consistent rounded corners
      if (isLastInGroup) {
        return isOwn ? 'rounded-lg rounded-br-sm' : 'rounded-lg rounded-bl-sm';
      }
      return 'rounded-lg';
    }
    
    if (bubbleStyle === 'minimal') {
      // Minimal style - subtle corners
      if (isLastInGroup) {
        return isOwn ? 'rounded-md rounded-br-none' : 'rounded-md rounded-bl-none';
      }
      return 'rounded-md';
    }
    
    // Default rounded style - smooth, WhatsApp-like
    if (isLastInGroup) {
      return isOwn ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md';
    }
    return 'rounded-2xl';
  };

  // Get theme color from database or fallback to default
  const getThemeColor = () => {
    if (themeColors?.primary) {
      return themeColors.primary;
    }
    return 'hsl(var(--primary))';
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
      toast.error('Download failed');
    }
  };

  // Long press handlers for mobile
  const handleTouchStart = useCallback(() => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setActionsSheetOpen(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setActionsSheetOpen(true);
  }, []);

  // Find the message being replied to (if any)
  // Supabase returns reply_to_message as an array - get first element if exists
  const replyData = Array.isArray(message.reply_to_message) 
    ? message.reply_to_message[0] 
    : message.reply_to_message;
  const repliedMessage = replyData?.encrypted_content ? replyData : null;


  const ReadStatus = () => {
    if (!isOwn || !showReadReceipts) return null;
    
    // No status entries yet = just sent (single gray check)
    if (!hasStatus) {
      return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    
    // All recipients have read = double colored check
    if (allRead) {
      return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
    }
    
    // At least one delivered = double gray check
    if (anyDelivered) {
      return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    
    // Has status but not delivered yet = single check
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <>
    <motion.div
      drag="x"
      dragConstraints={{ left: isOwn ? -60 : 0, right: isOwn ? 0 : 60 }}
      dragElastic={0.1}
      dragSnapToOrigin
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      style={{ touchAction: 'pan-y' }}
      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} ${
        isLastInGroup ? 'mb-1' : 'mb-px'
      }`}
    >
      <div
        className={`${
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        } ${getBubbleRadius()} max-w-[85%] overflow-hidden`}
      >
        {repliedMessage && (
          <div className={`px-2 pt-1.5 pb-1 border-l-2 ${isOwn ? 'border-primary-foreground/50 bg-primary-foreground/10' : 'border-primary/50 bg-primary/10'} mx-1 mt-1 rounded-r`}>
            <p className="text-xs opacity-80 line-clamp-2">
              {repliedMessage.audio_url ? '🎤 Voice message' : repliedMessage.encrypted_content}
            </p>
          </div>
        )}
        {hasAttachment ? (
          <>
            <AttachmentPreview
              url={message.attachment_url!}
              type={message.attachment_type || ''}
              name={message.attachment_name || 'Attachment'}
              size={message.attachment_size}
              isOwn={isOwn}
              onDownload={handleDownload}
            />
            {message.encrypted_content && (
              <p className="px-2 py-1 leading-snug whitespace-pre-wrap break-words" style={{ fontSize: `${fontSize}px` }}>
                {parseMessageContent(message.encrypted_content)}
              </p>
            )}
            <div className="flex items-center gap-0.5 px-2 pb-1 justify-end">
              <span className="text-[10px] opacity-70">{time}</span>
              <ReadStatus />
            </div>
          </>
        ) : isVoice ? (
          <div className="flex items-center gap-2 pl-1.5 pr-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full flex-shrink-0 ${
                isOwn ? 'hover:bg-primary-foreground/20' : 'hover:bg-primary/10'
              }`}
              onClick={onToggleAudio}
            >
              {audioPlayerState?.isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 ml-0.5" />
              )}
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-[80px]">
              <div className="h-0.5 flex-1 bg-current opacity-30 rounded-full" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] opacity-70">{time}</span>
              <ReadStatus />
            </div>
          </div>
        ) : (
          <div className="px-2 py-1">
            <span className="leading-snug whitespace-pre-wrap break-words" style={{ fontSize: `${fontSize}px` }}>
              {parseMessageContent(message.encrypted_content)}
            </span>
            <span className="inline-flex items-center gap-0.5 ml-1.5 align-bottom float-right translate-y-0.5">
              <span className="text-[10px] opacity-70">{time}</span>
              <ReadStatus />
            </span>
          </div>
        )}
      </div>
    </motion.div>

    <MessageActionsSheet
      open={actionsSheetOpen}
      onOpenChange={setActionsSheetOpen}
      message={message}
      isOwn={isOwn}
      onReply={() => onReply(message)}
      onReaction={(emoji) => onReaction(message.id, emoji)}
      onEdit={(newContent) => onEdit?.(message.id, newContent)}
      onDelete={() => onDelete?.(message.id)}
    />
    </>
  );
};
