import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, MessageSquare, Search, ShoppingBag, Bell, User, Settings, Trophy, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import NotificationIcon from '@/components/nav/NotificationIcon';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

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

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Explore' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: true },
    { path: '/chats', icon: MessageSquare, label: 'Messages' },
    { path: '/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  if (user) {
    navItems.push({ path: `/${user.id}`, icon: User, label: 'Profile', badge: false });
  }

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin', badge: false });
  }

  navItems.push({ path: '/settings', icon: Settings, label: 'Settings', badge: false });

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 border-r border-border flex-col p-4">
        <div className="mb-8">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
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
              {item.badge && item.path === '/notifications' ? (
                <NotificationIcon />
              ) : (
                <item.icon className="h-7 w-7" />
              )}
              <span>{item.label}</span>
            </Link>
          ))}
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

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { path: '/', icon: Home },
            { path: '/search', icon: Search },
            { path: '/notifications', icon: Bell, badge: true },
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
              {item.badge && item.path === '/notifications' ? (
                <NotificationIcon />
              ) : (
                <item.icon className={cn(
                  "h-6 w-6",
                  isActive(item.path) && "fill-current"
                )} />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
