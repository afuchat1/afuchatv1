import { Skeleton } from '@/components/ui/skeleton';

const PostSkeleton = () => (
  <div className="p-4 border-b border-border/30 animate-fade-in">
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      
      <div className="flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-6 pt-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  </div>
);

export const FeedSkeleton = () => (
  <div className="divide-y divide-border/30">
    {Array.from({ length: 5 }).map((_, i) => (
      <PostSkeleton key={i} />
    ))}
  </div>
);
