import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageSquare, Heart, Share, Ellipsis, Sparkles, Gift } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useXP } from '@/hooks/useXP';
import { useAITranslation } from '@/hooks/useAITranslation';
import PostActionsSheet from '@/components/PostActionsSheet';
import DeletePostSheet from '@/components/DeletePostSheet';
import ReportPostSheet from '@/components/ReportPostSheet';
import { EditPostModal } from '@/components/EditPostModal';
import { NestedReplyItem } from '@/components/feed/NestedReplyItem';
import { DefaultAvatar } from '@/components/avatar/DefaultAvatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { SendGiftDialog } from '@/components/gifts/SendGiftDialog';
import { ReadMoreText } from '@/components/ui/ReadMoreText';
import { TipButton } from '@/components/tips/TipButton';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { LinkPreviewCard } from '@/components/ui/LinkPreviewCard';
import { MentionInput } from '@/components/MentionInput';
import { VerifiedBadge } from '@/components/VerifiedBadge';

// --- INTERFACES ---

// NEW: Define AuthUser interface for type safety (must match the one in PostActionsSheet.tsx)
interface AuthUser {
    id: string;
    user_metadata: {
        display_name?: string;
        handle?: string;
        is_verified?: boolean;
        is_organization_verified?: boolean;
    }
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  image_url: string | null;
  post_images?: Array<{ image_url: string; display_order: number; alt_text?: string }>;
  post_link_previews?: Array<{
    url: string;
    title?: string | null;
    description?: string | null;
    image_url?: string | null;
    site_name?: string | null;
  }>;
  profiles: {
    display_name: string;
    handle: string;
    is_verified: boolean;
    is_organization_verified: boolean;
    is_affiliate: boolean;
    avatar_url?: string | null;
  };
  replies: Reply[];
  like_count: number;
  reply_count: number;
  has_liked: boolean;
}

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
    is_affiliate: boolean;
    avatar_url?: string | null;
  };
}


// --- UTILITY FUNCTIONS (Unchanged) ---
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const parsePostContent = (content: string, postId: string, navigate: ReturnType<typeof useNavigate>) => {
  const lookupAndNavigateByHandle = async (handle: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single();

    if (error || !data) {
      toast.error(`Could not find profile for @${handle}`);
      console.error(error);
      return;
    }

    navigate(`/profile/${data.id}`); 
  };
  
  // First process mentions, then process hashtags and links (including plain domains)
  const combinedRegex = /(@[a-zA-Z0-9_-]+|#\w+|https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  
  const matches = Array.from(content.matchAll(combinedRegex));
  
  matches.forEach((match, idx) => {
    const matchText = match[0];
    const index = match.index!;
    
    if (index > lastIndex) {
      parts.push(content.substring(lastIndex, index));
    }
    
    if (matchText.startsWith('@')) {
      const handle = matchText.substring(1);
      const MentionComponent = (
        <span
          key={`mention-${idx}`}
          className="text-blue-500 font-medium cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation(); 
            lookupAndNavigateByHandle(handle); 
          }}
        >
          {matchText}
        </span>
      );
      parts.push(MentionComponent);
    } else if (matchText.startsWith('#')) {
      const hashtag = matchText.substring(1);
      parts.push(
        <a
          key={`hashtag-${idx}`}
          href={`/search?q=${encodeURIComponent(hashtag)}`}
          className="text-primary hover:underline font-medium"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {matchText}
        </a>
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
          className="text-primary hover:underline"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {matchText.length > 50 ? matchText.substring(0, 50) + '...' : matchText}
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

// Avatar Display Components
const UserAvatarSmall = ({ userId, name, avatarUrl }: { userId: string; name: string; avatarUrl?: string | null }) => {
  const { avatarConfig, loading } = useUserAvatar(userId);

  if (loading) {
    return (
      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
    );
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return <DefaultAvatar name={name} size={28} className="flex-shrink-0" />;
};

const UserAvatarMedium = ({ userId, name, avatarUrl }: { userId: string; name: string; avatarUrl?: string | null }) => {
  const { avatarConfig, loading } = useUserAvatar(userId);

  if (loading) {
    return (
      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
    );
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return <DefaultAvatar name={name} size={40} className="flex-shrink-0" />;
};

// --- REPLY ITEM (Unchanged) ---

// --- REPLY ITEM (Updated with auto-translation) ---

const ReplyItem = ({ reply, navigate, handleViewProfile }: { reply: Reply; navigate: any; handleViewProfile: (id: string) => void }) => {
    const { i18n, t } = useTranslation();
    const { translateText } = useAITranslation();
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

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

    const displayContent = translatedContent || reply.content;

    return (
        <div className="flex pt-2 pb-1 relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border/80 ml-px mt-2.5 mb-1.5" />
            
            <div
                className="mr-1.5 sm:mr-2 flex-shrink-0 cursor-pointer z-10"
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
            <VerifiedBadge 
              isVerified={reply.profiles.is_verified}
              isOrgVerified={reply.profiles.is_organization_verified}
              isAffiliate={reply.profiles.is_affiliate}
            />

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
                    {parsePostContent(displayContent, reply.id, navigate)}
                </p>
                {i18n.language !== 'en' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="text-[10px] text-muted-foreground hover:text-primary mt-0.5 p-0 h-auto"
                    >
                        {isTranslating ? t('common.translating') : translatedContent ? t('common.showOriginal') : t('common.translate')}
                    </Button>
                )}
            </div>
        </div>
    );
};


// --- POST CARD (Updated to accept and pass through new props) ---

const PostCard = ({ post, addReply, user, navigate, onAcknowledge, onDeletePost, onReportPost, onEditPost, userProfile, expandedPosts, setExpandedPosts }:
  { 
      post: Post; 
      addReply: (postId: string, reply: Reply) => void; 
      user: AuthUser | null;
      navigate: any; 
      onAcknowledge: (postId: string, hasLiked: boolean) => void;
      onDeletePost: (postId: string) => void;
      onReportPost: (postId: string) => void;
      onEditPost: (postId: string) => void;
      userProfile: { display_name: string; avatar_url: string | null } | null;
      expandedPosts: Set<string>;
      setExpandedPosts: React.Dispatch<React.SetStateAction<Set<string>>>;
  }) => {

  const { t, i18n } = useTranslation();
  const { awardXP } = useXP();
  const { translateText } = useAITranslation();
  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(5);
  
  // Organize replies into a tree structure
  const organizeReplies = (replies: Reply[]): Reply[] => {
    const replyMap = new Map<string, Reply>();
    const topLevelReplies: Reply[] = [];

    // First pass: create reply objects with nested_replies arrays
    replies.forEach(reply => {
      replyMap.set(reply.id, { ...reply, nested_replies: [] });
    });

    // Second pass: organize into tree structure
    replies.forEach(reply => {
      const replyWithNested = replyMap.get(reply.id)!;
      if (reply.parent_reply_id && replyMap.has(reply.parent_reply_id)) {
        const parent = replyMap.get(reply.parent_reply_id)!;
        parent.nested_replies!.push(replyWithNested);
      } else {
        topLevelReplies.push(replyWithNested);
      }
    });

    // Sort: pinned replies first, then by creation date
    const sortReplies = (repliesToSort: Reply[]): Reply[] => {
      return repliesToSort.sort((a, b) => {
        // Pinned replies come first
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        // Otherwise sort by date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    };

    return sortReplies(topLevelReplies);
  };

  const organizedReplies = organizeReplies(post.replies || []);
  
  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleTranslate = async () => {
    if (translatedContent) {
      setTranslatedContent(null);
      return;
    }

    setIsTranslating(true);
    const translated = await translateText(post.content, i18n.language);
    setTranslatedContent(translated);
    setIsTranslating(false);
  };

  const handleAiTransfer = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const postDetails = {
      postId: post.id,
      postContent: post.content,
      postAuthorHandle: post.profiles.handle,
    };

    navigate('/ai-chat', { 
        state: { 
            context: 'post_analysis',
            postDetails: postDetails 
        } 
    });
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: `Check out this post by ${post.profiles.display_name}`,
      text: post.content.substring(0, 100) + '...',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      navigator.share(shareData).catch((error) => {
        console.error('Error sharing', error);
        // Fallback to copy
        navigator.clipboard.writeText(shareUrl).then(() => {
          toast.success(t('feed.linkCopied'));
        }).catch(() => {
          toast.error(t('feed.failedToCopy'));
        });
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success(t('feed.linkCopied'));
      }).catch(() => {
        toast.error(t('feed.failedToCopy'));
      });
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !user) {
      navigate('/auth');
      return;
    }

    const trimmedReplyText = replyText.trim();
    setReplyText(''); 

    const optimisticReply: Reply = {
      id: new Date().getTime().toString(),
      post_id: post.id,
      author_id: user.id,
      content: trimmedReplyText,
      created_at: new Date().toISOString(),
      parent_reply_id: null,
      nested_replies: [],
      profiles: {
        display_name: user?.user_metadata?.display_name || 'User',
        handle: user?.user_metadata?.handle || 'user',
        is_verified: user?.user_metadata?.is_verified || false,
        is_organization_verified: user?.user_metadata?.is_organization_verified || false,
        is_affiliate: false,
        avatar_url: userProfile?.avatar_url || null,
      },
    };
    addReply(post.id, optimisticReply);
    setShowComments(true);

    const { error } = await supabase.from('post_replies').insert({
      post_id: post.id,
      author_id: user.id,
      content: trimmedReplyText,
      parent_reply_id: null,
    });

    if (error) {
      toast.error('Failed to post reply');
      console.error(error);
    } else {
      // Award XP for creating a reply
      toast.success('Reply posted!');
      awardXP('create_reply', { post_id: post.id });
    }
  };

  const handleReplyToReply = async (parentReplyId: string, content: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('post_replies').insert({
      post_id: post.id,
      author_id: user.id,
      content: content,
      parent_reply_id: parentReplyId,
    });

    if (error) {
      toast.error('Failed to post reply');
      console.error(error);
      return;
    }

    // Refetch replies would happen through realtime subscription
    toast.success('Reply posted!');
    awardXP('create_reply', { post_id: post.id });
  };

  const handlePinReply = async (replyId: string, currentPinnedState: boolean) => {
    if (!user || user.id !== post.author_id) {
      toast.error('Only post authors can pin comments');
      return;
    }

    const { error } = await supabase
      .from('post_replies')
      .update({ 
        is_pinned: !currentPinnedState,
        pinned_by: !currentPinnedState ? user.id : null,
        pinned_at: !currentPinnedState ? new Date().toISOString() : null
      })
      .eq('id', replyId);

    if (error) {
      toast.error('Failed to update pin status');
      console.error(error);
      return;
    }

    toast.success(currentPinnedState ? 'Comment unpinned' : 'Comment pinned');
    
    // Update local state
    const updatedReplies = post.replies.map(r => 
      r.id === replyId 
        ? { ...r, is_pinned: !currentPinnedState, pinned_by: !currentPinnedState ? user.id : null, pinned_at: !currentPinnedState ? new Date().toISOString() : null }
        : r
    );
    
    // Update the post in the parent's state would typically happen via realtime
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user) {
      toast.error('Please sign in to delete');
      return;
    }

    const { error } = await supabase
      .from('post_replies')
      .delete()
      .eq('id', replyId);

    if (error) {
      toast.error('Failed to delete comment');
      console.error(error);
      return;
    }

    toast.success('Comment deleted');
    
    // Update local state by removing the reply
    const updatedReplies = post.replies.filter(r => r.id !== replyId);
    // Trigger parent refresh would happen via realtime
  };

  return (
    <div className="flex border-b border-border py-2 pl-0 pr-4 transition-colors hover:bg-muted/5">
      <div
        className="mr-2 sm:mr-3 flex-shrink-0 cursor-pointer ml-0.5 sm:ml-1"
        onClick={() => handleViewProfile(post.author_id)}
      >
        <UserAvatarMedium 
          userId={post.author_id} 
          name={post.profiles.display_name}
          avatarUrl={post.profiles.avatar_url}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-1 min-w-0">
            <span
              className="font-bold text-foreground text-xs sm:text-sm cursor-pointer hover:underline whitespace-nowrap"
              onClick={() => handleViewProfile(post.author_id)}
            >
              {post.profiles.display_name}
            </span>
            <VerifiedBadge 
              isVerified={post.profiles.is_verified}
              isOrgVerified={post.profiles.is_organization_verified}
              isAffiliate={post.profiles.is_affiliate}
            />

            <span
              className="text-muted-foreground text-[10px] sm:text-xs hover:underline cursor-pointer truncate flex-shrink min-w-0"
              onClick={() => handleViewProfile(post.author_id)}
            >
              @{post.profiles.handle}
            </span>

            <span className="text-muted-foreground text-[10px] sm:text-xs flex-shrink-0">·</span>
            <span className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0">
              {formatTime(post.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full flex-shrink-0" 
                title={t('feed.analyzePost')}
                onClick={handleAiTransfer}
            >
                <Sparkles className="h-4 w-4 text-primary/70" />
            </Button>
            
            {/* NEW: Use the external PostActionsSheet component */}
            <PostActionsSheet
                post={post}
                user={user}
                navigate={navigate}
                onDelete={onDeletePost}
                onReport={onReportPost}
                onEdit={onEditPost}
            />
          </div>
        </div>

        <Link 
          to={`/post/${post.id}`} 
          className="block"
        >
          <div className="text-foreground whitespace-pre-wrap">
            {expandedPosts.has(post.id) ? (
              <>
                {parsePostContent(translatedContent || post.content, post.id, navigate)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPosts(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(post.id);
                      return newSet;
                    });
                  }}
                  className="text-primary hover:text-primary/80 p-0 h-auto font-normal mt-1"
                >
                  Show less
                </Button>
              </>
            ) : (
              <>
                <div className="line-clamp-4">
                  {parsePostContent(translatedContent || post.content, post.id, navigate)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPosts(prev => new Set(prev).add(post.id));
                  }}
                  className="text-primary hover:text-primary/80 p-0 h-auto font-normal mt-1"
                >
                  Read more
                </Button>
              </>
            )}
          </div>
          {((post.post_images && post.post_images.length > 0) || post.image_url) && (
            <ImageCarousel 
              images={
                post.post_images && post.post_images.length > 0
                  ? post.post_images
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(img => ({ url: img.image_url, alt: img.alt_text || 'Post image' }))
                  : post.image_url 
                    ? [{ url: post.image_url, alt: 'Post image' }] 
                    : []
              }
              className="mt-2"
            />
          )}
          {post.post_link_previews && post.post_link_previews.length > 0 && (
            <div className="mt-2 space-y-2">
              {post.post_link_previews.map((preview, index) => (
                <LinkPreviewCard
                  key={index}
                  url={preview.url}
                  title={preview.title}
                  description={preview.description}
                  image_url={preview.image_url}
                  site_name={preview.site_name}
                />
              ))}
            </div>
          )}
          {i18n.language !== 'en' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleTranslate();
              }}
              disabled={isTranslating}
              className="text-xs text-muted-foreground hover:text-primary mt-1 p-0 h-auto"
            >
              {isTranslating ? t('common.translating') : translatedContent ? t('common.showOriginal') : t('common.translate')}
            </Button>
          )}
        </Link>


        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1 -ml-1.5 sm:-ml-2 max-w-full sm:max-w-[450px]">
          <Button variant="ghost" size="sm" className="flex items-center gap-0.5 sm:gap-1 group h-7 sm:h-8 px-2 sm:px-3" onClick={() => {
            if (!showComments && post.profiles.handle) {
              setReplyText(`@${post.profiles.handle} `);
            }
            setShowComments(!showComments);
          }}>
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:text-primary transition-colors" />
            <span className="group-hover:text-primary transition-colors text-[10px] sm:text-xs">{post.reply_count > 0 ? post.reply_count : ''}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-0.5 sm:gap-1 group h-7 sm:h-8 px-2 sm:px-3" onClick={() => onAcknowledge(post.id, post.has_liked)}>
            <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:text-red-500 transition-colors ${post.has_liked ? 'text-red-500 fill-red-500' : ''}`} />
            <span className={`group-hover:text-red-500 transition-colors text-[10px] sm:text-xs ${post.has_liked ? 'text-red-500' : ''}`}>{post.like_count > 0 ? post.like_count : ''}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-0.5 sm:gap-1 group h-7 sm:h-8 px-2 sm:px-3" onClick={handleShare}>
            <Share className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:text-primary transition-colors" />
          </Button>
          {user && user.id !== post.author_id && (
            <>
              <SendGiftDialog
                receiverId={post.author_id}
                receiverName={post.profiles.display_name}
                trigger={
                  <Button variant="ghost" size="sm" className="flex items-center gap-0.5 sm:gap-1 group h-7 sm:h-8 px-2 sm:px-3">
                    <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:text-pink-500 transition-colors" />
                  </Button>
                }
              />
              <TipButton
                receiverId={post.author_id}
                receiverName={post.profiles.display_name}
                postId={post.id}
                variant="ghost"
                size="sm"
                showLabel={false}
              />
            </>
          )}
        </div>

        <div className="mt-1 ml-[-8px] sm:ml-[-12px] pr-[8px] sm:pr-[12px]">
          {post.reply_count > 0 && !showComments && (
            <span
              className="text-[10px] sm:text-xs text-muted-foreground cursor-pointer hover:underline"
              onClick={() => setShowComments(true)}
            >
              {t('feed.viewComments', { count: post.reply_count })}
            </span>
          )}

          {showComments && post.replies && post.replies.length > 0 && (
            <div className="space-y-1 pt-2 border-l border-border/80 pl-3 sm:pl-4 ml-2 sm:ml-3"> 
              {organizedReplies.slice(0, visibleRepliesCount).map((reply) => (
                <NestedReplyItem
                  key={reply.id} 
                  reply={reply}
                  depth={0}
                  handleViewProfile={handleViewProfile}
                  onReplyToReply={handleReplyToReply}
                  onPinReply={handlePinReply}
                  onDeleteReply={handleDeleteReply}
                  isPostAuthor={user?.id === post.author_id}
                  currentUserId={user?.id}
                  parsePostContent={(content, postId) => parsePostContent(content, postId, navigate)}
                  formatTime={formatTime}
                  UserAvatarSmall={UserAvatarSmall}
                  VerifiedBadge={VerifiedBadge}
                />
              ))}
              {organizedReplies.length > visibleRepliesCount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleRepliesCount(prev => prev + 10)}
                  className="text-primary text-xs mt-2 hover:underline"
                >
                  {t('feed.loadMoreComments', { count: organizedReplies.length - visibleRepliesCount })}
                </Button>
              )}
            </div>
          )}

          {showComments && user && (
            <div className="mt-2 flex items-start gap-1.5 sm:gap-2">
              <div className="flex-shrink-0 mt-2">
                <UserAvatarSmall 
                  userId={user.id}
                  name={userProfile?.display_name || 'You'}
                  avatarUrl={userProfile?.avatar_url}
                />
              </div>
              <MentionInput
                value={replyText}
                onChange={setReplyText}
                mention={post.profiles.handle ? `@${post.profiles.handle}` : undefined}
                placeholder={t('feed.addComment')}
                className="flex-1 bg-transparent border-b border-input text-[10px] sm:text-xs text-foreground focus:outline-none focus:ring-0 focus:border-primary p-1 min-h-[32px]"
                onSubmit={handleReplySubmit}
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={!replyText.trim()}
                onClick={handleReplySubmit}
                className="text-primary font-bold disabled:text-muted-foreground disabled:opacity-70 p-0 text-[10px] sm:text-xs h-7 sm:h-8"
              >
                {t('feed.post')}
              </Button>
            </div>
          )}
          {showComments && !user && (
            <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground">
              {t('feed.signInToReply')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- FEED COMPONENT (Updated with new handlers) ---

const Feed = () => {
  const { t } = useTranslation();
  const { awardXP } = useXP();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceLoaded, setForceLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [userProfile, setUserProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const feedRef = useRef<HTMLDivElement>(null);
  
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    const cachedPosts = sessionStorage.getItem('feedPosts');
    const cachedFollowingPosts = sessionStorage.getItem('feedFollowingPosts');
    const cachedTab = sessionStorage.getItem('feedActiveTab');

    if (cachedPosts) {
      const parsed = JSON.parse(cachedPosts);
      setPosts(parsed);
      setLoading(false);
      setForceLoaded(true);
    }
    if (cachedFollowingPosts) {
      setFollowingPosts(JSON.parse(cachedFollowingPosts));
    }
    if (cachedTab) {
      setActiveTab(cachedTab as 'foryou' | 'following');
    }
    
    // If no cache, fetch normally
    if (!cachedPosts) {
      fetchPosts();
    }
  }, []);

  // Fetch current user profile
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserProfile(data);
          }
        });
    }
  }, [user]);

  // Save to cache whenever posts change
  useEffect(() => {
    if (posts.length > 0) {
      sessionStorage.setItem('feedPosts', JSON.stringify(posts));
    }
  }, [posts]);

  useEffect(() => {
    if (followingPosts.length > 0) {
      sessionStorage.setItem('feedFollowingPosts', JSON.stringify(followingPosts));
    }
  }, [followingPosts]);

  useEffect(() => {
    sessionStorage.setItem('feedActiveTab', activeTab);
  }, [activeTab]);

  // Restore scroll position after content is rendered
  useEffect(() => {
    if (posts.length > 0 && feedRef.current) {
      const savedPosition = sessionStorage.getItem('feedScrollPosition');
      if (savedPosition) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          if (feedRef.current) {
            feedRef.current.scrollTop = parseInt(savedPosition);
          }
        }, 50);
      }
    }
  }, [posts.length]);

  // Save scroll position continuously
  useEffect(() => {
    const handleScroll = () => {
      if (feedRef.current) {
        sessionStorage.setItem('feedScrollPosition', feedRef.current.scrollTop.toString());
      }
    };

    const currentRef = feedRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const addReply = useCallback((postId: string, newReply: Reply) => {
    setPosts((cur) =>
      cur.map((p) =>
        p.id === postId
          ? {
            ...p,
            replies: [...(p.replies || []), newReply].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ),
            reply_count: (p.reply_count || 0) + 1,
          }
          : p
      )
    );
  }, []);

  const handleAcknowledge = useCallback(async (postId: string, currentHasLiked: boolean) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const currentUserId = user.id;

    setPosts((currentPosts) =>
      currentPosts.map((p) =>
        p.id === postId
          ? { ...p, has_liked: !currentHasLiked, like_count: p.like_count + (!currentHasLiked ? 1 : -1) }
          : p
      )
    );

    if (currentHasLiked) {
      const { error } = await supabase
        .from('post_acknowledgments')
        .delete()
        .match({ post_id: postId, user_id: currentUserId });

      if (error) {
        toast.error('Failed to unacknowledge post');
        setPosts((currentPosts) =>
          currentPosts.map((p) =>
            p.id === postId
              ? { ...p, has_liked: currentHasLiked, like_count: p.like_count + 1 }
              : p
          )
        );
      }
    } else {
      const { error } = await supabase
        .from('post_acknowledgments')
        .insert({ post_id: postId, user_id: currentUserId });

      if (error) {
        toast.error('Failed to acknowledge post');
        setPosts((currentPosts) =>
            currentPosts.map((p) =>
              p.id === postId
                ? { ...p, has_liked: currentHasLiked, like_count: p.like_count - 1 }
                : p
            )
        );
      } else {
        // Award XP for giving a reaction
        awardXP('give_reaction', { post_id: postId });
        
        // Award XP to post author for receiving a reaction
        const post = posts.find(p => p.id === postId);
        if (post && post.author_id !== currentUserId) {
          fetch('https://rhnsjqqtdzlkvqazfcbg.supabase.co/functions/v1/award-xp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              userId: post.author_id,
              actionType: 'receive_reaction',
              xpAmount: 2,
              metadata: { post_id: postId, from_user_id: currentUserId }
            }),
          });
        }
      }
    }
  }, [user, navigate, posts, awardXP]);

  // NEW: Delete Post Handler - Opens confirmation sheet
  const handleDeletePost = useCallback((postId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setDeletePostId(postId);
  }, [user, navigate]);

  // Actual delete after confirmation
  const confirmDeletePost = useCallback(async () => {
    if (!deletePostId || !user) return;
    
    setIsDeleting(true);
    const postToDelete = posts.find(p => p.id === deletePostId);
    if (user.id !== postToDelete?.author_id) {
        toast.error('You can only delete your own posts.');
        setIsDeleting(false);
        setDeletePostId(null);
        return;
    }

    setPosts(currentPosts => currentPosts.filter(p => p.id !== deletePostId));

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', deletePostId)
        .eq('author_id', user.id);

    if (error) {
        toast.error('Failed to delete post.');
        console.error('Delete error:', error);
        fetchPosts();
    } else {
        toast.success('Post successfully deleted!');
    }
    
    setIsDeleting(false);
    setDeletePostId(null);
  }, [deletePostId, user, posts]);

  // NEW: Report Post Handler - Opens report sheet
  const handleReportPost = useCallback((postId: string) => {
      if (!user) {
        navigate('/auth');
        return;
      }
      setReportPostId(postId);
  }, [user, navigate]);

  // Actual report after reason selection
  const confirmReportPost = useCallback((reason: string) => {
      if (!reportPostId || !user) return;
      
      console.log(`User ${user.id} reported post ${reportPostId} for: ${reason}`);
      toast.success('Post reported. We will review this content.');
      setReportPostId(null);

      // In a real app, you would insert a record into a 'post_reports' table here.
  }, [user]);

  // Edit Post Handler - Opens edit modal
  const handleEditPost = useCallback((postId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const post = posts.find(p => p.id === postId) || followingPosts.find(p => p.id === postId);
    if (post) {
      setEditPost(post);
    }
  }, [user, navigate, posts, followingPosts]);

  // After post is updated, refresh the posts
  const handlePostUpdated = useCallback(() => {
    fetchPosts();
    setEditPost(null);
  }, []);



  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all posts for "For You" tab
      let { data: postData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(display_name, handle, is_verified, is_organization_verified, is_affiliate, avatar_url),
          post_images(image_url, display_order, alt_text),
          post_link_previews(url, title, description, image_url, site_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      if (!postData) postData = [];

      // Fetch following posts if user is logged in
      let followingPostData: any[] = [];
      if (user) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (followingData && followingData.length > 0) {
          const followingIds = followingData.map((f) => f.following_id);
          const { data: followingPostsData } = await supabase
            .from('posts')
            .select(`
              *,
              profiles(display_name, handle, is_verified, is_organization_verified, is_affiliate, avatar_url),
              post_images(image_url, display_order, alt_text),
              post_link_previews(url, title, description, image_url, site_name)
            `)
            .in('author_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(50);

          followingPostData = followingPostsData || [];
        }
      }

      const postIds = postData.map((p) => p.id);

      const { data: repliesData, error: repliesError } = await supabase
        .from('post_replies')
        .select('*, profiles(display_name, handle, is_verified, is_organization_verified, is_affiliate, avatar_url)')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      const { data: ackData, error: ackError } = await supabase
        .from('post_acknowledgments')
        .select('post_id, user_id')
        .in('post_id', postIds);

      if (ackError) throw ackError;

      const repliesByPostId = new Map<string, Reply[]>();
      (repliesData || []).forEach((r) => {
        if (!repliesByPostId.has(r.post_id)) {
          repliesByPostId.set(r.post_id, []);
        }
        repliesByPostId.get(r.post_id)!.push(r as Reply);
      });

      const acksByPostId = new Map<string, string[]>();
      (ackData || []).forEach((ack) => {
        if (!acksByPostId.has(ack.post_id)) {
          acksByPostId.set(ack.post_id, []);
        }
        acksByPostId.get(ack.post_id)!.push(ack.user_id);
      });

      const currentUserId = user?.id || null;
      const finalPosts: Post[] = postData.map((post) => {
        const replies = repliesByPostId.get(post.id) || [];
        const acks = acksByPostId.get(post.id) || [];

        return {
          ...post,
          profiles: post.profiles || { display_name: 'Unknown', handle: 'unknown', is_verified: false, is_organization_verified: false },
          replies: replies,
          reply_count: replies.length,
          like_count: acks.length,
          has_liked: currentUserId ? acks.includes(currentUserId) : false,
        } as Post;
      });

      // Process following posts
      const finalFollowingPosts: Post[] = followingPostData.map((post) => {
        const replies = repliesByPostId.get(post.id) || [];
        const acks = acksByPostId.get(post.id) || [];

        return {
          ...post,
          profiles: post.profiles || { display_name: 'Unknown', handle: 'unknown', is_verified: false, is_organization_verified: false },
          replies: replies,
          reply_count: replies.length,
          like_count: acks.length,
          has_liked: currentUserId ? acks.includes(currentUserId) : false,
        } as Post;
      });

      setPosts(finalPosts);
      setFollowingPosts(finalFollowingPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (err instanceof Error) {
        toast.error('Could not fetch feed. Check RLS policies or console.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const postsChannel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          setNewPostsCount(prev => prev + 1);
        }
      )
      .subscribe();

    const repliesChannel = supabase
      .channel('replies-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_replies' },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, handle, is_verified, is_organization_verified, is_affiliate')
            .eq('id', payload.new.author_id)
            .single();

          if (profile) {
            const newReply = { ...payload.new, profiles: profile } as Reply;
            addReply(payload.new.post_id, newReply);

            const mentionsAfuAi = /@afuai/i.test(payload.new.content);
            if (mentionsAfuAi) {
              const { data: postData } = await supabase
                .from('posts')
                .select('content')
                .eq('id', payload.new.post_id)
                .single();

              try {
                await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/afu-ai-reply`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                      postId: payload.new.post_id,
                      replyContent: payload.new.content,
                      originalPostContent: postData?.content || '',
                    }),
                  }
                );
              } catch (error) {
                console.error('Failed to trigger AfuAI:', error);
              }
            }
          }
        }
      )
      .subscribe();

    const acksChannel = supabase
      .channel('acks-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_acknowledgments' },
        (payload) => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_acknowledgments' },
        (payload) => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(repliesChannel);
      supabase.removeChannel(acksChannel);
    };
  }, [user, addReply, fetchPosts]);
  
  useEffect(() => {
      if (feedRef.current) {
          // You can re-enable scrolling logic here if needed
      }
  }, [posts]);

  const PostSkeleton = () => (
    <div className="flex p-3 sm:p-4 border-b border-border">
      <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mr-2 sm:mr-3 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center">
          <Skeleton className="h-3 sm:h-4 w-1/4 mr-2" />
          <Skeleton className="h-2.5 sm:h-3 w-1/6" />
        </div>
        <Skeleton className="h-3 sm:h-4 w-full" />
        <Skeleton className="h-3 sm:h-4 w-5/6" />
        <div className="flex justify-between mt-3 gap-2">
          <Skeleton className="h-3 sm:h-4 w-10 sm:w-12" />
          <Skeleton className="h-3 sm:h-4 w-10 sm:w-12" />
          <Skeleton className="h-3 sm:h-4 w-10 sm:w-12" />
        </div>
      </div>
    </div>
  );


  const effectiveLoading = loading && !forceLoaded;
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (effectiveLoading) {
    return (
      <div className="flex flex-col h-full">
        {[...Array(5)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  const currentPosts = activeTab === 'foryou' ? posts : followingPosts;

  const handleLoadNewPosts = () => {
    fetchPosts();
    setNewPostsCount(0);
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'foryou' | 'following')} className="w-full">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {newPostsCount > 0 && (
            <button
              onClick={handleLoadNewPosts}
              className="w-full py-3 px-4 bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-colors border-b border-primary/20 flex items-center justify-center gap-2"
            >
              <span>Show {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}</span>
            </button>
          )}
          <TabsList className="grid grid-cols-2 w-full h-14 rounded-none bg-transparent border-b">
            <TabsTrigger
              value="foryou"
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-4 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold h-full flex items-center gap-1.5 hover:bg-muted/50 transition-colors"
            >
              For you
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-4 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold h-full hover:bg-muted/50 transition-colors"
            >
              Following
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="flex-1 overflow-y-auto m-0" ref={feedRef}>
          {currentPosts.length === 0 && !effectiveLoading ? (
            <div className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm px-4">
              {activeTab === 'following' && user
                ? 'Follow users to see their posts here'
                : t('feed.noPostsYet')}
            </div>
          ) : (
            currentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                addReply={addReply}
                user={user as AuthUser | null}
                navigate={navigate}
                onAcknowledge={handleAcknowledge}
                onDeletePost={handleDeletePost}
                onReportPost={handleReportPost}
                onEditPost={handleEditPost}
                userProfile={userProfile}
                expandedPosts={expandedPosts}
                setExpandedPosts={setExpandedPosts}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Sheet */}
      <DeletePostSheet
        isOpen={!!deletePostId}
        onClose={() => setDeletePostId(null)}
        onConfirm={confirmDeletePost}
        isDeleting={isDeleting}
      />
      
      {/* Report Post Sheet */}
      <ReportPostSheet
        isOpen={!!reportPostId}
        onClose={() => setReportPostId(null)}
        onReport={confirmReportPost}
      />

      {/* Edit Post Modal */}
      {editPost && (
        <EditPostModal
          isOpen={!!editPost}
          onClose={() => setEditPost(null)}
          post={editPost}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
};

export default Feed;
