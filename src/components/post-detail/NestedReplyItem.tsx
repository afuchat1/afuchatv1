import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import React from 'react';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  parent_reply_id: string | null;
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
  VerifiedBadge,
  renderContentWithMentions,
}: NestedReplyItemProps) => {
  const { t, i18n } = useTranslation();
  const shouldShowReplyButton = depth < MAX_DEPTH;

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
      <div className="p-4 border-b border-border hover:bg-muted/50 transition-colors">
        <div className="flex items-start gap-3">
              <UserAvatar
                userId={reply.author.handle}
                avatarUrl={reply.author.avatar_url}
                name={reply.author.display_name}
                size={40}
              />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <Link 
                  to={`/profile/${reply.author.handle}`} 
                  className="font-bold hover:underline truncate"
                >
                  {reply.author.display_name}
                </Link>
                <VerifiedBadge 
                  isVerified={reply.author.is_verified} 
                  isOrgVerified={reply.author.is_organization_verified} 
                />
                <span className="text-sm text-muted-foreground ml-2 truncate">
                  @{reply.author.handle}
                </span>
              </div>
              <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                {new Date(reply.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            
            <p className="text-foreground mt-1 whitespace-pre-wrap">
              {renderContentWithMentions(translatedReplies[reply.id] || reply.content)}
            </p>
            
            <div className="flex gap-2 mt-2">
              {i18n.language !== 'en' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTranslate(reply.id, reply.content)}
                  className="text-xs text-muted-foreground hover:text-primary p-0 h-auto"
                >
                  {translatedReplies[reply.id] ? t('common.showOriginal') : t('common.translate')}
                </Button>
              )}
              
              {shouldShowReplyButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReplyClick(reply.id, reply.author.handle)}
                  className="text-xs text-muted-foreground hover:text-primary p-0 h-auto"
                >
                  {t('feed.replyTo', 'Reply')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {reply.nested_replies && reply.nested_replies.length > 0 && (
        <div className="border-l-2 border-border/50 ml-6">
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
