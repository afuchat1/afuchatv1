import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMode } from '@/contexts/AccountModeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Home, MessageSquare, Search, Bell, User, Settings, Shield, BarChart3, Grid3x3, Gamepad2, Bot, ShoppingBag, Wallet, Send, Gift, Image as ImageIcon, Hash, TrendingUp } from 'lucide-react';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [chatScrollHide, setChatScrollHide] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
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
  }, [lastScrollY]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, is_business_mode, is_affiliate')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setIsAdmin(data.is_admin || false);
      setIsBusinessMode(data.is_business_mode || false);
      setIsAffiliate(data.is_affiliate || false);
    }
  };

  const checkBusinessMode = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_business_mode')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setIsBusinessMode(data.is_business_mode || false);
    }
  };

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
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 border-r border-border flex-col p-4">
        <div className="mb-6">
          <Logo />
        </div>

        <div className="mb-6">
          <AccountModeSwitcher />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {/* Main Navigation */}
          {navItems.map((item) => {
            // Special handling for notifications - it's already a Link component
            if (item.badge && item.path === '/notifications') {
              return <NotificationIcon key={item.path} />;
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-full transition-colors text-xl font-semibold",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <item.icon className="h-7 w-7" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Features Section */}
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-4 text-xs font-semibold text-muted-foreground mb-2">DISCOVER</p>
            {featureItems.map((item) => {
              // Check auth requirement
              if (item.requiresAuth && !user) return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-4 py-2.5 rounded-full transition-colors text-base",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {user && (
          <Button
            onClick={() => openSettings()}
            variant="ghost"
            className="mt-4 w-full justify-start gap-4 px-4 py-6 rounded-full hover:bg-muted"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="font-semibold text-sm truncate">Account</p>
              </div>
            </div>
          </Button>
        )}
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 xl:ml-72 min-h-screen pb-20 lg:pb-0">
        <motion.div 
          className="max-w-2xl mx-auto border-x border-border min-h-screen"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation - Hidden in chat rooms */}
      {!isChatRoom && (
        <nav className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 transition-transform duration-300 safe-area-inset-bottom",
          (isScrollingDown || chatScrollHide) ? "translate-y-full" : "translate-y-0"
        )}>
          <div className="flex justify-around items-center px-2 py-2 pb-safe">
            <Link
              to="/"
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors",
                isActive('/') ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Home className={cn(
                "h-6 w-6",
                isActive('/') && "fill-current"
              )} />
              <span className="text-[10px] font-medium">{t('common.home')}</span>
            </Link>
            
            <Link
              to="/search"
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors",
                isActive('/search') ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Search className={cn(
                "h-6 w-6",
                isActive('/search') && "fill-current"
              )} />
              <span className="text-[10px] font-medium">{t('search.title')}</span>
            </Link>
            
            <MobileMenuSheet />
            
            <Link
              to="/chats"
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors",
                isActive('/chats') ? "text-primary" : "text-muted-foreground"
              )}
            >
              <MessageSquare className={cn(
                "h-6 w-6",
                isActive('/chats') && "fill-current"
              )} />
              <span className="text-[10px] font-medium">{t('common.messages')}</span>
            </Link>
            
            <Link
              to={user ? `/${user.id}` : '/auth'}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors",
                isActive(user ? `/${user.id}` : '/auth') ? "text-primary" : "text-muted-foreground"
              )}
            >
              <User className={cn(
                "h-6 w-6",
                isActive(user ? `/${user.id}` : '/auth') && "fill-current"
              )} />
              <span className="text-[10px] font-medium">{t('common.profile')}</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
