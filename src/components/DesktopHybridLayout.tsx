import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMode } from '@/contexts/AccountModeContext';
import { 
  Home, MessageSquare, Search, Bell, User, Settings, Shield, 
  BarChart3, Grid3x3, Bot, ShoppingBag, Wallet, Send, Gift, 
  Image as ImageIcon, Hash, TrendingUp, Menu, X
} from 'lucide-react';
import Logo from '@/components/Logo';
import NotificationIcon from '@/components/nav/NotificationIcon';
import { AccountModeSwitcher } from '@/components/AccountModeSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DesktopHybridLayoutProps {
  children: ReactNode;
}

export const DesktopHybridLayout = ({ children }: DesktopHybridLayoutProps) => {
  const { user } = useAuth();
  const { mode } = useAccountMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
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

  const navItems = [
    { path: '/', icon: Home, label: t('common.home') },
    { path: '/chats', icon: MessageSquare, label: t('common.messages') },
    { path: user ? `/${user.id}` : '/auth', icon: User, label: t('common.profile') },
  ];

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

  if (isAffiliate) {
    navItems.push({ path: '/affiliate-dashboard', icon: TrendingUp, label: 'Affiliate' });
  }

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: t('admin.title') });
  }

  if (isBusinessMode && mode === 'business') {
    navItems.push({ path: '/business/dashboard', icon: BarChart3, label: t('business.title') });
  }

  navItems.push({ path: '/settings', icon: Settings, label: t('common.settings') });

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-background select-none">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-50">
        <div className="h-full px-4 flex items-center gap-4">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-10 w-10"
          >
            {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0 h-10 rounded-full"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <NotificationIcon />
            
            {user && (
              <Link to={`/${user.id}`}>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Collapsible Sidebar */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-16 bottom-0 w-72 bg-sidebar-background border-r border-sidebar-border z-40 overflow-y-auto"
          >
            <div className="p-4 space-y-6">
              {/* Account Mode Switcher */}
              <AccountModeSwitcher />

              {/* Main Navigation */}
              <nav className="space-y-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">NAVIGATION</p>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                      isActive(item.path)
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent/10 text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Discover Section */}
              <nav className="space-y-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground mb-2">DISCOVER</p>
                {featureItems.map((item) => {
                  if (item.requiresAuth && !user) return null;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                        isActive(item.path)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "hover:bg-sidebar-accent/10 text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          !sidebarCollapsed ? "ml-72" : "ml-0"
        )}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};