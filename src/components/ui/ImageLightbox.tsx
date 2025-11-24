import { useState, useEffect, useRef } from 'react';
import { X, Share2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageLightboxProps {
  images: Array<{ url: string; alt?: string }>;
  initialIndex: number;
  onClose: (e?: React.MouseEvent) => void;
}

export const ImageLightbox = ({ images, initialIndex, onClose }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetTransform();
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    resetTransform();
  };

  const resetTransform = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(1, scale + delta), 5);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, distance: 0 };
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current.distance = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current.distance > 0) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance / touchStartRef.current.distance;
      const newScale = Math.min(Math.max(1, scale * delta), 5);
      setScale(newScale);
      touchStartRef.current.distance = distance;
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && scale === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
      if (Math.abs(deltaX) > 100 && deltaY < 50) {
        if (deltaX > 0) goToPrevious();
        else goToNext();
      }
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const currentImage = images[currentIndex];
    if (navigator.share) {
      try {
        await navigator.share({ url: currentImage.url, title: currentImage.alt || 'Image' });
        toast.success('Shared successfully!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      await navigator.clipboard.writeText(currentImage.url);
      toast.success('Image URL copied to clipboard!');
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const currentImage = images[currentIndex];
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (err) {
      toast.error('Failed to download image');
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose(e);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only close if clicking the background, not the image
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      e.preventDefault();
      onClose(e);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button variant="ghost" size="icon" onClick={handleDownload} className="bg-background/10 hover:bg-background/20 text-white">
          <Download className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleShare} className="bg-background/10 hover:bg-background/20 text-white">
          <Share2 className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleClose} className="bg-background/10 hover:bg-background/20 text-white">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || 'Image'}
          className="max-w-[90vw] max-h-[90vh] object-contain select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/10 hover:bg-background/20 text-white"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/10 hover:bg-background/20 text-white"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  e.preventDefault(); 
                  setCurrentIndex(index); 
                  resetTransform(); 
                }}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/40 w-2'
                )}
              />
            ))}
          </div>
        </>
      )}

      {scale > 1 && (
        <div className="absolute bottom-6 right-6 text-white text-sm bg-background/10 px-3 py-1 rounded">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};
