import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, X, Sparkles, Image as ImageIcon, AtSign, Hash, Smile, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// Optional: Framer Motion for animations (install with: npm i framer-motion)
let motion, AnimatePresence;
try {
  const fm = require('framer-motion');
  motion = fm.motion;
  AnimatePresence = fm.AnimatePresence;
} catch (e) {
  console.warn('Framer Motion not installed - animations disabled. Run: npm i framer-motion');
  motion = null;
  AnimatePresence = null;
}
// Fallback cn utility (if '@/lib/utils' missing)
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

// NOTE: This interface syntax is valid in a .tsx file.
interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Custom hook for character counting with color thresholds
const useCharacterCount = (text: string) => {
    const length = text.length;
    const remaining = 280 - length;
    const getVariant = () => {
        if (length > 250) return 'destructive';
        if (length > 200) return 'secondary';
        return 'default';
    };
    return { remaining, variant: getVariant(), length };
};

// Unique preview component for post
const PostPreview: React.FC<{ content: string }> = ({ content }) => (
    <Card className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-muted/20 to-accent/20 border-border/50 rounded-xl">
        <CardContent className="p-0">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {content || "Your post will appear here..."}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/20">
                <Badge variant="outline" className="text-xs">Public</Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>Visible to followers</span>
                </div>
            </div>
        </CardContent>
    </Card>
);

// Error Boundary Component (wraps modal to catch crashes)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Modal Error:', error, errorInfo);
        toast.error('Something went wrong—try again.');
    }

    render() {
        if (this.state.hasError) {
            return <div className="p-4 text-center text-destructive">Error loading modal. <Button onClick={() => this.setState({ hasError: false })}>Retry</Button></div>;
        }
        return this.props.children;
    }
}

// NOTE: Component declaration should use React.FC<NewPostModalProps>
const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const { remaining, variant, length } = useCharacterCount(newPost);

    const handlePost = async () => {
        // Validation based on AfuChat project brief
        if (!newPost.trim() || !user || newPost.length > 280) {
            if (newPost.length > 280) toast.error('Post must be 280 characters or less');
            return;
        }

        setIsPosting(true);
        const postContent = newPost.trim();

        try {
            // Database insert
            const { error } = await supabase.from('posts').insert({
                content: postContent,
                author_id: user.id,
            });

            if (error) {
                console.error("Supabase Post Error:", error);
                toast.error('Failed to post. Please try again.');
            } else {
                setNewPost(''); 
                setShowPreview(false);
                onClose(); // Close modal on success
                // Success toast handled by the real-time subscription in Feed.tsx 
                toast.success('Post created! ✨', {
                    description: 'Your thoughts are now live.',
                    duration: 3000,
                });
            }
        } catch (err) {
            console.error('Post Error:', err);
            toast.error('Network error—check connection.');
        } finally {
            setIsPosting(false);
        }
    };

    // Unique feature: Auto-show preview after typing a few characters
    useEffect(() => {
        const timer = setTimeout(() => {
            if (newPost.length > 10) setShowPreview(true);
            else setShowPreview(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [newPost]);

    // Fallback for animations
    const MotionDiv = motion ? motion.div : (({ children, ...props }: any) => <div {...props}>{children}</div>);
    const MotionSend = motion ? motion.div : (({ children, ...props }: any) => <div {...props}>{children}</div>);

    return (
        <ErrorBoundary>
            <Dialog open={isOpen} onOpenChange={onClose}>
                {/* DialogContent: Full-screen on mobile, rich design with rounded corners and high shadow */}
                <DialogContent className={cn(
                    "sm:max-w-[425px] w-[95vw] max-w-md rounded-xl shadow-2xl p-0 overflow-hidden",
                    "sm:mx-auto sm:my-8"
                )}>
                    <MotionDiv
                        key="header"
                        initial={motion ? { opacity: 0, y: -20 } : {}}
                        animate={motion ? { opacity: 1, y: 0 } : {}}
                        exit={motion ? { opacity: 0, y: -20 } : {}}
                        className="p-4 border-b border-muted-foreground/10 flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-secondary/5"
                    >
                        <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            Create Post
                        </DialogTitle>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose} 
                            className="rounded-full hover:bg-muted/50 transition-colors"
                            disabled={isPosting}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </MotionDiv>
                    
                    {/* Post Input Area: Elevated Card Style with interactive toolbar */}
                    <div className="p-4 space-y-4">
                        {/* Toolbar: Quick actions for unique feel - Mobile wrap */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs rounded-full" disabled>
                                <ImageIcon className="h-4 w-4 mr-1" />
                                Media (Coming Soon)
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs rounded-full" disabled>
                                <AtSign className="h-4 w-4 mr-1" />
                                Mention
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs rounded-full" disabled>
                                <Hash className="h-4 w-4 mr-1" />
                                Hashtag
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs rounded-full" disabled>
                                <Smile className="h-4 w-4 mr-1" />
                                Emoji
                            </Button>
                        </div>

                        <Textarea
                            placeholder="Share your thoughts... What's on your mind today? (Text-only, max 280 characters)"
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            maxLength={280}
                            rows={4}
                            className={cn(
                                "mb-3 resize-none focus-visible:ring-primary min-h-[100px]",
                                "placeholder:text-muted-foreground/70"
                            )}
                            disabled={isPosting}
                        />

                        {/* Character counter with progress bar */}
                        <div className="flex items-center justify-between">
                            <Badge variant={variant} className="text-xs">
                                {remaining} left • {length}/280
                            </Badge>
                            <div className="w-20 bg-muted rounded-full h-1.5">
                                <div 
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        length > 250 ? "bg-destructive" : length > 200 ? "bg-secondary" : "bg-primary"
                                    )} 
                                    style={{ width: `${(length / 280) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Unique Post Preview */}
                        {showPreview && <PostPreview content={newPost} />}

                        <Separator />

                        {/* Post Button with loading state */}
                        <Button 
                            onClick={handlePost} 
                            disabled={!newPost.trim() || newPost.length > 280 || isPosting} 
                            className={cn(
                                "w-full flex items-center justify-center space-x-2 shadow-lg rounded-full px-6 py-3 h-12 font-bold transition-all duration-200",
                                "hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]",
                                (newPost.trim() && newPost.length <= 280 && !isPosting) 
                                    ? "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90" 
                                    : "bg-muted cursor-not-allowed"
                            )}
                        >
                            {isPosting ? (
                                <div className="flex items-center space-x-2">
                                    <Send className="h-4 w-4 animate-spin" />
                                    <span>Posting...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Send className="h-4 w-4" />
                                    <span>Share Post</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </ErrorBoundary>
    );
};

export default NewPostModal;
