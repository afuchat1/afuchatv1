import { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { ImageLightbox } from './ImageLightbox';

interface ImageCarouselProps {
  images: Array<{ url: string; alt?: string }> | string[];
  className?: string;
}

export const ImageCarousel = memo(({ images, className }: ImageCarouselProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const imageUrls = images.map(img => typeof img === 'string' ? img : img.url);
  const imageAlts = images.map(img => typeof img === 'string' ? 'Post image' : (img.alt || 'Post image'));

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const imageObjects = images.map(img => typeof img === 'string' ? { url: img, alt: 'Post image' } : img);

  // X/Twitter style image layouts
  return (
    <>
      <div className={cn('relative', className)}>
        {/* Single Image */}
        {imageUrls.length === 1 && (
          <div 
            className="rounded-2xl overflow-hidden border border-border cursor-pointer"
            onClick={(e) => handleImageClick(e, 0)}
          >
            <img
              src={imageUrls[0]}
              alt={imageAlts[0]}
              loading="lazy"
              decoding="async"
              className="w-full max-h-[510px] object-cover hover:brightness-95 transition-all"
            />
          </div>
        )}

        {/* Two Images - Side by side */}
        {imageUrls.length === 2 && (
          <div className="grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-border">
            {imageUrls.map((image, index) => (
              <div
                key={index}
                className="relative aspect-[4/5] overflow-hidden cursor-pointer"
                onClick={(e) => handleImageClick(e, index)}
              >
                <img
                  src={image}
                  alt={imageAlts[index]}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover hover:brightness-95 transition-all"
                />
              </div>
            ))}
          </div>
        )}

        {/* Three Images - One large left, two stacked right */}
        {imageUrls.length === 3 && (
          <div className="grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-border aspect-[16/9]">
            <div
              className="relative row-span-2 overflow-hidden cursor-pointer"
              onClick={(e) => handleImageClick(e, 0)}
            >
              <img
                src={imageUrls[0]}
                alt={imageAlts[0]}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover hover:brightness-95 transition-all"
              />
            </div>
            <div
              className="relative overflow-hidden cursor-pointer"
              onClick={(e) => handleImageClick(e, 1)}
            >
              <img
                src={imageUrls[1]}
                alt={imageAlts[1]}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover hover:brightness-95 transition-all"
              />
            </div>
            <div
              className="relative overflow-hidden cursor-pointer"
              onClick={(e) => handleImageClick(e, 2)}
            >
              <img
                src={imageUrls[2]}
                alt={imageAlts[2]}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover hover:brightness-95 transition-all"
              />
            </div>
          </div>
        )}

        {/* Four+ Images - 2x2 Grid */}
        {imageUrls.length >= 4 && (
          <div className="grid grid-cols-2 gap-0.5 rounded-2xl overflow-hidden border border-border aspect-square">
            {imageUrls.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className="relative overflow-hidden cursor-pointer"
                onClick={(e) => handleImageClick(e, index)}
              >
                <img
                  src={image}
                  alt={imageAlts[index]}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover hover:brightness-95 transition-all"
                />
                {/* Show +N overlay on 4th image if more than 4 */}
                {imageUrls.length > 4 && index === 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{imageUrls.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={imageObjects}
          initialIndex={lightboxIndex}
          onClose={(e) => {
            e?.stopPropagation();
            e?.preventDefault();
            setLightboxOpen(false);
          }}
        />
      )}
    </>
  );
});
