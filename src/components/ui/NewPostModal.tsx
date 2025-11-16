import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useXP } from '@/hooks/useXP';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, X, Sparkles, Image as ImageIcon, Loader2, TrendingUp, Wand2, Pencil } from 'lucide-react';
import { ImageEditor } from '@/components/image-editor/ImageEditor';
import { BatchImageEditor } from '@/components/image-editor/BatchImageEditor';
import { postSchema, aiTopicSchema, aiToneSchema, aiLengthSchema } from '@/lib/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useImageDescription } from '@/hooks/useImageDescription';
import { AltTextEditor } from '@/components/ui/AltTextEditor';
import { compressImageFile } from '@/lib/imageCompression';
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
    // Ensured outer card and content are hidden if overflow occurs
    <Card className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-muted/20 to-accent/20 border-border/50 rounded-xl overflow-hidden">
        <CardContent className="p-0">
            {/* KEY FIX: Added 'break-words' to force long strings to wrap and prevent horizontal expansion */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 overflow-hidden break-words">
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
    const { awardXP } = useXP();
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showAIAssist, setShowAIAssist] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiTone, setAiTone] = useState('casual');
    const [aiLength, setAiLength] = useState('medium');
    const [generatingAI, setGeneratingAI] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageAltTexts, setImageAltTexts] = useState<string[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
    const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);
    const [showBatchEditor, setShowBatchEditor] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { generateDescription, isGenerating } = useImageDescription();

    const { remaining, variant, length } = useCharacterCount(newPost);

  const handlePost = async () => {
        // Validation
        if (!user) return;
        
        try {
            postSchema.parse(newPost);
        } catch (error: any) {
            toast.error(error.errors?.[0]?.message || 'Invalid post');
            return;
        }

        setIsPosting(true);
        const postContent = newPost.trim();

        try {
            // Create the post first
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert({
                    content: postContent,
                    author_id: user.id,
                })
                .select()
                .single();

            if (postError) {
                console.error("Supabase Post Error:", postError);
                toast.error('Failed to create post. Please try again.');
                setIsPosting(false);
                return;
            }

            // Upload images if selected
            if (selectedImages.length > 0) {
                setUploadingImage(true);
                
                for (let i = 0; i < selectedImages.length; i++) {
                    const image = selectedImages[i];
                    const fileExt = image.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('post-images')
                        .upload(fileName, image);

                    if (uploadError) {
                        console.error('Image upload error:', uploadError);
                        toast.error(`Failed to upload image ${i + 1}`);
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('post-images')
                        .getPublicUrl(fileName);
                    
                    // Insert into post_images table with alt text
                    await supabase.from('post_images').insert({
                        post_id: postData.id,
                        image_url: publicUrl,
                        display_order: i,
                        alt_text: imageAltTexts[i] || null,
                    });
                }
                
                setUploadingImage(false);
            }

            // Extract URLs and fetch link previews
            const urls = postContent.match(/(https?:\/\/[^\s]+)/g);
            if (urls && urls.length > 0) {
                for (const url of urls.slice(0, 2)) { // Max 2 previews per post
                    try {
                        const { data: previewData } = await supabase.functions.invoke('fetch-link-preview', {
                            body: { url },
                        });
                        
                        if (previewData && !previewData.error) {
                            await supabase.from('post_link_previews').insert({
                                post_id: postData.id,
                                url: previewData.url,
                                title: previewData.title,
                                description: previewData.description,
                                image_url: previewData.image_url,
                                site_name: previewData.site_name,
                            });
                        }
                    } catch (error) {
                        console.error('Failed to fetch link preview:', error);
                    }
                }
            }

            const { error } = { error: null };

            if (error) {
                console.error("Supabase Post Error:", error);
                toast.error('Failed to post. Please try again.');
            } else {
                // Award XP for creating a post
                awardXP('create_post', { content: postContent.substring(0, 50) }, true);
                
                setNewPost(''); 
                setSelectedImages([]);
                setImagePreviews([]);
                setShowPreview(false);
                setShowAIAssist(false);
                setAiTopic('');
                onClose(); // Close modal on success
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
            setUploadingImage(false);
        }
    };

    const handleGenerateAI = async () => {
        // Validate AI inputs
        try {
            aiTopicSchema.parse(aiTopic);
            aiToneSchema.parse(aiTone);
            aiLengthSchema.parse(aiLength);
        } catch (error: any) {
            toast.error(error.errors?.[0]?.message || 'Invalid input');
            return;
        }

        setGeneratingAI(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-post`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        topic: aiTopic,
                        tone: aiTone,
                        length: aiLength,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to generate post');
                return;
            }

            const data = await response.json();
            setNewPost(data.post);
            setShowAIAssist(false);
            toast.success('AI post generated! ✨');
        } catch (error) {
            console.error('AI generation error:', error);
            toast.error('Failed to generate post');
        } finally {
            setGeneratingAI(false);
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

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (selectedImages.length + files.length > 4) {
            toast.error('You can only upload up to 4 images per post');
            return;
        }

        const validFiles: File[] = [];
        const newPreviews: string[] = [];
        let processedCount = 0;

        // Show compression toast
        toast.info('Compressing images...');

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                continue;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is larger than 5MB`);
                continue;
            }

            try {
                // Compress image
                const compressedFile = await compressImageFile(file);
                const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
                
                if (compressedFile.size < file.size) {
                    console.log(`Compressed ${file.name}: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
                }

                validFiles.push(compressedFile);
                const reader = new FileReader();
                reader.onloadend = async () => {
                    newPreviews.push(reader.result as string);
                    processedCount++;
                    if (processedCount === validFiles.length) {
                        setImagePreviews(prev => [...prev, ...newPreviews]);
                        
                        // Auto-generate alt text for new images
                        const newAltTexts: string[] = [];
                        for (const preview of newPreviews) {
                            const altText = await generateDescription(preview);
                            newAltTexts.push(altText || '');
                        }
                        setImageAltTexts(prev => [...prev, ...newAltTexts]);
                        toast.success('Images compressed and ready!');
                    }
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Compression error:', error);
                toast.error(`Failed to compress ${file.name}`);
            }
        }

        setSelectedImages(prev => [...prev, ...validFiles]);
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageAltTexts(prev => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleEditImage = (index: number) => {
        setEditingImageIndex(index);
        setEditingImagePreview(imagePreviews[index]);
        setShowImageEditor(true);
    };

    const handleImageEditorSave = (editedBlob: Blob) => {
        if (editingImageIndex === null) return;

        const file = new File([editedBlob], selectedImages[editingImageIndex]?.name || 'edited-image.png', {
            type: 'image/png',
        });
        
        const newImages = [...selectedImages];
        newImages[editingImageIndex] = file;
        setSelectedImages(newImages);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const newPreviews = [...imagePreviews];
            newPreviews[editingImageIndex] = reader.result as string;
            setImagePreviews(newPreviews);
            setShowImageEditor(false);
            setEditingImagePreview(null);
            setEditingImageIndex(null);
        };
        reader.readAsDataURL(file);
        
        toast.success('Image edited successfully!');
    };

    const handleImageEditorCancel = () => {
        setShowImageEditor(false);
        setEditingImagePreview(null);
    };

    const handleBatchEdit = (editedImages: string[]) => {
        const newFiles: File[] = [];
        editedImages.forEach((dataUrl, index) => {
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], selectedImages[index]?.name || `edited-${index}.jpg`, {
                        type: 'image/jpeg',
                    });
                    newFiles.push(file);
                    
                    if (newFiles.length === editedImages.length) {
                        setSelectedImages(newFiles);
                        setImagePreviews(editedImages);
                    }
                });
        });
    };

    // Fallback for animations
    const MotionDiv = motion ? motion.div : (({ children, ...props }: any) => <div {...props}>{children}</div>);
    const MotionSend = motion ? motion.div : (({ children, ...props }: any) => <div {...props}>{children}</div>);

    return (
        <ErrorBoundary>
            {/* Batch Image Editor Dialog */}
            {showBatchEditor && (
                <BatchImageEditor
                    isOpen={showBatchEditor}
                    onClose={() => setShowBatchEditor(false)}
                    images={imagePreviews}
                    onApply={handleBatchEdit}
                />
            )}

            {/* Image Editor Dialog */}
            {showImageEditor && editingImagePreview && (
                <Dialog open={showImageEditor} onOpenChange={handleImageEditorCancel}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Edit Image</DialogTitle>
                        </DialogHeader>
                        <ImageEditor
                            image={editingImagePreview}
                            onSave={handleImageEditorSave}
                            onCancel={handleImageEditorCancel}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* The Dialog component handles the backdrop click close (the implicit "cancel") */}
            <Dialog open={isOpen} onOpenChange={onClose}>
                {/* DialogContent Styling: Enforced small centered size (90vw and max-w-sm) */}
                <DialogContent className={cn(
                    "w-[90vw] max-w-sm sm:max-w-md rounded-xl shadow-2xl p-0 overflow-hidden border-2 border-primary/50",
                    "data-[state=open]:fixed data-[state=open]:top-[50%] data-[state=open]:left-[50%] data-[state=open]:translate-x-[-50%] data-[state=open]:translate-y-[-50%] data-[state=open]:duration-300",
                    "mx-auto my-8" 
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
                    </MotionDiv>
                    
                    {/* Post Input Area */}
                    <div className="p-4 space-y-4 overflow-hidden"> 

                        {!showAIAssist ? (
                            <>
                                {/* Textarea: Max height and forced vertical scroll, blocked horizontal expansion */}
                                <Textarea
                                    placeholder="Share your thoughts... What's on your mind today? (Text-only, max 280 characters)"
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    maxLength={280}
                                    rows={4}
                                    className={cn(
                                        "mb-3 resize-none focus-visible:ring-primary min-h-[100px] max-h-40 overflow-y-auto overflow-x-hidden",
                                        "placeholder:text-muted-foreground/70"
                                    )}
                                    disabled={isPosting}
                                />

                                {/* Image Upload Section */}
                                <div className="space-y-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                    
                                    {imagePreviews.length === 0 ? (
                                        <Button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            variant="outline"
                                            size="sm"
                                            className="w-full flex items-center gap-2"
                                            disabled={isPosting}
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                            Add Images (Up to 4)
                                        </Button>
                                     ) : (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                {imagePreviews.map((preview, index) => (
                                                    <div 
                                                        key={index} 
                                                        className="space-y-2 cursor-move"
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.effectAllowed = 'move';
                                                            e.dataTransfer.setData('text/html', index.toString());
                                                        }}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            e.dataTransfer.dropEffect = 'move';
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
                                                            const dropIndex = index;
                                                            if (dragIndex !== dropIndex) {
                                                                const newPreviews = [...imagePreviews];
                                                                const newAltTexts = [...imageAltTexts];
                                                                const newFiles = [...selectedImages];
                                                                
                                                                const [draggedPreview] = newPreviews.splice(dragIndex, 1);
                                                                const [draggedAlt] = newAltTexts.splice(dragIndex, 1);
                                                                const [draggedFile] = newFiles.splice(dragIndex, 1);
                                                                
                                                                newPreviews.splice(dropIndex, 0, draggedPreview);
                                                                newAltTexts.splice(dropIndex, 0, draggedAlt);
                                                                newFiles.splice(dropIndex, 0, draggedFile);
                                                                
                                                                setImagePreviews(newPreviews);
                                                                setImageAltTexts(newAltTexts);
                                                                setSelectedImages(newFiles);
                                                            }
                                                        }}
                                                    >
                                                        <div className="relative rounded-lg overflow-hidden border-2 border-border group">
                                                            <div className="absolute top-1 left-1 bg-background/80 text-xs px-2 py-0.5 rounded z-10">
                                                                {index + 1}
                                                            </div>
                                                            <img 
                                                                src={preview} 
                                                                alt={imageAltTexts[index] || `Preview ${index + 1}`} 
                                                                className="w-full h-32 object-cover"
                                                            />
                                                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => handleEditImage(index)}
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    disabled={isPosting || uploadingImage}
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => handleRemoveImage(index)}
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    disabled={isPosting || uploadingImage}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            {uploadingImage && (
                                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <AltTextEditor
                                                            value={imageAltTexts[index] || ''}
                                                            onChange={(value) => {
                                                                const newAltTexts = [...imageAltTexts];
                                                                newAltTexts[index] = value;
                                                                setImageAltTexts(newAltTexts);
                                                            }}
                                                            onGenerate={async () => {
                                                                const description = await generateDescription(preview);
                                                                if (description) {
                                                                    const newAltTexts = [...imageAltTexts];
                                                                    newAltTexts[index] = description;
                                                                    setImageAltTexts(newAltTexts);
                                                                    toast.success('Alt text generated!');
                                                                }
                                                            }}
                                                            isGenerating={isGenerating}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {imagePreviews.length < 4 && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 flex items-center gap-2"
                                                        disabled={isPosting}
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                        Add More ({4 - imagePreviews.length})
                                                    </Button>
                                                )}
                                                {imagePreviews.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => setShowBatchEditor(true)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="flex-1 flex items-center gap-2"
                                                        disabled={isPosting || uploadingImage}
                                                    >
                                                        <Wand2 className="h-4 w-4" />
                                                        Batch Edit
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* AI Assist Button */}
                                <Button
                                    onClick={() => setShowAIAssist(true)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full flex items-center gap-2"
                                >
                                    <Wand2 className="h-4 w-4" />
                                    Need help? Let AI generate a post
                                </Button>

                                {/* Character counter with progress bar */}
                                <div className="flex items-center justify-between">
                                    <Badge variant={variant as "default" | "destructive" | "outline" | "secondary"} className="text-xs">
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
                            </>
                        ) : (
                            <>
                                {/* AI Generation Form */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Wand2 className="h-4 w-4 text-primary" />
                                            AI Post Generator
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAIAssist(false)}
                                        >
                                            Back
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="topic" className="text-xs">What's your topic?</Label>
                                            <Input
                                                id="topic"
                                                value={aiTopic}
                                                onChange={(e) => setAiTopic(e.target.value)}
                                                placeholder="e.g., morning motivation, tech trends, funny story..."
                                                className="mt-1"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="tone" className="text-xs">Tone</Label>
                                            <Select value={aiTone} onValueChange={setAiTone}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="casual">Casual & Friendly</SelectItem>
                                                    <SelectItem value="professional">Professional</SelectItem>
                                                    <SelectItem value="funny">Funny & Entertaining</SelectItem>
                                                    <SelectItem value="inspiring">Motivational</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="length" className="text-xs">Length</Label>
                                            <Select value={aiLength} onValueChange={setAiLength}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="short">Short (50-100 chars)</SelectItem>
                                                    <SelectItem value="medium">Medium (100-200 chars)</SelectItem>
                                                    <SelectItem value="long">Long (200-280 chars)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleGenerateAI}
                                        disabled={generatingAI || !aiTopic.trim()}
                                        className="w-full"
                                    >
                                        {generatingAI ? (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Generate Post
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </ErrorBoundary>
    );
};

export default NewPostModal;
