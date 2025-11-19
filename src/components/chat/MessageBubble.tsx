import { motion } from 'framer-motion';
import { Check, CheckCheck, Play, Pause, Volume2, Smile, Reply, Pencil } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface Reaction {
  reaction: string;
}

export interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
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
  };
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
  isOnline: boolean; // (Simulated)
  onReply: (message: Message) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleAudio: () => void;
  audioPlayerState: { isPlaying: boolean };
  onEdit?: (messageId: string, newContent: string) => void;
}

export const MessageBubble = ({
  message,
  isOwn,
  isGrouped,
  isOnline,
  onReply,
  onReaction,
  onToggleAudio,
  audioPlayerState,
  onEdit
}: MessageBubbleProps) => {
  const time = new Date(message.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isVoice = !!message.audio_url;
  
  // Check if message can be edited (within 15 minutes)
  const canEdit = isOwn && !isVoice && message.sent_at && 
    (Date.now() - new Date(message.sent_at).getTime()) < 15 * 60 * 1000;

  // Swipe-to-reply gesture
  const handleDragEnd = (event: any, info: any) => {
    if (!isOwn && info.offset.x > 80) {
      onReply(message);
    } else if (isOwn && info.offset.x < -80) {
      onReply(message);
    }
  };

  // Find the message being replied to (if any)
  // In a real app, this might be fetched or passed in
  const repliedMessage = message.reply_to_message;

  const MessageContent = () => (
    <div className="flex flex-col">
      {/* --- Reply Preview --- */}
      {repliedMessage && (
        <div className={`flex items-start gap-2 px-3 py-2 mb-1 border-l-2 ${
          isOwn ? 'border-primary-foreground/30 bg-primary/10' : 'border-primary bg-muted/50'
        }`}>
          <Reply className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-xs font-medium truncate ${
              isOwn ? 'text-primary-foreground' : 'text-primary'
            }`}>
              {repliedMessage.profiles?.display_name || 'User'}
            </span>
            <span className={`text-xs truncate ${
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              {repliedMessage.audio_url ? '🎤 Voice message' : repliedMessage.encrypted_content}
            </span>
          </div>
        </div>
      )}
      
      {/* --- Main Content (Text or Voice) --- */}
      {isVoice ? (
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
        {isOwn && <ReadStatus />}
      </div>
    </div>
  );

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
    const isRead = isOnline;
    if (isRead) {
      return <CheckCheck className="h-3.5 w-3.5" />;
    }
    return <Check className="h-3.5 w-3.5 opacity-60" />;
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: isOwn ? -100 : 0, right: isOwn ? 0 : 100 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className={`flex w-full mb-1 group ${isOwn ? 'justify-end' : 'justify-start'} relative`}
    >
      {/* Swipe Reply Indicator */}
      <motion.div 
        className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'}`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0, scale: 0 }}
      >
        <Reply className="h-5 w-5 text-primary" />
      </motion.div>
      
      <div className={`flex items-end gap-1.5 max-w-[75%] sm:max-w-[65%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* --- Avatar --- */}
        {!isOwn && (
          isGrouped ? (
            <div className="w-8 flex-shrink-0" />
          ) : (
            <div className="mb-0.5">
              <Avatar name={message.profiles?.display_name || 'User'} userId={message.sender_id} />
            </div>
          )
        )}
        
        {/* --- Message Container --- */}
        <div className="flex flex-col min-w-0">
          {/* --- Name (for incoming, non-grouped) --- */}
          {!isOwn && !isGrouped && (
            <span className="text-xs font-medium text-primary mb-1 px-1">
              {message.profiles?.display_name || 'User'}
            </span>
          )}
          
          <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* --- Message Bubble --- */}
            <div
              className={`relative ${
                isOwn
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              } ${
                isGrouped
                  ? 'rounded-3xl'
                  : isOwn 
                    ? 'rounded-3xl rounded-br-md' 
                    : 'rounded-3xl rounded-bl-md'
              }`}
            >
              <MessageContent />
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
    </motion.div>
  );
};
