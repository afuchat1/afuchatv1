import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMode } from '@/contexts/AccountModeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Home, MessageSquare, Search, Bell, User, Settings, Shield, BarChart3, Grid3x3, Gamepad2, Bot, ShoppingBag, Wallet, Send, Gift, Image as ImageIcon, Hash, TrendingUp, Building2, MessageCircle } from 'lucide-react';
import menuIcon from '@/assets/menu-icon.png';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import NotificationIcon from '@/components/nav/NotificationIcon';
import InstallPromptBanner from '@/components/InstallPromptBanner';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { AccountModeSwitcher } from '@/components/AccountModeSwitcher';
import { MobileMenuSheet } from '@/components/MobileMenuSheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DesktopHybridLayout } from '@/components/DesktopHybridLayout';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const { mode, canUseBusiness } = useAccountMode();
  const { openSettings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [chatScrollHide, setChatScrollHide] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Cache key for user data
  const userCacheKey = user?.id ? `layout_user_data_${user.id}` : null;

  // Define functions before useEffect hooks
  const checkAdminStatus = async () => {
    if (!user) return;
    
    // Check memory cache first
    if (userCacheKey) {
      const cached = sessionStorage.getItem(userCacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (Date.now() - data.timestamp < 60000) { // 1 minute cache
            setIsAdmin(data.isAdmin);
            setIsBusinessMode(data.isBusinessMode);
            setIsAffiliate(data.isAffiliate);
            return;
          }
        } catch {}
      }
    }
    
    // Check admin status from secure user_roles table, not profiles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    const adminStatus = !!roleData;
    setIsAdmin(adminStatus);
    
    // Get business mode and affiliate status from profiles (non-sensitive)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_business_mode, is_affiliate')
      .eq('id', user.id)
      .single();

    const businessMode = profileData?.is_business_mode || false;
    const affiliateStatus = profileData?.is_affiliate || false;
    
    setIsBusinessMode(businessMode);
    setIsAffiliate(affiliateStatus);
    
    // Cache the results
    if (userCacheKey) {
      sessionStorage.setItem(userCacheKey, JSON.stringify({
        isAdmin: adminStatus,
        isBusinessMode: businessMode,
        isAffiliate: affiliateStatus,
        timestamp: Date.now()
      }));
    }
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (user) {
      checkAdminStatus();
      
      // Fetch unread notifications count
      const fetchUnreadCount = async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        if (count !== null) setUnreadNotifications(count);
      };
      fetchUnreadCount();

      // Real-time subscription for notifications
      const channel = supabase
        .channel('nav-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    // Only run scroll handlers on mobile
    if (!isMobile) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsScrollingDown(true);
      } else {
        setIsScrollingDown(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    const handleChatScroll = (e: CustomEvent) => {
      setChatScrollHide(e.detail.hide);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('chat-scroll-state' as any, handleChatScroll as any);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('chat-scroll-state' as any, handleChatScroll as any);
    };
  }, [lastScrollY, isMobile]);

  // Use desktop hybrid layout for tablets and desktops (after all hooks)
  if (!isMobile) {
    return <DesktopHybridLayout>{children}</DesktopHybridLayout>;
  }

  const navItems = [
    { path: '/', icon: Home, label: t('common.home') },
    { path: '/search', icon: Search, label: t('search.title') },
    { path: '/notifications', icon: Bell, label: t('common.notifications'), badge: true },
    { path: '/chats', icon: MessageSquare, label: t('common.messages') },
  ];

  // Additional features section
  const featureItems = [
    { path: '/ai-chat', icon: Bot, label: 'AI Chat', requiresAuth: true },
    { path: '/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/wallet', icon: Wallet, label: 'Wallet', requiresAuth: true },
    { path: '/transfer', icon: Send, label: 'Transfer', requiresAuth: true },
    { path: '/gifts', icon: Gift, label: 'Gifts' },
    { path: '/moments', icon: ImageIcon, label: 'Moments' },
    { path: '/trending', icon: Hash, label: 'Trending' },
    { path: '/mini-programs', icon: Grid3x3, label: 'Mini Programs' },
  ];

  if (user) {
    navItems.push({ path: `/${user.id}`, icon: User, label: t('common.profile'), badge: false });
  }

  if (isAffiliate) {
    navItems.push({ path: '/affiliate-dashboard', icon: TrendingUp, label: 'Affiliate', badge: false });
  }

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: t('admin.title'), badge: false });
  }

  if (isBusinessMode && mode === 'business') {
    navItems.push({ path: '/business/dashboard', icon: BarChart3, label: t('business.title'), badge: false });
  }

  navItems.push({ path: '/settings', icon: Settings, label: t('common.settings'), badge: false });

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  // Hide bottom navigation in chat rooms
  const isChatRoom = location.pathname.startsWith('/chat/');

  return (
    <div className="min-h-screen bg-background select-none">
      <InstallPromptBanner />
      <OfflineIndicator />

      {/* Main Content */}
      <main className="min-h-screen pb-20">
        <motion.div 
          className="min-h-screen"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation - X-style clean design */}
      {!isChatRoom && (
        <div className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
          (isScrollingDown || chatScrollHide) ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}>
          <nav className="bg-background border-t border-border">
            <div className="flex justify-between items-center h-14 px-6 max-w-lg mx-auto">
              <Link
                to="/home"
                onClick={(e) => {
                  if (location.pathname === '/home' || location.pathname === '/') {
                    e.preventDefault();
                    sessionStorage.removeItem('feedShuffleSeed');
                    window.dispatchEvent(new Event('refresh-feed-order'));
                  }
                }}
                className="flex items-center justify-center w-12 h-12 transition-colors"
              >
                <Home 
                  className={cn(
                    "h-6 w-6",
                    (isActive('/') || isActive('/home')) ? "text-primary fill-primary" : "text-foreground"
                  )} 
                  strokeWidth={(isActive('/') || isActive('/home')) ? 2.5 : 1.5} 
                />
              </Link>
              
              <Link
                to="/search"
                className="flex items-center justify-center w-12 h-12 transition-colors"
              >
                <Search 
                  className={cn(
                    "h-6 w-6",
                    isActive('/search') ? "text-primary" : "text-foreground"
                  )} 
                  strokeWidth={isActive('/search') ? 2.5 : 1.5} 
                />
              </Link>
              
              <MobileMenuSheet 
                trigger={
                  <button className="flex items-center justify-center w-12 h-12">
                    <img 
                      src={menuIcon} 
                      alt="Menu" 
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  </button>
                }
              />
              
              <Link
                to="/notifications"
                className="flex items-center justify-center w-12 h-12 transition-colors relative"
              >
                <div className="relative">
                  <Bell 
                    className={cn(
                      "h-6 w-6",
                      isActive('/notifications') ? "text-primary fill-primary" : "text-foreground"
                    )} 
                    strokeWidth={isActive('/notifications') ? 2.5 : 1.5} 
                  />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </div>
              </Link>
              
              <Link
                to="/chats"
                className="flex items-center justify-center w-12 h-12 transition-colors"
              >
                <MessageCircle 
                  className={cn(
                    "h-6 w-6",
                    isActive('/chats') ? "text-primary fill-primary" : "text-foreground"
                  )} 
                  strokeWidth={isActive('/chats') ? 2.5 : 1.5} 
                />
              </Link>
            </div>
          </nav>
          {/* Safe area padding for devices with home indicator */}
          <div className="bg-background/95 backdrop-blur-md h-[env(safe-area-inset-bottom)]" />
        </div>
      )}
    </div>
  );
};

export default Layout;
