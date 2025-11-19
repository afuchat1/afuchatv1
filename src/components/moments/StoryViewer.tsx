import { useEffect, useState } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  expires_at: string;
  created_at: string;
  view_count: number;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    handle: string;
  };
}

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onDelete: (storyId: string) => void;
  canDelete: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const StoryViewer = ({ 
  story, 
  onClose, 
  onDelete, 
  canDelete,
  onNext,
  onPrevious 
}: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const duration = story.media_type === 'video' ? 15000 : 5000; // 15s for video, 5s for image

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (onNext) {
            onNext();
          } else {
            onClose();
          }
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onNext, onClose]);

  const handlePrevious = () => {
    if (onPrevious) {
      setProgress(0);
      onPrevious();
    }
  };

  const handleNext = () => {
    if (onNext) {
      setProgress(0);
      onNext();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <Progress value={progress} className="mb-4 h-1" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-white">
              <AvatarImage src={story.profiles.avatar_url || undefined} />
              <AvatarFallback>{story.profiles.display_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{story.profiles.display_name}</p>
              <p className="text-xs text-white/80">
                {new Date(story.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  if (confirm('Delete this story?')) {
                    onDelete(story.id);
                  }
                }}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Areas */}
      <div className="absolute inset-0 flex">
        {/* Previous Area */}
        {onPrevious && (
          <div 
            className="w-1/3 cursor-pointer flex items-center justify-start pl-4"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        )}
        
        {/* Media Area */}
        <div className="flex-1 flex items-center justify-center">
          {story.media_type === 'image' ? (
            <img 
              src={story.media_url} 
              alt="Story" 
              className="max-h-screen max-w-full object-contain"
            />
          ) : (
            <video 
              src={story.media_url} 
              className="max-h-screen max-w-full object-contain"
              autoPlay
              loop
              playsInline
            />
          )}
        </div>

        {/* Next Area */}
        {onNext && (
          <div 
            className="w-1/3 cursor-pointer flex items-center justify-end pr-4"
            onClick={handleNext}
          >
            <ChevronRight className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-center">{story.caption}</p>
        </div>
      )}
    </div>
  );
};
