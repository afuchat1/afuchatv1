import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAITranslation } from '@/hooks/useAITranslation';
import { MessageSquare } from 'lucide-react';

interface Reply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_reply_id?: string | null;
  is_pinned?: boolean;
  pinned_by?: string | null;
  pinned_at?: string | null;
  nested_replies?: Reply[];
  profiles: {
    display_name: string;
    handle: string;
    is_verified: boolean;
    is_organization_verified: boolean;
    avatar_url?: string | null;
  };
}

interface NestedReplyItemProps {
  reply: Reply;
  depth: number;
  handleViewProfile: (id: string) => void;
  onReplyToReply: (parentReplyId: string, content: string) => void;
  onPinReply: (replyId: string, currentPinnedState: boolean) => void;
  onDeleteReply: (replyId: string) => void;
  isPostAuthor: boolean;
  currentUserId?: string;
  parsePostContent: (content: string, navigate: any) => React.ReactNode;
  formatTime: (time: string) => string;
  UserAvatarSmall: React.ComponentType<{
    userId: string;
    name: string;
    avatarUrl?: string | null;
  }>;
  VerifiedBadge: React.ComponentType<{
    isVerified: boolean;
    isOrgVerified: boolean;
  }>;
}

export const NestedReplyItem = ({
  reply,
  depth,
  handleViewProfile,
  onReplyToReply,
  onPinReply,
  onDeleteReply,
  isPostAuthor,
  currentUserId,
  parsePostContent,
  formatTime,
  UserAvatarSmall,
  VerifiedBadge,
}: NestedReplyItemProps) => {
  const { i18n, t } = useTranslation();
  const { translateText } = useAITranslation();
  const navigate = useNavigate();
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const maxDepth = 3; // Limit nesting to prevent too deep threads

  const handleTranslate = async () => {
    if (translatedContent) {
      setTranslatedContent(null);
      return;
    }
    setIsTranslating(true);
    const translated = await translateText(reply.content, i18n.language);
    setTranslatedContent(translated);
    setIsTranslating(false);
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      // Append mention at the end
      const mention = `@${reply.profiles.handle}`;
      const finalContent = `${replyText.trim()} ${mention}`;
      onReplyToReply(reply.id, finalContent);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const displayContent = translatedContent || reply.content;
  const leftMargin = Math.min(depth * 16, 48); // Cap the left margin

  return (
    <div style={{ marginLeft: `${leftMargin}px` }} className={`pt-2 pb-1 ${reply.is_pinned ? 'bg-primary/5' : ''} pl-2`}>
      {reply.is_pinned && (
        <div className="text-[9px] sm:text-[10px] text-primary font-medium mb-1 flex items-center gap-1">
          📌 Pinned by author
        </div>
      )}
      <div className="flex">
        <div
          className="mr-1.5 sm:mr-2 flex-shrink-0 cursor-pointer"
          onClick={() => handleViewProfile(reply.author_id)}
        >
          <UserAvatarSmall 
            userId={reply.author_id} 
            name={reply.profiles.display_name}
            avatarUrl={reply.profiles.avatar_url}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-1 min-w-0">
            <span
              className="font-bold text-foreground text-[10px] sm:text-xs cursor-pointer hover:underline whitespace-nowrap"
              onClick={() => handleViewProfile(reply.author_id)}
            >
              {reply.profiles.display_name}
            </span>
            <VerifiedBadge isVerified={reply.profiles.is_verified} isOrgVerified={reply.profiles.is_organization_verified} />

            <span
              className="text-muted-foreground text-[10px] sm:text-xs hover:underline cursor-pointer truncate flex-shrink min-w-0"
              onClick={() => handleViewProfile(reply.author_id)}
            >
              @{reply.profiles.handle}
            </span>
            <span className="text-muted-foreground text-[10px] sm:text-xs flex-shrink-0">·</span>
            <span className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0">
              {formatTime(reply.created_at)}
            </span>
          </div>

          <p className="text-foreground text-xs leading-snug whitespace-pre-wrap break-words mt-0.5">
            {parsePostContent(displayContent, navigate)}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {i18n.language !== 'en' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary p-0 h-auto"
              >
                {isTranslating ? t('common.translating') : translatedContent ? t('common.showOriginal') : t('common.translate')}
              </Button>
            )}
            
            {depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyInput(!showReplyInput);
                  if (!showReplyInput) {
                    setReplyText(`@${reply.profiles.handle} `);
                  }
                }}
                className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary p-0 h-auto flex items-center gap-1"
              >
                <MessageSquare className="h-3 w-3" />
                Reply
              </Button>
            )}
            
            {isPostAuthor && depth === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPinReply(reply.id, reply.is_pinned || false)}
                className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary p-0 h-auto"
              >
                {reply.is_pinned ? '📌 Unpin' : '📌 Pin'}
              </Button>
            )}
            
            {currentUserId && (currentUserId === reply.author_id || isPostAuthor) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Delete this comment?')) {
                    onDeleteReply(reply.id);
                  }
                }}
                className="text-[10px] sm:text-xs text-red-500 hover:text-red-600 p-0 h-auto"
              >
                Delete
              </Button>
            )}
          </div>

          {showReplyInput && (
            <div className="mt-2 flex items-center gap-1.5">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleReplySubmit();
                }}
                placeholder={t('feed.replyTo', { name: reply.profiles.display_name })}
                className="flex-1 bg-transparent border-b border-input text-[10px] sm:text-xs text-foreground focus:outline-none focus:ring-0 focus:border-primary p-1"
              />
              <Button
                size="sm"
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="h-6 px-2 text-[10px]"
              >
                Post
              </Button>
            </div>
          )}

          {/* Render nested replies */}
          {reply.nested_replies && reply.nested_replies.length > 0 && (
            <div className="mt-1">
              {reply.nested_replies.map((nestedReply) => (
                <NestedReplyItem
                  key={nestedReply.id}
                  reply={nestedReply}
                  depth={depth + 1}
                  handleViewProfile={handleViewProfile}
                  onReplyToReply={onReplyToReply}
                  onPinReply={onPinReply}
                  onDeleteReply={onDeleteReply}
                  isPostAuthor={isPostAuthor}
                  currentUserId={currentUserId}
                  parsePostContent={parsePostContent}
                  formatTime={formatTime}
                  UserAvatarSmall={UserAvatarSmall}
                  VerifiedBadge={VerifiedBadge}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
