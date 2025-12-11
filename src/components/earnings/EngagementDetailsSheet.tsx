import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Eye, Heart, MessageCircle, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface EngagementDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'views' | 'likes' | 'replies' | 'total';
  post: {
    id: string;
    content: string;
    created_at: string;
    view_count: number;
    likes_count: number;
    replies_count: number;
    engagement_score: number;
    total_views: number;
    total_likes: number;
    total_replies: number;
    total_engagement_score: number;
    days_active: number;
    estimated_total_earnings: number;
  } | null;
}

export function EngagementDetailsSheet({ open, onOpenChange, type, post }: EngagementDetailsSheetProps) {
  if (!post) return null;

  const getTitle = () => {
    switch (type) {
      case 'views': return 'Views Details';
      case 'likes': return 'Likes Details';
      case 'replies': return 'Replies Details';
      case 'total': return 'Engagement Summary';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'views': return <Eye className="h-5 w-5 text-blue-500" />;
      case 'likes': return <Heart className="h-5 w-5 text-red-500" />;
      case 'replies': return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'total': return <BarChart3 className="h-5 w-5 text-primary" />;
    }
  };

  const getTodayValue = () => {
    switch (type) {
      case 'views': return post.view_count;
      case 'likes': return post.likes_count;
      case 'replies': return post.replies_count;
      case 'total': return post.engagement_score;
    }
  };

  const getTotalValue = () => {
    switch (type) {
      case 'views': return post.total_views;
      case 'likes': return post.total_likes;
      case 'replies': return post.total_replies;
      case 'total': return post.total_engagement_score;
    }
  };

  const getMultiplier = () => {
    switch (type) {
      case 'views': return 1;
      case 'likes': return 3;
      case 'replies': return 5;
      case 'total': return 1;
    }
  };

  const todayValue = getTodayValue();
  const totalValue = getTotalValue();
  const multiplier = getMultiplier();
  const todayPoints = type === 'total' ? todayValue : todayValue * multiplier;
  const totalPoints = type === 'total' ? totalValue : totalValue * multiplier;
  const avgDaily = Math.round(totalValue / post.days_active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Post Preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm line-clamp-2 mb-2">{post.content.slice(0, 100)}{post.content.length > 100 ? '...' : ''}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Posted {format(new Date(post.created_at), 'MMM d, yyyy')}</span>
              <span>•</span>
              <span>{post.days_active} day{post.days_active !== 1 ? 's' : ''} active</span>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Today's {type === 'total' ? 'Total Engagement' : type.charAt(0).toUpperCase() + type.slice(1)}
            </h3>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">+{todayValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type !== 'total' && `= ${todayPoints.toLocaleString()} points (×${multiplier} multiplier)`}
                    {type === 'total' && 'engagement points'}
                  </p>
                </div>
                {getIcon()}
              </div>
            </div>
          </div>

          {/* All-time Stats */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              All-time {type === 'total' ? 'Total Engagement' : type.charAt(0).toUpperCase() + type.slice(1)}
            </h3>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">{totalValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type !== 'total' && `= ${totalPoints.toLocaleString()} total points`}
                    {type === 'total' && 'total engagement points'}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Daily Average */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{avgDaily.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Daily Average</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">~{post.estimated_total_earnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Est. Total UGX</p>
            </div>
          </div>

          {/* Breakdown for total */}
          {type === 'total' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Score Breakdown</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Views</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{post.total_views.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">×1 = {post.total_views.toLocaleString()} pts</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Likes</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{post.total_likes.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">×3 = {(post.total_likes * 3).toLocaleString()} pts</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Replies</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{post.total_replies.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">×5 = {(post.total_replies * 5).toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress to daily pool */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Today's share of 5,000 UGX pool</span>
              <span className="font-medium">{todayPoints > 0 ? 'Active' : 'No activity'}</span>
            </div>
            <Progress value={todayPoints > 0 ? Math.min(100, (todayPoints / 100) * 10) : 0} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Higher engagement = bigger share of daily pool
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
