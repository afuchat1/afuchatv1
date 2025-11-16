import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { useAITranslation } from '@/hooks/useAITranslation';
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
  const parts = content.split(/(@[\w]+)/g);

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
  author: {
    display_name: string;
    handle: string;
    is_verified: boolean;
    is_organization_verified: boolean;
  };
}

// Define the main Post type
interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  post_images?: Array<{ image_url: string; display_order: number; alt_text?: string }>;
  likes_count: number;
  replies_count: number;
  
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
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]); // NEW state for replies
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { translateText } = useAITranslation();
  const [translatedPost, setTranslatedPost] = useState<string | null>(null);
  const [translatedReplies, setTranslatedReplies] = useState<Record<string, string>>({});
  const [isTranslatingPost, setIsTranslatingPost] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const fetchPostAndReplies = async () => {
      setLoading(true);
      
      const postPromise = supabase
        .from('posts')
        .select(`
          id, content, created_at, image_url,
          profiles!inner (id, display_name, handle, is_verified, is_organization_verified),
          post_images(image_url, display_order, alt_text)
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
        likes_count: likesCount,
        replies_count: repliesCount,
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
          author: {
            display_name: r.profiles.display_name,
            handle: r.profiles.handle,
            is_verified: r.profiles.is_verified,
            is_organization_verified: r.profiles.is_organization_verified,
          },
        }));
        setReplies(mappedReplies);
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

  // Remove auto-translate effect - now translate is manual via button
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + 
           ' · ' + 
           date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    // ... Skeleton Loading (Unchanged) ...
    return (
      <div className="p-4 max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-xl font-bold ml-4">Post</h1>
        </div>
        <div className="space-y-4 pt-4 border-t border-border">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <div className="h-px bg-border" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 text-center min-h-screen">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Button onClick={() => navigate(-1)} variant="link">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background border-x border-border max-w-2xl mx-auto flex flex-col">
      {/* --- HEADER (Unchanged) --- */}
      <div className="flex items-center p-4 border-b border-border sticky top-0 z-10 bg-background/90 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="p-2"><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-extrabold ml-4">Post</h1>
      </div>

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
            {/* Translate Button */}
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
                <span className="text-sm font-semibold text-muted-foreground">0 Shares</span> 
            </div>
        </div>

        {/* --- REPLY INPUT SECTION (Placeholder) --- */}
        <div className="p-4 border-b border-border">
            {/* You would insert your Reply Input component here */}
            <p className="text-muted-foreground">Reply input placeholder...</p>
        </div>

        {/* --- REPLIES LIST (NEW SECTION) --- */}
        <div className="flex flex-col">
            {replies.map(reply => (
                <div key={reply.id} className="p-4 border-b border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                        {/* Reply Author Avatar Placeholder */}
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground flex-shrink-0 mt-1">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Link to={`/profile/${reply.author.handle}`} className="font-bold hover:underline truncate">
                                        {reply.author.display_name}
                                    </Link>
                                    <VerifiedBadge 
                                        isVerified={reply.author.is_verified} 
                                        isOrgVerified={reply.author.is_organization_verified} 
                                    />
                                    <span className="text-sm text-muted-foreground ml-2">@{reply.author.handle}</span>
                                </div>
                                <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                                    {new Date(reply.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <p className="text-foreground mt-1 whitespace-pre-wrap">
                                {renderContentWithMentions(translatedReplies[reply.id] || reply.content)}
                            </p>
                            {i18n.language !== 'en' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTranslateReply(reply.id, reply.content)}
                                className="text-xs text-muted-foreground hover:text-primary mt-1 p-0 h-auto"
                              >
                                {translatedReplies[reply.id] ? t('common.showOriginal') : t('common.translate')}
                              </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {replies.length === 0 && (
                <p className="text-center text-muted-foreground p-8">No replies yet. Be the first!</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
