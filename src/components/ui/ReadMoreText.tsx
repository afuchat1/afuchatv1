import { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { toRenderableText } from '@/lib/textUtils';

interface ReadMoreTextProps {
  text: React.ReactNode;
  maxLines?: number;
  className?: string;
}

export const ReadMoreText = ({ text, maxLines = 4, className = '' }: ReadMoreTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Ensure text is safely renderable
  const safeText = toRenderableText(text);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(contentRef.current).lineHeight);
      const height = contentRef.current.scrollHeight;
      const lines = height / lineHeight;
      
      setShouldShowButton(lines > maxLines);
    }
  }, [safeText, maxLines]);

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all ${
          !isExpanded && shouldShowButton ? `line-clamp-${maxLines}` : ''
        }`}
        style={!isExpanded && shouldShowButton ? { 
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
        } : {}}
      >
        {safeText}
      </div>
      {shouldShowButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-primary hover:text-primary/80 p-0 h-auto font-normal mt-1"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </Button>
      )}
    </div>
  );
};
