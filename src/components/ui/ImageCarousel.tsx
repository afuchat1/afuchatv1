import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: Array<{ url: string; alt?: string }> | string[];
  className?: string;
}

export const ImageCarousel = ({ images, className }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const imageUrls = images.map(img => typeof img === 'string' ? img : img.url);
  const imageAlts = images.map(img => typeof img === 'string' ? 'Post image' : (img.alt || 'Post image'));

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const gridClass = imageUrls.length === 1 
    ? 'grid-cols-1'
    : imageUrls.length === 2
    ? 'grid-cols-2'
    : imageUrls.length === 3
    ? 'grid-cols-2'
    : 'grid-cols-2';

  return (
    <div className={cn('relative group', className)}>
      {imageUrls.length === 1 ? (
        <div className="relative rounded-2xl overflow-hidden border border-border">
          <img
            src={imageUrls[0]}
            alt={imageAlts[0]}
            className="w-full max-h-[500px] object-cover"
          />
        </div>
      ) : (
        <div className={cn('grid gap-0.5 rounded-2xl overflow-hidden border border-border', gridClass)}>
          {imageUrls.slice(0, 4).map((image, index) => (
            <div
              key={index}
              className={cn(
                'relative aspect-square overflow-hidden',
                imageUrls.length === 3 && index === 0 && 'row-span-2'
              )}
            >
              <img
                src={image}
                alt={imageAlts[index]}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {imageUrls.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{imageUrls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {imageUrls.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-primary w-6'
                    : 'bg-muted-foreground/40 w-1.5 hover:bg-muted-foreground/60'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
