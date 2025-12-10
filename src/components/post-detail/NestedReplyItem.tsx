import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { MessageCircle, Pin, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  parent_reply_id: string | null;
  is_pinned?: boolean;
  pinned_by?: string | null;
  pinned_at?: string | null;
  author: {
    display_name: string;
    handle: string;
    is_verified: boolean;
    is_organization_verified: boolean;
    avatar_url: string | null;
  };
  nested_replies?: Reply[];
}

interface NestedReplyItemProps {
  reply: Reply;
  depth?: number;
  onTranslate: (replyId: string, content: string) => void;
  translatedReplies: { [key: string]: string };
  onReplyClick: (replyId: string, authorHandle: string) => void;
  onPinReply?: (replyId: string, currentPinnedState: boolean) => void;
  onDeleteReply?: (replyId: string) => void;
  isPostAuthor?: boolean;
  currentUserId?: string;
  VerifiedBadge: React.ComponentType<{ isVerified?: boolean; isOrgVerified?: boolean }>;
  renderContentWithMentions: (content: string) => React.ReactNode;
}

const MAX_DEPTH = 3;

export const NestedReplyItem = ({
  reply,
  depth = 0,
  onTranslate,
  translatedReplies,
  onReplyClick,
  onPinReply,
  onDeleteReply,
  isPostAuthor,
  currentUserId,
  VerifiedBadge,
  renderContentWithMentions,
}: NestedReplyItemProps) => {
  const { t, i18n } = useTranslation();
  const shouldShowReplyButton = depth < MAX_DEPTH;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={cn(
      "relative",
      depth > 0 && "ml-10 mt-2"
    )}>
      {/* Thread line for nested replies */}
      {depth > 0 && (
        <div className="absolute left-[-20px] top-0 bottom-0 w-[2px] bg-border" />
      )}
      
      <div className={cn(
        "py-3 px-4 rounded-xl transition-colors",
        reply.is_pinned ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50",
        depth > 0 && "bg-muted/30"
      )}>
        {/* Pinned indicator */}
        {reply.is_pinned && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
            <Pin className="h-3 w-3" />
            <span>Pinned by author</span>
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <Link to={`/${reply.author.handle}`} className="flex-shrink-0">
            <UserAvatar
              userId={reply.author.handle}
              avatarUrl={reply.author.avatar_url}
              name={reply.author.display_name}
              size={depth === 0 ? 40 : 32}
            />
          </Link>
          
          <div className="flex-1 min-w-0">
            {/* Header with name, handle, time */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                to={`/${reply.author.handle}`} 
                className="font-bold text-base hover:underline truncate max-w-[120px]"
                title={reply.author.display_name}
              >
                {reply.author.display_name.length > 12 ? `${reply.author.display_name.slice(0, 10)}...` : reply.author.display_name}
              </Link>
              <VerifiedBadge 
                isVerified={reply.author.is_verified} 
                isOrgVerified={reply.author.is_organization_verified} 
              />
              <span className="text-xs text-muted-foreground">
                @{reply.author.handle}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(reply.created_at)}
              </span>
            </div>
            
            {/* Content */}
            <div className="mt-1.5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {renderContentWithMentions(translatedReplies[reply.id] || (typeof reply.content === 'string' ? reply.content : String(reply.content || '')))}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1 mt-2">
              {shouldShowReplyButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReplyClick(reply.id, reply.author.handle)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Reply
                </Button>
              )}
              
              {i18n.language !== 'en' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTranslate(reply.id, reply.content)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                >
                  {translatedReplies[reply.id] ? t('common.showOriginal') : t('common.translate')}
                </Button>
              )}
              
              {onPinReply && isPostAuthor && depth === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPinReply(reply.id, reply.is_pinned || false)}
                  className={cn(
                    "h-7 px-2 text-xs gap-1",
                    reply.is_pinned ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Pin className="h-3.5 w-3.5" />
                  {reply.is_pinned ? 'Unpin' : 'Pin'}
                </Button>
              )}
              
              {onDeleteReply && currentUserId && (currentUserId === reply.author.handle || isPostAuthor) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this comment?')) {
                      onDeleteReply(reply.id);
                    }
                  }}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {reply.nested_replies && reply.nested_replies.length > 0 && (
        <div className="relative">
          {reply.nested_replies.map(nestedReply => (
            <NestedReplyItem
              key={nestedReply.id}
              reply={nestedReply}
              depth={depth + 1}
              onTranslate={onTranslate}
              translatedReplies={translatedReplies}
              onReplyClick={onReplyClick}
              VerifiedBadge={VerifiedBadge}
              renderContentWithMentions={renderContentWithMentions}
            />
          ))}
        </div>
      )}
    </div>
  );
};
