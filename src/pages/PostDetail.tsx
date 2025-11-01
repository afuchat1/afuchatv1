import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// Note: Verified Badge components must be imported or defined here

// --- START: Verified Badge Components (Unchanged) ---
const TwitterVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`text-[#1d9bf0] fill-[#1d9bf0] ${size} ml-0.5 flex-shrink-0`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);
const GoldVerifiedBadge = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`text-[#FFD43B] fill-[#FFD43B] ${size} ml-0.5 flex-shrink-0`}>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
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
          className="text-blue-500 hover:underline font-medium"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};

// Helper to format time
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
      <div className="flex items-center py-2 px-4 border-b border-border sticky top-0 z-10 bg-background/90 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="p-2"><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-base font-bold ml-2">Post</h1>
      </div>

      <div className="flex-1">
        
        {/* --- MAIN POST CONTENT --- */}
        <div className="flex border-b border-border py-2 pl-0 pr-4 transition-colors hover:bg-muted/5">
          {/* AUTHOR ICON */}
          <div
            className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer ml-1"
            onClick={() => navigate(`/profile/${post.author.id}`)}
          >
            <UserIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            {/* AUTHOR HEADER */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-1 min-w-0">
                <span
                  className="font-bold text-foreground text-xs cursor-pointer hover:underline whitespace-nowrap"
                  onClick={() => navigate(`/profile/${post.author.id}`)}
                >
                  {post.author.display_name}
                </span>
                <VerifiedBadge 
                  isVerified={post.author.is_verified} 
                  isOrgVerified={post.author.is_organization_verified} 
                />

                <span
                  className="text-muted-foreground text-xs hover:underline cursor-pointer truncate flex-shrink min-w-0"
                  onClick={() => navigate(`/profile/${post.author.id}`)}
                >
                  @{post.author.handle}
                </span>

                <span className="text-muted-foreground text-xs flex-shrink-0">·</span>
                <span className="text-muted-foreground text-xs whitespace-nowrap flex-shrink-0">
                  {formatTime(post.created_at)}
                </span>
              </div>
            </div>

            {/* POST TEXT */}
            <Link to={`/post/${post.id}`} className="block">
              <p className="text-foreground text-xs mt-0.5 mb-1.5 leading-relaxed whitespace-pre-wrap">
                {renderContentWithMentions(post.content)}
              </p>
            </Link>

            {/* STATS SECTION */}
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1 -ml-2 max-w-[420px]">
              <span>{post.replies_count > 0 ? post.replies_count : ''}</span>
              <span className={`${post.likes_count > 0 ? 'text-red-500' : ''}`}>{post.likes_count > 0 ? post.likes_count : ''}</span>
              <span>0</span>
            </div>
          </div>
        </div>

        {/* --- REPLY INPUT SECTION (Placeholder) --- */}
        <div className="py-2 px-4 border-b border-border">
            {/* You would insert your Reply Input component here */}
            <p className="text-xs text-muted-foreground">Reply input placeholder...</p>
        </div>

        {/* --- REPLIES LIST (NEW SECTION) --- */}
        <div className="flex flex-col">
            {replies.map(reply => (
                <div key={reply.id} className="flex border-b border-border py-2 pl-0 pr-4 transition-colors hover:bg-muted/5 relative">
                  {/* Visual Indentation Line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border/80 ml-px mt-2.5 mb-1.5" />
                  
                  {/* Reply Author Icon */}
                  <div
                    className="mr-2 flex-shrink-0 h-7 w-7 rounded-full bg-secondary flex items-center justify-center cursor-pointer z-10"
                    onClick={() => navigate(`/profile/${reply.author.id}`)}
                  >
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Reply Header */}
                    <div className="flex items-center gap-x-1 min-w-0">
                      <span
                        className="font-bold text-foreground text-xs cursor-pointer hover:underline whitespace-nowrap"
                        onClick={() => navigate(`/profile/${reply.author.id}`)}
                      >
                        {reply.author.display_name}
                      </span>
                      <VerifiedBadge 
                        isVerified={reply.author.is_verified} 
                        isOrgVerified={reply.author.is_organization_verified} 
                      />

                      <span
                        className="text-muted-foreground text-xs hover:underline cursor-pointer truncate flex-shrink min-w-0"
                        onClick={() => navigate(`/profile/${reply.author.id}`)}
                      >
                        @{reply.author.handle}
                      </span>
                      <span className="text-muted-foreground text-xs flex-shrink-0">·</span>
                      <span className="text-muted-foreground text-xs whitespace-nowrap flex-shrink-0">
                        {formatTime(reply.created_at)}
                      </span>
                    </div>

                    {/* Reply Content */}
                    <p className="text-foreground text-xs leading-snug whitespace-pre-wrap break-words mt-0.5">
                      {renderContentWithMentions(reply.content)}
                    </p>
                  </div>
                </div>
            ))}
            {replies.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">No replies yet. Be the first!</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
