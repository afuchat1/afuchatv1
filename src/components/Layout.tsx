import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMode } from '@/contexts/AccountModeContext';
import { Home, MessageSquare, Search, ShoppingBag, Bell, User, Settings, Trophy, Shield, BarChart3, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import NotificationIcon from '@/components/nav/NotificationIcon';
import InstallPromptBanner from '@/components/InstallPromptBanner';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { AccountModeSwitcher } from '@/components/AccountModeSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const { mode, canUseBusiness } = useAccountMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      checkBusinessMode();
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setIsAdmin(data.is_admin || false);
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
    { path: '/moments', icon: ImageIcon, label: t('moments.title') },
    { path: '/search', icon: Search, label: t('search.title') },
    { path: '/notifications', icon: Bell, label: t('common.notifications'), badge: true },
    { path: '/chats', icon: MessageSquare, label: t('common.messages') },
    { path: '/services', icon: ShoppingBag, label: t('services.title') },
  ];

  if (user) {
    navItems.push({ path: `/${user.id}`, icon: User, label: t('common.profile'), badge: false });
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
    <div className="min-h-screen bg-background">
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

        <nav className="flex-1 space-y-1">
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
        </nav>

        {user && (
          <Button
            onClick={() => navigate('/settings')}
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
      <main className="lg:ml-64 xl:ml-72 min-h-screen">
        <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Hidden in chat rooms */}
      {!isChatRoom && (
        <nav className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 transition-transform duration-300",
          isScrollingDown ? "translate-y-full" : "translate-y-0"
        )}>
          <div className="flex justify-around items-center h-16 px-2">
            {[
              { path: '/', icon: Home },
              { path: '/search', icon: Search },
              { path: '/services', icon: ShoppingBag },
              { path: '/chats', icon: MessageSquare },
              { path: user ? `/${user.id}` : '/auth', icon: User }
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                  isActive(item.path) ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6",
                  isActive(item.path) && "fill-current"
                )} />
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
