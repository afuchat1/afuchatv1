import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  User,
  Crown,
  MessageSquare,
  Users,
  Bookmark,
  List,
  Mic,
  Banknote,
  ChevronDown,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Shield,
  Bot,
  Gift,
  Wallet,
  Hash,
  Grid3x3,
  Store,
  TrendingUp,
  Briefcase,
} from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

interface ProfileDrawerProps {
  trigger: React.ReactNode;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresBusiness?: boolean;
  requiresAffiliate?: boolean;
}

export function ProfileDrawer({ trigger }: ProfileDrawerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isPremium } = usePremiumStatus();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string;
    handle: string;
    avatar_url: string | null;
    is_verified: boolean;
    is_organization_verified: boolean;
    is_business_mode: boolean;
    is_affiliate: boolean;
  } | null>(null);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAffiliateRequest, setHasAffiliateRequest] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchProfile();
      fetchFollowCounts();
      checkUserStatus();
    }
  }, [user, open]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name, handle, avatar_url, is_verified, is_organization_verified, is_business_mode, is_affiliate')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchFollowCounts = async () => {
    if (!user) return;
    const { count: followers } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id);
    const { count: following } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', user.id);
    setFollowCounts({ followers: followers || 0, following: following || 0 });
  };

  const checkUserStatus = async () => {
    if (!user) return;
    
    const { data: hasAdminRole } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    setIsAdmin(hasAdminRole === true);

    if (profile && !profile.is_affiliate) {
      const { data: requestData } = await supabase
        .from('affiliate_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();
      setHasAffiliateRequest(!!requestData);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const mainMenuItems: MenuItem[] = [
    { icon: User, label: 'Profile', path: user ? `/${profile?.handle || user.id}` : '/auth', requiresAuth: true },
    { icon: Crown, label: 'Premium', path: '/premium' },
    { icon: Bot, label: 'AI Chat', path: '/ai-chat', badge: 'Beta', requiresAuth: true },
    { icon: MessageSquare, label: 'Chats', path: '/chats', requiresAuth: true },
    { icon: Gift, label: 'Gifts', path: '/gifts' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', requiresAuth: true },
    { icon: Hash, label: 'Trending', path: '/trending' },
    { icon: Grid3x3, label: 'Mini Programs', path: '/mini-programs' },
  ];

  // Build dynamic items
  const dynamicItems: MenuItem[] = [];
  
  if (profile?.is_business_mode) {
    dynamicItems.push({ 
      icon: Store, 
      label: 'Business Hub', 
      path: '/business/dashboard', 
      requiresBusiness: true 
    });
  }
  
  if (profile?.is_affiliate) {
    dynamicItems.push({ 
      icon: TrendingUp, 
      label: 'Affiliate Dashboard', 
      path: '/affiliate-dashboard', 
      requiresAffiliate: true 
    });
  } else if (!profile?.is_affiliate && !hasAffiliateRequest && !profile?.is_business_mode) {
    dynamicItems.push({ 
      icon: Briefcase, 
      label: 'Become Affiliate', 
      path: '/affiliate-request', 
      requiresAuth: true 
    });
  }
  
  if (isAdmin) {
    dynamicItems.push({ 
      icon: Shield, 
      label: 'Admin Panel', 
      path: '/admin', 
      requiresAdmin: true 
    });
  }

  const settingsItems: MenuItem[] = [
    { icon: Settings, label: 'Settings', path: '/settings', requiresAuth: true },
    { icon: HelpCircle, label: 'Support', path: '/support' },
  ];

  const renderMenuItem = (item: MenuItem) => {
    if (item.requiresAuth && !user) return null;
    if (item.requiresAdmin && !isAdmin) return null;
    if (item.requiresBusiness && !profile?.is_business_mode) return null;
    if (item.requiresAffiliate && !profile?.is_affiliate) return null;

    return (
      <button
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        className="flex items-center gap-4 w-full px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
      >
        <item.icon className="h-6 w-6" />
        <span className="text-lg font-medium flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[85vw] max-w-[320px] p-0 overflow-hidden rounded-none border-r-0"
        hideCloseButton
      >
        <div 
          className="overflow-y-auto h-full px-4 py-6 overscroll-contain"
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Profile Header */}
          {user && profile && (
            <div className="py-4">
              <div className="flex items-start justify-between mb-3">
                <button 
                  onClick={() => handleNavigate(`/${profile.handle}`)}
                  className="flex-shrink-0"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
                {/* Account switcher placeholder */}
                <div className="flex items-center gap-2">
                  {/* Future: multiple accounts */}
                </div>
              </div>
              
              <button 
                onClick={() => handleNavigate(`/${profile.handle}`)}
                className="text-left"
              >
                <div className="flex items-center gap-1">
                  <h2 className="text-xl font-bold">{profile.display_name}</h2>
                  <VerifiedBadge
                    isVerified={profile.is_verified}
                    isOrgVerified={profile.is_organization_verified}
                    size="md"
                  />
                </div>
                <p className="text-muted-foreground">@{profile.handle}</p>
              </button>

              <div className="flex items-center gap-4 mt-3">
                <button 
                  onClick={() => handleNavigate(`/${profile.handle}/following`)}
                  className="hover:underline"
                >
                  <span className="font-bold">{followCounts.following}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </button>
                <button 
                  onClick={() => handleNavigate(`/${profile.handle}/followers`)}
                  className="hover:underline"
                >
                  <span className="font-bold">{followCounts.followers}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </button>
              </div>
            </div>
          )}

          <Separator className="my-2" />

          {/* Main Menu Items */}
          <div className="py-2 space-y-1">
            {mainMenuItems.map(renderMenuItem)}
            {dynamicItems.map(renderMenuItem)}
          </div>

          <Separator className="my-2" />

          {/* Settings & Support Collapsible */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg">
              <span className="text-lg font-medium">Settings & Support</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-4">
              {settingsItems.map(renderMenuItem)}
            </CollapsibleContent>
          </Collapsible>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-4 w-full px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg mt-2"
          >
            {theme === 'dark' ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
            <span className="text-lg font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Sign Out */}
          {user && (
            <>
              <Separator className="my-4" />
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setOpen(false);
                  navigate('/');
                }}
                className="flex items-center gap-4 w-full px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
              >
                <span className="text-lg font-medium">Sign Out</span>
              </button>
            </>
          )}

          {/* Sign In for guests */}
          {!user && (
            <>
              <Separator className="my-4" />
              <button
                onClick={() => handleNavigate('/auth')}
                className="flex items-center gap-4 w-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg justify-center"
              >
                <span className="text-lg font-medium">Sign In</span>
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}