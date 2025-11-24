import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNexa } from '@/hooks/useNexa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { X, Sparkles, Image as ImageIcon, Globe } from 'lucide-react';
import { ImageEditor } from '@/components/image-editor/ImageEditor';
import { BatchImageEditor } from '@/components/image-editor/BatchImageEditor';
import { postSchema } from '@/lib/validation';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useImageDescription } from '@/hooks/useImageDescription';
import { AltTextEditor } from '@/components/ui/AltTextEditor';
import { compressImageFile } from '@/lib/imageCompression';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useLinkPreview } from '@/hooks/useLinkPreview';
import { LinkPreviewCard } from '@/components/ui/LinkPreviewCard';
import { extractUrls } from '@/lib/postUtils';

interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { awardNexa } = useNexa();
    
    // AI Features coming soon
    const AI_COMING_SOON = true;
    
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [showAIDialog, setShowAIDialog] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [generatingAI, setGeneratingAI] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageAltTexts, setImageAltTexts] = useState<string[]>([]);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
    const [editingImagePreview, setEditingImagePreview] = useState<string>('');
    const [showBatchEditor, setShowBatchEditor] = useState(false);
    const [showAltTextEditor, setShowAltTextEditor] = useState(false);
    const [editingAltTextIndex, setEditingAltTextIndex] = useState<number | null>(null);
    const [userProfile, setUserProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { generateDescription, isGenerating } = useImageDescription();
    const { fetchPreview } = useLinkPreview();
    const [linkPreviews, setLinkPreviews] = useState<any[]>([]);

    const charCount = 280 - newPost.length;
    const charCountColor = charCount < 20 ? 'text-destructive' : charCount < 50 ? 'text-warning' : 'text-muted-foreground';

    React.useEffect(() => {
        if (user) {
            supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', user.id)
                .single()
                .then(({ data }) => {
                    if (data) setUserProfile(data);
                });
        }
    }, [user]);

    // Handle mobile keyboard visibility
    React.useEffect(() => {
        if (!isOpen) return;

        const handleResize = () => {
            // Adjust sheet position when keyboard appears on mobile
            if (window.visualViewport) {
                const viewportHeight = window.visualViewport.height;
                document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
            handleResize();
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
        };
    }, [isOpen]);

    const handleClose = () => {
        setNewPost('');
        setSelectedImages([]);
        setImagePreviews([]);
        setImageAltTexts([]);
        setShowAIDialog(false);
        setAiTopic('');
        setLinkPreviews([]);
        onClose();
    };

    const handlePost = async () => {
        if (!newPost.trim() && selectedImages.length === 0) {
            toast.error('Post cannot be empty');
            return;
        }

        const validation = postSchema.safeParse(newPost);
        if (!validation.success) {
            toast.error(validation.error.errors[0].message);
            return;
        }

        setIsPosting(true);

        try {
            const imageUrls: string[] = [];
            
            for (let i = 0; i < selectedImages.length; i++) {
                const file = selectedImages[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${user?.id}-${Date.now()}-${i}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(fileName);
                
                imageUrls.push(publicUrl);
            }

            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert({
                    content: newPost,
                    author_id: user?.id,
                    image_url: imageUrls.length > 0 ? imageUrls[0] : null,
                })
                .select()
                .single();

            if (postError) throw postError;

            if (imageUrls.length > 0 && postData) {
                const imageInserts = imageUrls.map((url, index) => ({
                    post_id: postData.id,
                    image_url: url,
                    display_order: index,
                    alt_text: imageAltTexts[index] || '',
                }));

                const { error: imageError } = await supabase
                    .from('post_images')
                    .insert(imageInserts);

                if (imageError) throw imageError;
            }

            // Save link previews
            if (linkPreviews.length > 0 && postData) {
                const previewInserts = linkPreviews.map(preview => ({
                    post_id: postData.id,
                    url: preview.url,
                    title: preview.title,
                    description: preview.description,
                    image_url: preview.image_url,
                    site_name: preview.site_name,
                }));

                await supabase.from('post_link_previews').insert(previewInserts);
            }

            toast.success('Post created successfully!');
            handleClose();
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error('Failed to create post. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleAIGenerate = async () => {
        // AI Features coming soon - don't execute
        if (AI_COMING_SOON) {
            toast.info('AI features are coming soon! 🚀');
            return;
        }

        if (!aiTopic.trim()) {
            toast.error('Please enter a topic');
            return;
        }

        setGeneratingAI(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-post', {
                body: { topic: aiTopic, tone: 'casual', length: 'medium' }
            });

            if (error) throw error;
            
            // Ensure we have a valid post string
            if (!data || typeof data.post !== 'string') {
                throw new Error('Invalid response from AI service');
            }
            
            setNewPost(data.post);
            setShowAIDialog(false);
            setAiTopic('');
            toast.success('AI post generated! ✨');
        } catch (error) {
            console.error('AI generation error:', error);
            toast.error('Failed to generate post');
        } finally {
            setGeneratingAI(false);
        }
    };

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
                const compressedFile = await compressImageFile(file);
                validFiles.push(compressedFile);
                const reader = new FileReader();
                reader.onloadend = async () => {
                    newPreviews.push(reader.result as string);
                    processedCount++;
                    if (processedCount === validFiles.length) {
                        setSelectedImages(prev => [...prev, ...validFiles]);
                        setImagePreviews(prev => [...prev, ...newPreviews]);
                        // Skip AI description generation - add empty alt texts
                        const newAltTexts: string[] = newPreviews.map(() => '');
                        setImageAltTexts(prev => [...prev, ...newAltTexts]);
                        toast.success('Images ready!');
                    }
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Compression error:', error);
                toast.error(`Failed to compress ${file.name}`);
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageAltTexts(prev => prev.filter((_, i) => i !== index));
    };

    const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setNewPost(text);
        
        const urls = extractUrls(text);
        for (const url of urls) {
            if (!linkPreviews.find(p => p.url === url)) {
                const preview = await fetchPreview(url);
                if (preview) {
                    setLinkPreviews(prev => [...prev, preview]);
                }
            }
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={handleClose}>
                <SheetContent 
                    side="bottom" 
                    className="max-w-2xl mx-auto p-0 gap-0 overflow-y-auto sheet-mobile-keyboard bg-gradient-to-b from-background via-background to-primary/5"
                    onOpenChange={handleClose}
                    style={{
                        position: 'fixed',
                        bottom: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '100%',
                        maxWidth: '42rem',
                        maxHeight: 'var(--viewport-height, 90vh)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-end px-6 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-xl z-10 shadow-sm">
                        <Button
                            onClick={handlePost}
                            disabled={isPosting || (!newPost.trim() && selectedImages.length === 0)}
                            className="rounded-full px-8 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 bg-gradient-to-r from-primary to-accent"
                            size="lg"
                        >
                            {isPosting ? (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                'Post'
                            )}
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-4 pb-safe">
                        <div className="flex gap-3">
                            {/* Avatar */}
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={userProfile?.avatar_url || undefined} alt={userProfile?.display_name || 'You'} />
                              <AvatarFallback>{(userProfile?.display_name || 'You').charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            {/* Post Content */}
                            <div className="flex-1 min-w-0">
                                <Textarea
                                    ref={textareaRef}
                                    value={newPost}
                                    onChange={handleTextChange}
                                    placeholder="What's happening?"
                                    className="min-h-[120px] text-lg border-0 shadow-none resize-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/50"
                                    style={{
                                        WebkitUserSelect: 'text',
                                        userSelect: 'text'
                                    }}
                                />

                                {/* Link Previews */}
                                {linkPreviews.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {linkPreviews.map((preview, index) => (
                                            <LinkPreviewCard key={index} {...preview} />
                                        ))}
                                    </div>
                                )}

                                {/* Image Previews */}
                                {imagePreviews.length > 0 && (
                                    <div className={cn(
                                        "mt-3 gap-2 rounded-2xl overflow-hidden border border-border/50",
                                        imagePreviews.length === 1 && "grid grid-cols-1",
                                        imagePreviews.length === 2 && "grid grid-cols-2",
                                        imagePreviews.length >= 3 && "grid grid-cols-2"
                                    )}>
                                        {imagePreviews.map((preview, index) => (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "relative group aspect-square overflow-hidden bg-muted",
                                                    imagePreviews.length === 3 && index === 0 && "col-span-2"
                                                )}
                                            >
                                                <img
                                                    src={preview}
                                                    alt={`Upload ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Bottom Toolbar */}
                                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
                                        >
                                            <ImageIcon className="h-5 w-5" />
                                        </Button>
                                        {/* AI Generation disabled for users */}
                                        {/* <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (AI_COMING_SOON) {
                                                    toast.info('AI features are coming soon! 🚀');
                                                } else {
                                                    setShowAIDialog(true);
                                                }
                                            }}
                                            className="h-9 w-9 rounded-full text-primary hover:bg-primary/10 relative"
                                            title={AI_COMING_SOON ? "Coming Soon" : "Generate with AI"}
                                        >
                                            <Sparkles className="h-5 w-5" />
                                            {AI_COMING_SOON && (
                                                <Badge 
                                                    variant="secondary" 
                                                    className="absolute -top-1 -right-1 text-[8px] px-1 py-0 h-4"
                                                >
                                                    Soon
                                                </Badge>
                                            )}
                                        </Button> */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
                                        >
                                            <Globe className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    {/* Character Count */}
                                    {newPost.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-sm tabular-nums", charCountColor)}>
                                                {charCount}
                                            </span>
                                            <div className="w-8 h-8 relative">
                                                <svg className="transform -rotate-90 w-8 h-8">
                                                    <circle
                                                        cx="16"
                                                        cy="16"
                                                        r="14"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                        className="text-muted/20"
                                                    />
                                                    <circle
                                                        cx="16"
                                                        cy="16"
                                                        r="14"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                        strokeDasharray={`${2 * Math.PI * 14}`}
                                                        strokeDashoffset={`${2 * Math.PI * 14 * (1 - newPost.length / 280)}`}
                                                        className={cn(
                                                            "transition-all",
                                                            charCount < 20 ? "text-destructive" : 
                                                            charCount < 50 ? "text-warning" : "text-primary"
                                                        )}
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                </SheetContent>
            </Sheet>

            {/* AI Sheet */}
            <Sheet open={showAIDialog} onOpenChange={setShowAIDialog}>
                <SheetContent side="bottom" className="max-w-md mx-auto" onOpenChange={setShowAIDialog}>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">AI Post Generator</h3>
                            <p className="text-sm text-muted-foreground">
                                Tell AI what you want to post about
                            </p>
                        </div>
                        <Textarea
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="E.g., my thoughts on climate change..."
                            className="min-h-[100px]"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={handleAIGenerate}
                                disabled={generatingAI || !aiTopic.trim()}
                                className="flex-1"
                            >
                                {generatingAI ? (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generating
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Image Editor */}
            {showImageEditor && editingImagePreview && (
                <ImageEditor
                    image={editingImagePreview}
                    onSave={(blob) => {
                        if (editingImageIndex !== null) {
                            const file = new File([blob], selectedImages[editingImageIndex]?.name || 'edited.png', {
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
                            };
                            reader.readAsDataURL(file);
                        }
                        setShowImageEditor(false);
                        setEditingImageIndex(null);
                    }}
                    onCancel={() => {
                        setShowImageEditor(false);
                        setEditingImageIndex(null);
                    }}
                />
            )}

            {/* Batch Editor */}
            {showBatchEditor && imagePreviews.length > 0 && (
                <BatchImageEditor
                    isOpen={showBatchEditor}
                    onClose={() => setShowBatchEditor(false)}
                    images={imagePreviews}
                    onApply={(editedImages) => {
                        setImagePreviews(editedImages);
                        setShowBatchEditor(false);
                    }}
                />
            )}

            {/* Alt Text Editor removed - simplified design */}
        </>
    );
};

export default NewPostModal;
