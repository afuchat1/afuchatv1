import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  PenSquare, 
  MessageCircle, 
  Gift, 
  Wallet, 
  Gamepad2, 
  Search,
  Crown,
  Settings
} from 'lucide-react';

interface ShortcutsWidgetProps {
  className?: string;
}

const shortcuts = [
  { icon: PenSquare, label: 'New Post', path: '/home', action: 'newPost', color: 'bg-primary/10 text-primary' },
  { icon: MessageCircle, label: 'Chats', path: '/chats', color: 'bg-blue-500/10 text-blue-500' },
  { icon: Gift, label: 'Gifts', path: '/gifts', color: 'bg-pink-500/10 text-pink-500' },
  { icon: Wallet, label: 'Wallet', path: '/wallet', color: 'bg-emerald-500/10 text-emerald-500' },
  { icon: Gamepad2, label: 'Games', path: '/games/AfuArena', color: 'bg-purple-500/10 text-purple-500' },
  { icon: Search, label: 'Search', path: '/search', color: 'bg-amber-500/10 text-amber-500' },
  { icon: Crown, label: 'Premium', path: '/premium', color: 'bg-yellow-500/10 text-yellow-500' },
  { icon: Settings, label: 'Settings', path: '/settings', color: 'bg-slate-500/10 text-slate-500' }
];

export const ShortcutsWidget = ({ className }: ShortcutsWidgetProps) => {
  const navigate = useNavigate();

  const handleShortcut = (shortcut: typeof shortcuts[0]) => {
    if (shortcut.action === 'newPost') {
      navigate(shortcut.path);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-new-post-modal'));
      }, 100);
    } else {
      navigate(shortcut.path);
    }
  };

  return (
    <Card className={cn('p-4 bg-card/50 backdrop-blur-sm border-border/50', className)}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-2">
        {shortcuts.map((shortcut, i) => (
          <button
            key={i}
            onClick={() => handleShortcut(shortcut)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-accent/50 transition-colors"
          >
            <div className={cn('p-2.5 rounded-xl', shortcut.color)}>
              <shortcut.icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">
              {shortcut.label}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
};
