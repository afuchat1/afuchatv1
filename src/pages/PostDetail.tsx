import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// Note: Verified Badge components must be imported or defined here

// --- START: Verified Badge Components ---
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

  useEffect(() => {
    if (!postId) return;

    const fetchPostAndReplies = async () => {
      setLoading(true);
      
      // 1. Fetch Post Details and Counts
      const postPromise = supabase
        .from('posts')
        .select(`
          id, content, created_at,
          likes_count:post_acknowledgments(count),
          replies_count:post_replies(count),
          author:profiles!author_id (
            id, display_name, handle, is_verified, is_organization_verified
          )
        `) 
        .eq('id', postId)
        .single();
        
      // 2. Fetch Replies (Comments)
      const repliesPromise = supabase
        .from('post_replies')
        .select(`
          id, content, created_at,
          author:profiles!author_id (
            display_name, handle, is_verified, is_organization_verified
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      const [postResult, repliesResult] = await Promise.all([postPromise, repliesPromise]);
      
      // Handle Post Data
      if (postResult.error) {
        console.error('Error fetching post data:', postResult.error);
      } else if (postResult.data) {
        const processedData = {
          ...postResult.data,
          likes_count: (postResult.data.likes_count as any[])[0]?.count || 0,
          replies_count: (postResult.data.replies_count as any[])[0]?.count || 0,
        };
        setPost(processedData as Post);
      }

      // Handle Replies Data
      if (repliesResult.error) {
        console.error('Error fetching replies:', repliesResult.error);
      } else if (repliesResult.data) {
        setReplies(repliesResult.data as any);
      }
      
      setLoading(false);
    };

    fetchPostAndReplies();
  }, [postId]);

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
                <p className="text-base text-muted-foreground truncate">@{post.author.handle}</p> 
              </Link>
            </div>

            {/* POST TEXT */}
            <p className="text-xl leading-relaxed whitespace-pre-wrap mb-4">
              {renderContentWithMentions(post.content)}
            </p>

            {/* TIME & DATE */}
            <p className="text-base text-muted-foreground border-b border-border pb-3 mb-3"> 
              {formatDate(post.created_at)}
            </p>

            {/* STATS SECTION */}
            <div className="flex gap-4 text-foreground">
                <span className="text-base font-semibold">
                  {post.likes_count} <span className="text-muted-foreground font-normal">Likes</span>
                </span>
                <span className="text-base font-semibold">
                  {post.replies_count} <span className="text-muted-foreground font-normal">Replies</span>
                </span>
                <span className="text-base font-semibold text-muted-foreground">0 Shares</span> 
            </div>
        </div>

        {/* --- REPLY INPUT SECTION --- */}
        <div className="p-4 border-b border-border">
            {/* Removed the hardcoded 'Reply input placeholder...' text */}
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
                                    <Link to={`/profile/${reply.author.handle}`} className="font-bold text-base hover:underline truncate">
                                        {reply.author.display_name}
                                    </Link>
                                    <VerifiedBadge 
                                        isVerified={reply.author.is_verified} 
                                        isOrgVerified={reply.author.is_organization_verified} 
                                    />
                                    <span className="text-base text-muted-foreground ml-2">@{reply.author.handle}</span> 
                                </div>
                                <span className="text-sm text-muted-foreground ml-4 flex-shrink-0">
                                    {new Date(reply.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <p className="text-base text-foreground mt-1 whitespace-pre-wrap">
                                {renderContentWithMentions(reply.content)}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
            {replies.length === 0 && (
                <p className="text-center text-muted-foreground p-8 text-base">No replies yet. Be the first!</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
