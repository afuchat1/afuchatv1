import { FileText, Image as ImageIcon, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAttachmentUrl } from '@/hooks/useAttachmentUrl';

interface AttachmentPreviewProps {
  url: string;
  type: string;
  name: string;
  size?: number;
  isOwn?: boolean;
  onDownload?: () => void;
}

export const AttachmentPreview = ({ 
  url, 
  type, 
  name, 
  size,
  isOwn = false,
  onDownload 
}: AttachmentPreviewProps) => {
  const { url: signedUrl, loading } = useAttachmentUrl(url);
  const isImage = type.startsWith('image/');
  
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="w-[280px] h-[180px] bg-muted/50 rounded-lg animate-pulse" />;
  }

  if (isImage && signedUrl) {
    return (
      <div className="relative max-w-[280px] rounded-lg overflow-hidden">
        <img 
          src={signedUrl} 
          alt={name}
          className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
          onClick={onDownload}
        />
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isOwn ? 'bg-primary-foreground/10' : 'bg-muted'
      } max-w-[280px] cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={onDownload}
    >
      <div className={`p-2 rounded-lg ${isOwn ? 'bg-primary-foreground/20' : 'bg-background'}`}>
        <FileText className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>
          {name}
        </p>
        {size && (
          <p className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {formatSize(size)}
          </p>
        )}
      </div>
      <Download className="h-4 w-4 flex-shrink-0 opacity-70" />
    </div>
  );
};
