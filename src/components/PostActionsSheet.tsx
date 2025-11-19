import React, { useRef, useState } from 'react';
import { 
  Ellipsis, Trash2, Flag, Maximize2, Share, LogIn, EyeOff, UserPlus, List, Volume2, UserX, AlertTriangle, MessageCircle, Pencil 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose 
} from '@/components/ui/sheet'; 
import { useTranslation } from 'react-i18next';

// --- INTERFACES (Ensure these match the interfaces in your Feed.tsx) ---
interface Post {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    image_url: string | null;
    profiles: {
        display_name: string;
        handle: string;
        is_verified: boolean;
        is_organization_verified: boolean;
    };
    replies: any[];
    like_count: number;
    reply_count: number;
    has_liked: boolean;
}

interface AuthUser {
    id: string;
    user_metadata: {
        display_name?: string;
        handle?: string;
        is_verified?: boolean;
        is_organization_verified?: boolean;
    }
}

interface PostActionsSheetProps {
  post: Post;
  user: AuthUser | null; 
  navigate: (path: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string) => void;
  onEdit?: (postId: string) => void;
}

/**
 * Renders a type-safe bottom sheet modal for contextual post actions with a richer UI.
 */
const PostActionsSheet: React.FC<PostActionsSheetProps> = ({ post, user, navigate, onDelete, onReport, onEdit }) => {
    const { t } = useTranslation();
    const isAuthor = user?.id === post.author_id;
    const closeRef = useRef<HTMLButtonElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);
    const [translateY, setTranslateY] = useState(0);
    const [startY, setStartY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
        setTranslateY(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const delta = currentY - startY;
        if (delta > 0) {
            setTranslateY(Math.min(delta, 100)); // Cap the drag distance
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (translateY > 80) { // Threshold for dismiss
            closeRef.current?.click();
        } else {
            setTranslateY(0);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartY(e.clientY);
        setTranslateY(0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const currentY = e.clientY;
        const delta = currentY - startY;
        if (delta > 0) {
            setTranslateY(Math.min(delta, 100));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (translateY > 80) {
            closeRef.current?.click();
        } else {
            setTranslateY(0);
        }
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            handleMouseUp();
        }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        handleMouseMove(e as any);
    };

    const handleGlobalMouseUp = () => {
        if (isDragging) {
            handleMouseUp();
        }
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleDragMouseDown = (e: React.MouseEvent) => {
        handleMouseDown(e);
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleDragMouseLeave = (e: React.MouseEvent) => {
        if (isDragging) {
            handleMouseLeave();
        }
    };

    const handleTouchCancel = () => {
        setIsDragging(false);
        setTranslateY(0);
    };

    const handleMouseCancel = () => {
        setIsDragging(false);
        setTranslateY(0);
    };

    const handleDragMouseUp = (e: React.MouseEvent) => {
        handleMouseUp();
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const renderDragHandle = () => (
        <div
            ref={dragRef}
            className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onMouseDown={handleDragMouseDown}
            onMouseUp={handleDragMouseUp}
            onMouseLeave={handleDragMouseLeave}
            onDragStart={handleDragStart}
        >
            <div className={`w-8 h-1 bg-muted rounded-full transition-transform duration-200 ease-out ${translateY > 0 ? 'scale-x-75' : ''}`} />
        </div>
    );

    const handleViewDetails = () => {
        // Navigates to the single post view
        navigate(`/post/${post.id}`);
    };

    const handleShare = () => {
        const postUrl = `${window.location.origin}/post/${post.id}`;
        
        if (navigator.share) {
            // Use the native Web Share API for a rich experience
            navigator.share({
                title: `Post by @${post.profiles.handle}`,
                text: post.content.substring(0, 100) + '...',
                url: postUrl,
            }).catch(error => console.error('Error sharing:', error));
        } else {
            // Fallback: Copy to clipboard (requires HTTPS)
            navigator.clipboard.writeText(postUrl)
                .then(() => alert('Link copied to clipboard!'))
                .catch(() => alert('Could not copy link.'));
        }
    };

    // --- RENDER LOGIC ---
    const renderActions = () => {
        if (!user) {
            // Richer UI for unauthenticated users with blue login button
            return (
                <div className="px-4 pb-6 space-y-4 bg-background">
                    <div className="text-center text-muted-foreground text-sm py-6">
                        Log in to interact with this post.
                    </div>
                    <SheetClose asChild>
                        <Button 
                            variant="default"
                            className="w-full justify-center py-4 h-auto bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-base rounded-2xl transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]"
                            onClick={() => navigate('/auth')} // Assuming '/auth' is your login route
                        >
                            <LogIn className="h-5 w-5 mr-3 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                            Log In to Engage
                        </Button>
                    </SheetClose>
                </div>
            );
        }

        // Actions for authenticated users - styled to match Twitter UI
        return (
            <div className="transition-transform duration-200 ease-out bg-background" style={{ transform: `translateY(${translateY}px)` }}>
                <div className="px-4">
                    {/* Not interested - mapped to View Details for now */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-3.5 h-auto text-foreground hover:bg-muted/80 text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] group"
                            onClick={handleViewDetails}
                        >
                            <EyeOff className="h-4 w-4 mr-4 flex-shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
                            <span className="font-normal transition-colors duration-300 group-hover:text-foreground">Not interested in this post</span>
                        </Button>
                    </SheetClose>

                    {/* Follow - placeholder, adjust as needed */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-3.5 h-auto text-foreground hover:bg-muted/80 text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] group"
                            onClick={() => navigate(`/profile/${post.profiles.handle}`)}
                        >
                            <UserPlus className="h-4 w-4 mr-4 flex-shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
                            <span className="font-normal transition-colors duration-300 group-hover:text-foreground">Follow @{post.profiles.handle}</span>
                        </Button>
                    </SheetClose>

                    {/* Add/remove from lists */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-3.5 h-auto text-foreground hover:bg-muted/80 text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] group"
                        >
                            <List className="h-4 w-4 mr-4 flex-shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
                            <span className="font-normal transition-colors duration-300 group-hover:text-foreground">Add/remove from lists</span>
                        </Button>
                    </SheetClose>

                    {/* Mute */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-3.5 h-auto text-foreground hover:bg-muted/80 text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] group"
                            onClick={() => navigate(`/profile/${post.profiles.handle}`)}
                        >
                            <Volume2 className="h-4 w-4 mr-4 flex-shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
                            <span className="font-normal transition-colors duration-300 group-hover:text-foreground">Mute @{post.profiles.handle}</span>
                        </Button>
                    </SheetClose>

                    {/* Block */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-3.5 h-auto text-foreground hover:bg-muted/80 text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] group"
                            onClick={() => navigate(`/profile/${post.profiles.handle}`)}
                        >
                            <UserX className="h-4 w-4 mr-4 flex-shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
                            <span className="font-normal transition-colors duration-300 group-hover:text-foreground">Block @{post.profiles.handle}</span>
                        </Button>
                    </SheetClose>

                    {/* Report Post */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-3.5 h-auto text-foreground hover:bg-destructive/10 text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] group" 
                            onClick={() => onReport(post.id)}
                        >
                            <AlertTriangle className="h-4 w-4 mr-4 flex-shrink-0 text-destructive transition-colors duration-300 group-hover:text-destructive/90" />
                            <span className="font-normal text-destructive transition-colors duration-300 group-hover:text-destructive/90">Report post</span>
                        </Button>
                    </SheetClose>

                    {/* Request Community Note */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-3.5 h-auto text-foreground hover:bg-muted/80 text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] hover:shadow-sm group"
                            onClick={() => navigate(`/post/${post.id}/note`)} // Placeholder navigation
                        >
                            <MessageCircle className="h-4 w-4 mr-4 flex-shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
                            <span className="font-normal transition-colors duration-300 group-hover:text-foreground">Request community note</span>
                        </Button>
                    </SheetClose>

                    {/* Edit (Author Only) */}
                    {isAuthor && onEdit && (
                        <SheetClose asChild>
                            <Button 
                                variant="ghost" 
                                className="justify-start w-full text-left py-3.5 h-auto text-foreground hover:bg-muted/80 text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] hover:shadow-sm group"
                                onClick={() => onEdit(post.id)}
                            >
                                <Pencil className="h-4 w-4 mr-4 flex-shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" />
                                <span className="font-normal transition-colors duration-300 group-hover:text-foreground">Edit Post</span>
                            </Button>
                        </SheetClose>
                    )}

                    {/* Delete (Author Only) - added at end with red styling */}
                    {isAuthor && (
                        <SheetClose asChild>
                            <Button 
                                variant="ghost" 
                                className="justify-start w-full text-left py-3.5 h-auto text-destructive hover:bg-destructive/10 font-semibold text-sm rounded-lg transition-all duration-300 ease-out hover:scale-[1.005] group"
                                onClick={() => onDelete(post.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-4 flex-shrink-0 text-destructive transition-colors duration-300 group-hover:text-destructive/90" />
                                <span className="font-semibold text-destructive transition-colors duration-300 group-hover:text-destructive/90">Delete Post</span>
                            </Button>
                        </SheetClose>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0">
                    <Ellipsis className="h-4 w-4 text-muted-foreground" />
                </Button>
            </SheetTrigger>
            
            <SheetContent 
                side="bottom" 
                className="h-auto max-h-[80vh] rounded-t-xl p-0 overflow-hidden transition-transform duration-200 ease-out bg-background"
                style={{ transform: `translateY(${translateY}px)` }}
            >
                {/* Hidden close button for programmatic dismiss */}
                <SheetClose ref={closeRef} className="sr-only" />
                
                {renderDragHandle()}
                
                {renderActions()}
            </SheetContent>
        </Sheet>
    );
};

export default PostActionsSheet;
