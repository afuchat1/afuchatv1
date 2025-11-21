import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMode } from '@/contexts/AccountModeContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Grid3x3,
  ShoppingBag,
  Building2,
  Wallet,
  Send,
  Gift,
  Shield,
  BarChart3,
  Image as ImageIcon,
  Hash,
  Bell,
  TrendingUp,
  Settings,
  Bot
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresBusiness?: boolean;
  requiresAffiliate?: boolean;
}

export function MobileMenuSheet() {
  const { user } = useAuth();
  const { mode } = useAccountMode();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('is_admin, is_business_mode, is_affiliate')
      .eq('id', user.id)
      .single();

    if (data) {
      setIsAdmin(data.is_admin || false);
      setIsBusinessMode(data.is_business_mode || false);
      setIsAffiliate(data.is_affiliate || false);
    }
  };

  const menuItems: MenuItem[] = [
    { icon: Bot, label: 'AI Chat', path: '/ai-chat', requiresAuth: true },
    { icon: ShoppingBag, label: 'Shop', path: '/shop' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', requiresAuth: true },
    { icon: Send, label: 'Transfer', path: '/transfer', requiresAuth: true },
    { icon: Gift, label: 'Gifts', path: '/gifts' },
    { icon: ImageIcon, label: 'Moments', path: '/moments' },
    { icon: Hash, label: 'Trending', path: '/trending' },
    { icon: Grid3x3, label: 'Mini Programs', path: '/mini-programs' },
    { icon: Bell, label: 'Notifications', path: '/notifications', requiresAuth: true },
    { icon: Settings, label: 'Settings', path: '/settings', requiresAuth: true },
  ];

  // Add business mode item
  if (isBusinessMode && mode === 'business') {
    menuItems.push({ 
      icon: BarChart3, 
      label: 'Business', 
      path: '/business/dashboard', 
      requiresBusiness: true 
    });
  }

  // Add affiliate item
  if (isAffiliate) {
    menuItems.push({ 
      icon: TrendingUp, 
      label: 'Affiliate', 
      path: '/affiliate-dashboard', 
      requiresAffiliate: true 
    });
  }

  // Add admin item
  if (isAdmin) {
    menuItems.push({ 
      icon: Shield, 
      label: 'Admin', 
      path: '/admin', 
      requiresAdmin: true 
    });
  }

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button 
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-muted-foreground hover:text-primary"
          aria-label="More options"
        >
          <Grid3x3 className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[60vh] rounded-t-3xl pb-8"
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-bold">Quick Access</SheetTitle>
        </SheetHeader>
        
        <div className="grid grid-cols-4 gap-4 px-2">
          {menuItems.map((item) => {
            // Check if item should be shown based on requirements
            if (item.requiresAuth && !user) return null;
            if (item.requiresAdmin && !isAdmin) return null;
            if (item.requiresBusiness && (!isBusinessMode || mode !== 'business')) return null;
            if (item.requiresAffiliate && !isAffiliate) return null;

            return (
              <button
                key={item.path}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors active:scale-95"
                onClick={() => handleNavigate(item.path)}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
