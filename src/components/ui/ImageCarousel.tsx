import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

export const ImageCarousel = ({ images, className }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const gridClass = images.length === 1 
    ? 'grid-cols-1'
    : images.length === 2
    ? 'grid-cols-2'
    : images.length === 3
    ? 'grid-cols-2'
    : 'grid-cols-2';

  return (
    <div className={cn('relative group', className)}>
      {images.length === 1 ? (
        <div className="relative rounded-2xl overflow-hidden border border-border">
          <img
            src={images[0]}
            alt="Post image"
            className="w-full max-h-[500px] object-cover"
          />
        </div>
      ) : (
        <div className={cn('grid gap-0.5 rounded-2xl overflow-hidden border border-border', gridClass)}>
          {images.slice(0, 4).map((image, index) => (
            <div
              key={index}
              className={cn(
                'relative aspect-square overflow-hidden',
                images.length === 3 && index === 0 && 'row-span-2'
              )}
            >
              <img
                src={image}
                alt={`Post image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {images.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 1 && (
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
            {images.map((_, index) => (
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
