import { ExternalLink } from 'lucide-react';
import { Card } from './card';

interface LinkPreviewCardProps {
  url: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  site_name?: string | null;
}

export const LinkPreviewCard = ({
  url,
  title,
  description,
  image_url,
  site_name,
}: LinkPreviewCardProps) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer border border-border/50">
        <div className="flex gap-3">
          {image_url && (
            <div className="w-32 h-32 flex-shrink-0">
              <img
                src={image_url}
                alt={title || 'Link preview'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 p-3 min-w-0">
            {site_name && (
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {site_name}
              </p>
            )}
            {title && (
              <h4 className="text-sm font-semibold line-clamp-2 mb-1">
                {title}
              </h4>
            )}
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </Card>
    </a>
  );
};
