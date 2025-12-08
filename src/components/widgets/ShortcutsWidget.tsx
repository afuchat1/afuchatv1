import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  PenSquare, 
  MessageCircle, 
  Gift, 
  Wallet, 
  Gamepad2, 
  Search,
  Crown,
  Settings,
  Store,
  Users,
  Bot,
  TrendingUp
} from 'lucide-react';

interface ShortcutsWidgetProps {
  className?: string;
  variant?: 'grid' | 'list' | 'compact';
}

const shortcuts = [
  { 
    icon: PenSquare, 
    label: 'New Post', 
    description: 'Share your thoughts',
    path: '/home', 
    action: 'newPost', 
    gradient: 'from-primary to-accent'
  },
  { 
    icon: MessageCircle, 
    label: 'Chats', 
    description: 'Messages & conversations',
    path: '/chats', 
    gradient: 'from-blue-500 to-cyan-400'
  },
  { 
    icon: Gift, 
    label: 'Gifts', 
    description: 'Send & receive gifts',
    path: '/gifts', 
    gradient: 'from-pink-500 to-rose-400'
  },
  { 
    icon: Wallet, 
    label: 'Wallet', 
    description: 'Nexa & ACoin balance',
    path: '/wallet', 
    gradient: 'from-emerald-500 to-green-400'
  },
  { 
    icon: Gamepad2, 
    label: 'Games', 
    description: 'Play Afu Arena',
    path: '/games/AfuArena', 
    gradient: 'from-purple-500 to-violet-400'
  },
  { 
    icon: Store, 
    label: 'Shop', 
    description: 'Browse marketplace',
    path: '/shop', 
    gradient: 'from-orange-500 to-amber-400'
  },
  { 
    icon: Bot, 
    label: 'AI Chat', 
    description: 'Chat with AfuAI',
    path: '/ai-chat', 
    gradient: 'from-indigo-500 to-blue-400'
  },
  { 
    icon: Crown, 
    label: 'Premium', 
    description: 'Upgrade your account',
    path: '/premium', 
    gradient: 'from-yellow-500 to-amber-400'
  }
];

const secondaryShortcuts = [
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Users, label: 'Explore', path: '/suggested' },
  { icon: TrendingUp, label: 'Trending', path: '/trending' },
  { icon: Settings, label: 'Settings', path: '/settings' }
];

export const ShortcutsWidget = ({ className, variant = 'grid' }: ShortcutsWidgetProps) => {
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

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Primary shortcuts - horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {shortcuts.slice(0, 6).map((shortcut, i) => (
            <button
              key={i}
              onClick={() => handleShortcut(shortcut)}
              className="flex-shrink-0 group"
            >
              <div className={cn(
                'relative w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center',
                'shadow-lg transition-all duration-300',
                'group-hover:scale-105 group-hover:shadow-xl group-active:scale-95',
                shortcut.gradient
              )}>
                <shortcut.icon className="h-6 w-6 text-white" strokeWidth={2} />
                <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="block text-[10px] text-muted-foreground font-medium mt-1.5 text-center truncate w-14">
                {shortcut.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {shortcuts.map((shortcut, i) => (
          <button
            key={i}
            onClick={() => handleShortcut(shortcut)}
            className={cn(
              'w-full flex items-center gap-4 p-3 rounded-2xl',
              'bg-card/80 backdrop-blur-sm border border-border/50',
              'hover:bg-accent/50 hover:border-primary/20 transition-all duration-200',
              'group active:scale-[0.98]'
            )}
          >
            <div className={cn(
              'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center',
              'shadow-md group-hover:shadow-lg transition-shadow',
              shortcut.gradient
            )}>
              <shortcut.icon className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 text-left">
              <span className="block text-sm font-semibold text-foreground">{shortcut.label}</span>
              <span className="block text-xs text-muted-foreground">{shortcut.description}</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Default grid variant
  return (
    <div className={cn('space-y-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        <span className="text-xs text-muted-foreground">{shortcuts.length} shortcuts</span>
      </div>

      {/* Primary shortcuts grid */}
      <div className="grid grid-cols-4 gap-3">
        {shortcuts.map((shortcut, i) => (
          <button
            key={i}
            onClick={() => handleShortcut(shortcut)}
            className="group flex flex-col items-center gap-2"
          >
            <div className={cn(
              'relative w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center',
              'shadow-lg transition-all duration-300 ease-out',
              'group-hover:scale-110 group-hover:shadow-xl',
              'group-active:scale-95',
              shortcut.gradient
            )}>
              <shortcut.icon className="h-6 w-6 text-white" strokeWidth={2} />
              
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </div>
              
              {/* Glow effect on hover */}
              <div className={cn(
                'absolute -inset-1 rounded-3xl bg-gradient-to-br opacity-0 blur-lg transition-opacity duration-300',
                'group-hover:opacity-30',
                shortcut.gradient
              )} />
            </div>
            
            <span className="text-[11px] text-muted-foreground font-medium truncate w-full text-center group-hover:text-foreground transition-colors">
              {shortcut.label}
            </span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Secondary shortcuts */}
      <div className="flex items-center justify-between">
        {secondaryShortcuts.map((shortcut, i) => (
          <button
            key={i}
            onClick={() => navigate(shortcut.path)}
            className={cn(
              'flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl',
              'hover:bg-muted/50 transition-colors',
              'group active:scale-95'
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-muted/80 flex items-center justify-center group-hover:bg-muted transition-colors">
              <shortcut.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">
              {shortcut.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};