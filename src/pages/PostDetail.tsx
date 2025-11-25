import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { ArrowLeft, User as UserIcon, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { useAITranslation } from '@/hooks/useAITranslation';
import { LinkPreviewCard } from '@/components/ui/LinkPreviewCard';
import { Textarea } from '@/components/ui/textarea';
import { MentionInput } from '@/components/MentionInput';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { NestedReplyItem } from '@/components/post-detail/NestedReplyItem';
import { ViewsAnalyticsSheet } from '@/components/ViewsAnalyticsSheet';
// Note: Verified Badge components must be imported or defined here

// --- START: Verified Badge Components (Unchanged) ---
const TwitterVerifiedBadge = ({ size = 'w-5 h-5' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1 flex-shrink-0`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1d9bf0" />
  </svg>
);
const GoldVerifiedBadge = ({ size = 'w-5 h-5' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1 flex-shrink-0`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#FFD43B" />
  </svg>
);
const VerifiedBadge = ({ isVerified, isOrgVerified }: { isVerified?: boolean; isOrgVerified?: boolean }) => {
  if (isOrgVerified) return <GoldVerifiedBadge />;
  if (isVerified) return <TwitterVerifiedBadge />;
  return null;
};
// --- END: Verified Badge Components ---


// --- Utility to render text with clickable mentions ---
const renderContentWithMentions = (content: string) => {
  // Ensure content is a string
  const safeContent = typeof content === 'string' ? content : String(content || '');
  const parts = safeContent.split(/(@[\w]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const handle = part.substring(1); 
      return (
        <Link 
          key={index} 
          to={`/profile/${handle}`} 
          className="text-primary hover:underline font-semibold"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};

// --- Reply Interface (NEW) ---
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

// Define the main Post type
interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  post_images?: Array<{ image_url: string; display_order: number; alt_text?: string }>;
  post_link_previews?: Array<{
    url: string;
    title?: string | null;
    description?: string | null;
    image_url?: string | null;
    site_name?: string | null;
  }>;
  likes_count: number;
  replies_count: number;
  view_count: number;
  
  author: {
    id: string; 
    display_name: string;
    handle: string;
    is_verified: boolean;
    is_organization_verified: boolean;
  };
}

const PostDetail = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]); // NEW state for replies
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { translateText } = useAITranslation();
  const [translatedPost, setTranslatedPost] = useState<string | null>(null);
  const [translatedReplies, setTranslatedReplies] = useState<Record<string, string>>({});
  const [isTranslatingPost, setIsTranslatingPost] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ replyId: string; authorHandle: string } | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const postRef = useRef<HTMLDivElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [showViewsSheet, setShowViewsSheet] = useState(false);

  // Track post view when it becomes visible
  useEffect(() => {
    if (!user || !postRef.current || hasTrackedView || !postId) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !hasTrackedView) {
          setHasTrackedView(true);
          
          // Track the view in the database
          try {
            await supabase
              .from('post_views')
              .insert({
                post_id: postId,
                viewer_id: user.id,
              });
            
            // Update local view count
            setPost(prev => prev ? { ...prev, view_count: prev.view_count + 1 } : null);
          } catch (error) {
            // Silently fail if view already exists
            console.debug('View already tracked or error:', error);
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(postRef.current);

    return () => observer.disconnect();
  }, [user, postId, hasTrackedView]);

  useEffect(() => {
    if (!postId) return;

    const fetchPostAndReplies = async () => {
      setLoading(true);
      
      const postPromise = supabase
        .from('posts')
        .select(`
          id, content, created_at, image_url, view_count,
          profiles!inner (id, display_name, handle, is_verified, is_organization_verified),
          post_images(image_url, display_order, alt_text),
          post_link_previews(url, title, description, image_url, site_name)
        `)
        .eq('id', postId)
        .single();

      const likesPromise = supabase
        .from('post_acknowledgments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);

      const repliesPromise = supabase
        .from('post_replies')
        .select(`
          id, content, created_at,
          profiles!inner (display_name, handle, is_verified, is_organization_verified)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      const [postResult, likesResult, repliesResult] = await Promise.all([postPromise, likesPromise, repliesPromise]);

      if (postResult.error) {
        console.error('Error fetching post:', postResult.error);
        setLoading(false);
        return;
      }

      const postData = postResult.data;
      const likesCount = likesResult.count || 0;
      const repliesCount = repliesResult.data?.length || 0;

      setPost({
        id: postData.id,
        content: postData.content,
        created_at: postData.created_at,
        image_url: postData.image_url || null,
        post_images: postData.post_images || [],
        post_link_previews: postData.post_link_previews || [],
        likes_count: likesCount,
        replies_count: repliesCount,
        view_count: postData.view_count || 0,
        author: {
          id: postData.profiles.id,
          display_name: postData.profiles.display_name,
          handle: postData.profiles.handle,
          is_verified: postData.profiles.is_verified,
          is_organization_verified: postData.profiles.is_organization_verified,
        },
      });

      if (repliesResult.data) {
        const mappedReplies: Reply[] = repliesResult.data.map((r: any) => ({
          id: r.id,
          content: r.content,
          created_at: r.created_at,
          parent_reply_id: r.parent_reply_id,
          is_pinned: r.is_pinned,
          pinned_by: r.pinned_by,
          pinned_at: r.pinned_at,
          author: {
            display_name: r.profiles.display_name,
            handle: r.profiles.handle,
            is_verified: r.profiles.is_verified,
            is_organization_verified: r.profiles.is_organization_verified,
            avatar_url: r.profiles.avatar_url,
          },
        }));
        const organizedReplies = organizeReplies(mappedReplies);
        setReplies(organizedReplies);
      }

      setLoading(false);
    };

    fetchPostAndReplies();
  }, [postId]);

  const handleTranslatePost = async () => {
    if (!post) return;
    
    if (translatedPost) {
      setTranslatedPost(null);
      return;
    }

    setIsTranslatingPost(true);
    const translated = await translateText(post.content, i18n.language);
    setTranslatedPost(translated);
    setIsTranslatingPost(false);
  };

  const handleTranslateReply = async (replyId: string, content: string) => {
    if (translatedReplies[replyId]) {
      const newTranslated = { ...translatedReplies };
      delete newTranslated[replyId];
      setTranslatedReplies(newTranslated);
      return;
    }

    const translated = await translateText(content, i18n.language);
    setTranslatedReplies(prev => ({ ...prev, [replyId]: translated }));
  };

  const organizeReplies = (allReplies: Reply[]): Reply[] => {
    const replyMap = new Map<string, Reply>();
    const rootReplies: Reply[] = [];

    allReplies.forEach(reply => {
      replyMap.set(reply.id, { ...reply, nested_replies: [] });
    });

    allReplies.forEach(reply => {
      const replyWithNested = replyMap.get(reply.id)!;
      if (reply.parent_reply_id) {
        const parent = replyMap.get(reply.parent_reply_id);
        if (parent) {
          parent.nested_replies = parent.nested_replies || [];
          parent.nested_replies.push(replyWithNested);
        } else {
          rootReplies.push(replyWithNested);
        }
      } else {
        rootReplies.push(replyWithNested);
      }
    });

    // Sort: pinned first, then by date
    return rootReplies.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const handlePinReply = async (replyId: string, currentPinnedState: boolean) => {
    if (!user || !post || user.id !== post.author.id) {
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
      return;
    }

    toast.success(currentPinnedState ? 'Comment unpinned' : 'Comment pinned');
    
    // Refresh replies
    const { data } = await supabase
      .from('post_replies')
      .select('*, profiles!inner(display_name, handle, is_verified, is_organization_verified, avatar_url)')
      .eq('post_id', postId);
    
    if (data) {
      const mappedReplies: Reply[] = data.map((r: any) => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        parent_reply_id: r.parent_reply_id,
        is_pinned: r.is_pinned,
        pinned_by: r.pinned_by,
        pinned_at: r.pinned_at,
        author: {
          display_name: r.profiles.display_name,
          handle: r.profiles.handle,
          is_verified: r.profiles.is_verified,
          is_organization_verified: r.profiles.is_organization_verified,
          avatar_url: r.profiles.avatar_url,
        },
      }));
      setReplies(organizeReplies(mappedReplies));
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('post_replies')
      .delete()
      .eq('id', replyId);

    if (error) {
      toast.error('Failed to delete comment');
      return;
    }

    toast.success('Comment deleted');
    setReplies(prev => prev.filter(r => r.id !== replyId));
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }

    setSubmittingReply(true);
    try {
      // Append mention at the end if it exists
      const mention = replyingTo 
        ? `@${replyingTo.authorHandle}` 
        : (post ? `@${post.author.handle}` : '');
      const finalContent = mention ? `${replyText.trim()} ${mention}` : replyText.trim();

      const { data: replyData, error } = await supabase
        .from('post_replies')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: finalContent,
          parent_reply_id: replyingTo?.replyId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Check if AfuAI was mentioned and trigger AI reply
      const mentionsAfuAi = /@afuai/i.test(finalContent);
      const AI_FEATURES_COMING_SOON = true; // Temporarily disabled
      if (mentionsAfuAi && post && replyData && !AI_FEATURES_COMING_SOON) {
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
                postId: postId,
                replyContent: finalContent,
                originalPostContent: post.content || '',
                triggerReplyId: replyData.id,
              }),
            }
          );
        } catch (error) {
          console.error('Failed to trigger AfuAI:', error);
        }
      }

      toast.success('Reply posted!');
      setReplyText('');
      setReplyingTo(null);
      
      // Refresh replies
      const { data: repliesData } = await supabase
        .from('post_replies')
        .select(`
          *,
          profiles!inner(display_name, handle, is_verified, is_organization_verified, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (repliesData) {
        const mappedReplies: Reply[] = repliesData.map((r: any) => ({
          id: r.id,
          content: r.content,
          created_at: r.created_at,
          parent_reply_id: r.parent_reply_id,
          is_pinned: r.is_pinned,
          pinned_by: r.pinned_by,
          pinned_at: r.pinned_at,
          author: {
            display_name: r.profiles.display_name,
            handle: r.profiles.handle,
            is_verified: r.profiles.is_verified,
            is_organization_verified: r.profiles.is_organization_verified,
            avatar_url: r.profiles.avatar_url,
          },
        }));
        const organizedReplies = organizeReplies(mappedReplies);
        setReplies(organizedReplies);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Remove auto-translate effect - now translate is manual via button
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + 
           ' · ' + 
           date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoader size="lg" text="Loading post..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 text-center min-h-screen">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Button 
          onClick={() => navigate(-1)} 
          variant="link"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div ref={postRef} className="min-h-screen bg-background border-x border-border max-w-2xl mx-auto flex flex-col">
      <div className="flex-1">
        
        {/* --- MAIN POST CONTENT --- */}
        <div className="p-4 border-b border-border">
            {/* AUTHOR BLOCK */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
                <UserIcon className="h-6 w-6" />
              </div>
              <Link to={`/profile/${post.author.handle}`} className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="text-lg font-bold hover:underline truncate">{post.author.display_name}</span>
                  <VerifiedBadge 
                    isVerified={post.author.is_verified} 
                    isOrgVerified={post.author.is_organization_verified} 
                  />
                </div>
                <p className="text-sm text-muted-foreground truncate">@{post.author.handle}</p>
              </Link>
            </div>

            {/* POST TEXT */}
            <p className="text-2xl leading-relaxed whitespace-pre-wrap mb-4">
              {renderContentWithMentions(translatedPost || post.content)}
            </p>
            {/* POST IMAGE */}
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
                className="mb-4"
              />
            )}
            
            {post.post_link_previews && post.post_link_previews.length > 0 && (
              <div className="mb-4 space-y-2">
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
                onClick={handleTranslatePost}
                disabled={isTranslatingPost}
                className="text-xs text-muted-foreground hover:text-primary mb-3 p-0 h-auto"
              >
                {isTranslatingPost ? t('common.translating') : translatedPost ? t('common.showOriginal') : t('common.translate')}
              </Button>
            )}

            {/* TIME & DATE */}
            <p className="text-sm text-muted-foreground border-b border-border pb-3 mb-3">
              {formatDate(post.created_at)}
            </p>

            {/* STATS SECTION */}
            <div className="flex gap-4 text-foreground">
                <span className="text-sm font-semibold">
                  {post.likes_count} <span className="text-muted-foreground font-normal">Likes</span>
                </span>
                <span className="text-sm font-semibold">
                  {post.replies_count} <span className="text-muted-foreground font-normal">Replies</span>
                </span>
                <button 
                  onClick={() => setShowViewsSheet(true)}
                  className="text-sm font-semibold flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  {post.view_count} <span className="text-muted-foreground font-normal">Views</span>
                </button>
            </div>
        </div>

        {/* --- REPLY INPUT SECTION --- */}
        <div className="p-4 border-b border-border">
          {user ? (
            <div className="space-y-3">
              {replyingTo && (
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  <span>Replying to @{replyingTo.authorHandle}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    className="h-6 px-2"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <div className="flex gap-3">
                <MentionInput
                  value={replyText}
                  onChange={setReplyText}
                  mention={replyingTo ? `@${replyingTo.authorHandle}` : (post ? `@${post.author.handle}` : undefined)}
                  placeholder={replyingTo ? `Reply to @${replyingTo.authorHandle}...` : "Post your reply..."}
                  className="min-h-[80px] resize-none"
                  onSubmit={handleReplySubmit}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || submittingReply}
                  size="sm"
                >
                  {submittingReply ? 'Posting...' : 'Reply'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Sign in to reply</p>
          )}
        </div>

        {/* --- REPLIES LIST --- */}
        <div className="flex flex-col">
            {replies.map(reply => (
              <NestedReplyItem
                key={reply.id}
                reply={reply}
                depth={0}
                onTranslate={handleTranslateReply}
                translatedReplies={translatedReplies}
                onReplyClick={(replyId, authorHandle) => {
                  setReplyingTo({ replyId, authorHandle });
                  setReplyText(`@${authorHandle} `);
                }}
                onPinReply={handlePinReply}
                onDeleteReply={handleDeleteReply}
                isPostAuthor={user?.id === post?.author.id}
                currentUserId={user?.id}
                VerifiedBadge={VerifiedBadge}
                renderContentWithMentions={renderContentWithMentions}
              />
            ))}
            {replies.length === 0 && (
                <p className="text-center text-muted-foreground p-8">No replies yet. Be the first!</p>
            )}
        </div>
      </div>

      <ViewsAnalyticsSheet
        postId={postId || ''}
        isOpen={showViewsSheet}
        onClose={() => setShowViewsSheet(false)}
        totalViews={post?.view_count || 0}
        isPostOwner={user?.id === post?.author.id}
      />
    </div>
  );
};

export default PostDetail;
