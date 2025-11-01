import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, X, Sparkles, TrendingUp, Calendar, Clock, Edit2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { format } from 'date-fns';

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

// Interactive preview component for post
const PostPreview = ({ content, scheduledAt, onEdit, previewMode }: { content: string; scheduledAt?: Date; onEdit: () => void; previewMode: boolean }) => {
    const [likes, setLikes] = useState(0);
    const [showReplies, setShowReplies] = useState(false);

    const handleLike = () => setLikes(likes + (likes > 0 ? -1 : 1)); // Toggle like
    const handleShare = () => toast.success('Copied to clipboard! 📋');

    return (
        <Card className="mt-4 p-4 bg-gradient-to-r from-muted/20 to-accent/20 border-accent/30 rounded-xl shadow-sm relative border">
            <CardContent className="p-0">
                {/* Edit/Preview Toggle */}
                <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                        variant={previewMode ? "outline" : "default"}
                        size="sm"
                        className="h-6 px-2 text-xs rounded-full"
                        onClick={onEdit}
                    >
                        {previewMode ? <Edit2 className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                </div>

                <div className="flex items-start gap-3 mb-3">
                    {/* Avatar Placeholder */}
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">Amkaweesi</span>
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                            {scheduledAt ? (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Scheduled
                                </Badge>
                            ) : (
                                <span className="text-xs text-muted-foreground">· {new Date().toLocaleDateString()}</span>
                            )}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 mb-4">
                            {content || "Your post will appear here..."}
                        </p>
                            {scheduledAt && (
                                <div className="bg-primary/10 p-2 rounded-lg text-xs text-primary/80">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>Will post on {format(scheduledAt, 'MMM dd, yyyy at h:mm a')}</span>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>

                {/* Interactive Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/20">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs hover:bg-muted/50 transition-colors" 
                            onClick={handleLike}
                        >
                            <Heart className={cn("h-4 w-4 mr-1 transition-colors", likes > 0 && "fill-red-500 text-red-500")} />
                            {likes > 0 ? `${likes} Liked` : 'Like'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs hover:bg-muted/50 transition-colors" 
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Reply
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs hover:bg-muted/50 transition-colors" 
                            onClick={handleShare}
                        >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                        </Button>
                    </div>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Posted now
                    </Badge>
                </div>

                {/* Fake Replies (Interactive Expand/Collapse) */}
                {showReplies && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-start gap-2 text-xs">
                            <div className="w-6 h-6 bg-secondary rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <span className="font-medium">Afu User</span>
                                <p className="text-muted-foreground">Great post! 🚀 What inspired this?</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                            <div className="w-6 h-6 bg-secondary rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <span className="font-medium">Another User</span>
                                <p className="text-muted-foreground">Totally agree! Can't wait for more.</p>
                            </div>
                        </div>
                        <div className="pt-2 mt-2 border-t border-border/20 text-xs text-muted-foreground text-center">
                            Add a reply...
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Fallback class merger
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

// NOTE: Component declaration should use React.FC<NewPostModalProps>
const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);

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
            // Database insert with optional scheduled_at
            const { error } = await supabase.from('posts').insert({
                content: postContent,
                author_id: user.id,
                scheduled_at: scheduledAt, // If set, use for scheduling
            });

            if (error) {
                console.error("Supabase Post Error:", error);
                toast.error('Failed to schedule post. Please try again.');
            } else {
                setNewPost(''); 
                setShowPreview(false);
                setPreviewMode(false);
                setScheduledAt(undefined);
                onClose(); // Close modal on success
                // Success toast handled by the real-time subscription in Feed.tsx 
                toast.success(scheduledAt ? 'Scheduled! ⏰' : 'Post created! ✨', {
                    description: scheduledAt ? `Will post on ${format(scheduledAt, 'MMM dd, yyyy at h:mm a')}` : 'Your thoughts are now live.',
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* DialogContent: Rich design with rounded corners and high shadow */}
            <DialogContent className="sm:max-w-[425px] rounded-xl shadow-2xl p-0">
                <DialogHeader className="p-4 border-b border-muted-foreground/10 flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-secondary/5">
                    <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        {scheduledAt ? 'Schedule Post' : 'Create New Post'}
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
                </DialogHeader>
                
                {/* Post Input Area: Elevated Card Style */}
                <div className="p-4 space-y-4">
                    {!previewMode ? (
                        <Card className="p-5 rounded-xl shadow-lg border-none"> 
                            <Textarea
                                placeholder="What's happening? (Text-only, max 280 characters)"
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                maxLength={280}
                                rows={5}
                                className="mb-3 resize-none focus-visible:ring-primary min-h-[100px] placeholder:text-muted-foreground/70"
                                disabled={isPosting}
                            />
                            <div className="flex justify-between items-center">
                                {/* Character counter with progress bar */}
                                <div className="flex items-center gap-2">
                                    <Badge variant={variant} className="text-xs">
                                        {remaining} left
                                    </Badge>
                                    <div className="w-20 bg-muted rounded-full h-1.5">
                                        <div 
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                length > 250 ? "bg-destructive" : length > 200 ? "bg-secondary" : "bg-primary"
                                            }`} 
                                            style={{ width: `${(length / 280) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => setPreviewMode(true)} 
                                    disabled={isPosting || !newPost.trim()} 
                                    className="flex items-center space-x-2 shadow-md rounded-full px-5 text-xs"
                                    variant="outline"
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Preview</span>
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <PostPreview 
                            content={newPost} 
                            scheduledAt={scheduledAt}
                            onEdit={() => setPreviewMode(false)} 
                            previewMode={true} 
                        />
                    )}

                    {/* Scheduling Section */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Schedule for Later (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {scheduledAt ? format(scheduledAt, 'PPP') : <span className="text-muted-foreground">Pick a date & time</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                {/* Simple date/time picker - extend with full calendar if needed */}
                                <Input
                                    type="datetime-local"
                                    value={scheduledAt ? format(scheduledAt, 'yyyy-MM-dd'T'HH:mm') : ''}
                                    onChange={(e) => setScheduledAt(e.target.value ? new Date(e.target.value) : undefined)}
                                    className="border-0 shadow-none focus-visible:ring-0"
                                />
                            </PopoverContent>
                        </Popover>
                        {scheduledAt && (
                            <div className="text-xs text-muted-foreground mt-1">
                                Will post at {format(scheduledAt, 'h:mm a on MMM dd, yyyy')}
                            </div>
                        )}
                    </div>

                    <Separator />

                    <Button 
                        onClick={previewMode ? handlePost : undefined} 
                        disabled={!newPost.trim() || newPost.length > 280 || isPosting} 
                        className="w-full flex items-center justify-center space-x-2 shadow-md rounded-full px-5 py-3 h-12 font-bold transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                        style={newPost.trim() && newPost.length <= 280 && !isPosting ? { background: 'linear-gradient(to right, var(--primary), var(--secondary))' } : {}}
                    >
                        <Send className={`h-4 w-4 ${isPosting && "animate-spin"}`} />
                        <span>{isPosting ? 'Scheduling...' : previewMode ? (scheduledAt ? 'Schedule Post' : 'Share Post') : 'Continue to Preview'}</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewPostModal;
