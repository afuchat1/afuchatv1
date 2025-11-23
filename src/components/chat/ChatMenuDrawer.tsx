import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Moon, 
  Sun, 
  HelpCircle, 
  LogOut,
  Bell,
  Shield,
  Globe,
  Star,
  ChevronRight,
  Archive,
  Palette,
  Image,
  Type,
  Wallpaper,
  Download,
  Volume2,
  Video,
  Folder,
  Tag,
  Lock,
  Eye,
  Clock,
  Trash2,
  Pin
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface ChatMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatMenuDrawer = ({ isOpen, onClose }: ChatMenuDrawerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<{
    display_name: string;
    handle: string;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('display_name, handle, avatar_url')
      .eq('id', user.id)
      .single();
    
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out');
    } else {
      toast.success('Logged out successfully');
      navigate('/');
    }
    onClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const menuSections = [
    {
      title: 'Chats',
      items: [
        { icon: MessageSquare, label: 'All Chats', path: '/chats', color: 'text-blue-500' },
        { icon: Archive, label: 'Archived', path: '/archived-chats', color: 'text-gray-500' },
        { icon: Star, label: 'Favorites', path: '/favorite-chats', color: 'text-yellow-500' },
        { icon: Pin, label: 'Pinned', path: '/pinned-chats', color: 'text-purple-500' },
        { icon: Users, label: 'New Group', path: '/new-group', color: 'text-green-500' },
        { icon: Folder, label: 'Chat Folders', path: '/chat-folders', color: 'text-orange-500' },
        { icon: Tag, label: 'Labels', path: '/chat-labels', color: 'text-pink-500' },
      ]
    },
    {
      title: 'Chat Appearance',
      items: [
        { icon: Palette, label: 'Chat Themes', path: '/chat-themes', color: 'text-indigo-500' },
        { icon: Wallpaper, label: 'Wallpapers', path: '/chat-wallpapers', color: 'text-cyan-500' },
        { icon: Image, label: 'Bubble Style', path: '/chat-bubble-style', color: 'text-teal-500' },
        { icon: Type, label: 'Font Size', path: '/chat-font-settings', color: 'text-amber-500' },
      ]
    },
    {
      title: 'Chat Customization',
      items: [
        { icon: Volume2, label: 'Chat Sounds', path: '/chat-sounds', color: 'text-red-500' },
        { icon: Download, label: 'Auto-Download', path: '/chat-auto-download', color: 'text-emerald-500' },
        { icon: Video, label: 'Media Quality', path: '/chat-media-quality', color: 'text-violet-500' },
        { icon: Clock, label: 'Message Timer', path: '/chat-message-timer', color: 'text-rose-500' },
      ]
    },
    {
      title: 'Privacy & Storage',
      items: [
        { icon: Lock, label: 'Chat Lock', path: '/chat-lock', color: 'text-foreground' },
        { icon: Eye, label: 'Read Receipts', path: '/chat-read-receipts', color: 'text-foreground' },
        { icon: Shield, label: 'Privacy Settings', path: '/settings?tab=security', color: 'text-foreground' },
        { icon: Trash2, label: 'Clear Chat Data', path: '/chat-clear-data', color: 'text-destructive' },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { icon: Bell, label: 'Notification Settings', path: '/settings?tab=notifications', color: 'text-foreground' },
        { icon: Globe, label: 'Data & Storage', path: '/settings?tab=data', color: 'text-foreground' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', path: '/support', color: 'text-foreground' },
        { icon: Settings, label: 'Chat Settings', path: '/settings', color: 'text-foreground' },
      ]
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-4 space-y-4">
          {/* Profile Section */}
          <div 
            onClick={() => handleNavigation(`/${user?.id}`)}
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors -mx-3"
          >
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {profile?.display_name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{profile?.display_name || 'User'}</h3>
              <p className="text-sm text-muted-foreground truncate">@{profile?.handle || 'user'}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 -mx-3">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-foreground" />
              )}
              <span className="font-medium">Dark Mode</span>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-6">
          {menuSections.map((section, idx) => (
            <div key={section.title}>
              {idx > 0 && <Separator className="my-4" />}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  {section.title}
                </p>
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <item.icon className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Separator className="my-4" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors group"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Log Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
