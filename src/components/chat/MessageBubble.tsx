import { motion } from 'framer-motion';
import { User, Check, CheckCheck, Play, Pause, Volume2, Smile, ArrowDownLeft } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface Reaction {
  reaction_emoji: string;
}

export interface Message {
  id: string;
  encrypted_content: string;
  audio_url?: string;
  sender_id: string;
  sent_at: string;
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
    acc[reaction.reaction_emoji] = (acc[reaction.reaction_emoji] || 0) + 1;
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
}

export const MessageBubble = ({
  message,
  isOwn,
  isGrouped,
  isOnline,
  onReply,
  onReaction,
  onToggleAudio,
  audioPlayerState
}: MessageBubbleProps) => {
  const time = new Date(message.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isVoice = !!message.audio_url;

  // Find the message being replied to (if any)
  // In a real app, this might be fetched or passed in
  const repliedMessage = message.reply_to_message;

  const MessageContent = () => (
    <>
      {/* --- Reply Preview --- */}
      {repliedMessage && (
        <div className="flex items-center gap-2 p-2 rounded-t-lg bg-black/10 dark:bg-white/10 pl-2">
          <ArrowDownLeft className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-primary truncate">
              {repliedMessage.profiles.display_name}
            </span>
            <span className="text-xs text-foreground/80 truncate">
              {repliedMessage.audio_url ? '[Voice Message]' : repliedMessage.encrypted_content}
            </span>
          </div>
        </div>
      )}
      
      {/* --- Main Content (Text or Voice) --- */}
      {isVoice ? (
        <div className="flex items-center gap-2 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onToggleAudio}
          >
            {audioPlayerState?.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Volume2 className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">Voice message</span>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap break-words p-2.5">
          {message.encrypted_content}
        </p>
      )}
    </>
  );

  const ReactionButton = () => (
    <Popover>
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
          {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-xl p-0 hover:bg-accent"
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
      <div className={`flex gap-1 ${isOwn ? 'justify-end' : ''} -mt-1`}>
        {aggregated.map(({ emoji, count }) => (
          <Badge key={emoji} variant="secondary">
            {emoji} {typeof count === 'number' && count > 1 && <span className="text-xs ml-1">{count}</span>}
          </Badge>
        ))}
      </div>
    );
  };
  
  // --- Read Status ---
  // This is a simulation. A real implementation would subscribe
  // to a `message_status` table to see `read_at` timestamps.
  const ReadStatus = () => {
    const isRead = isOnline; // Simulate: if user is online, they've read it
    if (isRead) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground/70" />;
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.1, right: isOwn ? 0 : 0.1 }}
      onDragEnd={(_, info) => {
        if (!isOwn && info.offset.x > 50) onReply(message);
        if (isOwn && info.offset.x < -50) onReply(message);
      }}
      className={`flex w-full py-0.5 group ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex items-end gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* --- Avatar --- */}
        {!isOwn && (
          isGrouped ? (
            <div className="w-8 flex-shrink-0" /> // Spacer
          ) : (
            <Avatar name={message.profiles.display_name} userId={message.sender_id} />
          )
        )}
        
        {/* --- Bubble & Reactions --- */}
        <div className="flex flex-col">
          <div className={`flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* --- Bubble --- */}
            <div
              className={`relative ${
                isOwn
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card'
              } max-w-full overflow-hidden
              ${isGrouped
                ? isOwn ? 'rounded-lg' : 'rounded-lg'
                : isOwn ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'
              }`}
            >
              {!isOwn && !isGrouped && (
                <span className="text-xs font-semibold text-primary px-2.5 pt-2">
                  {message.profiles.display_name}
                </span>
              )}
              <MessageContent />
              {/* --- Timestamp & Read Status (inside bubble for own) --- */}
              {isOwn && (
                <div className="flex items-center justify-end gap-1.5 px-2.5 pb-1.5 -mt-1">
                  <span className="text-xs text-primary-foreground/70">{time}</span>
                  <ReadStatus />
                </div>
              )}
            </div>
            
            {/* --- Reaction Button --- */}
            <ReactionButton />
          </div>

          {/* --- Timestamp (outside bubble for other) --- */}
          {!isOwn && (
             <span className="text-xs text-muted-foreground mt-1 px-1">{time}</span>
          )}

          {/* --- Reaction Display --- */}
          <ReactionDisplay />
        </div>
      </div>
    </motion.div>
  );
};
