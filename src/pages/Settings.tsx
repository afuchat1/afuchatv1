import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, User, Bell, Lock, Shield, LogOut, Languages, 
  Sun, Moon, Monitor, Mail, HelpCircle, Palette, 
  ChevronRight, Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import EnableNotificationsButton from '@/components/EnableNotificationsButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

type SettingsSection = 
  | 'general' 
  | 'security' 
  | 'notifications' 
  | 'appearance' 
  | 'business' 
  | 'help' 
  | 'about';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    (searchParams.get('section') as SettingsSection) || 'general'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);

  const languages = [
    { code: 'en', name: t('languages.en'), flag: '🇬🇧' },
    { code: 'es', name: t('languages.es'), flag: '🇪🇸' },
    { code: 'fr', name: t('languages.fr'), flag: '🇫🇷' },
    { code: 'ar', name: t('languages.ar'), flag: '🇸🇦' },
    { code: 'sw', name: t('languages.sw'), flag: '🇹🇿' },
  ];

  const sidebarItems = [
    { id: 'general' as const, label: 'General', icon: User },
    { id: 'security' as const, label: 'Privacy', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'help' as const, label: 'Help & Support', icon: HelpCircle },
    { id: 'about' as const, label: 'About', icon: Shield },
  ];

  useEffect(() => {
    const section = searchParams.get('section') as SettingsSection;
    if (section && sidebarItems.find(item => item.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchProfileSettings();
    }
  }, [user]);

  const fetchProfileSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('is_private, show_online_status, show_read_receipts')
      .eq('id', user.id)
      .single();

    if (data) {
      setPrivateAccount(data.is_private || false);
      setShowOnlineStatus(data.show_online_status ?? true);
      setShowReadReceipts(data.show_read_receipts ?? true);
    }
  };

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  const handleLanguageChange = async (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    
    if (languageCode === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ language: languageCode })
          .eq('id', user.id);
        toast.success(t('common.success'));
      } catch (error) {
        console.error('Error saving language preference:', error);
        toast.error(t('common.error'));
      }
    }
  };

  const handlePrivacyToggle = async (field: string, value: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);
      
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(t('auth.loggedOut'));
      navigate('/');
    } catch (error) {
      toast.error(t('auth.loginError'));
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">General Settings</h2>
              <p className="text-muted-foreground text-lg">Manage your account and profile information</p>
            </div>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Profile</h3>
                </div>
                <div className="space-y-1">
                  <SettingItem
                    label="Edit Profile"
                    description="Update your name, bio, and other profile details"
                    onClick={() => user && navigate(`/${user.id}/edit`)}
                  />
                </div>
              </div>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Security & Privacy</h2>
              <p className="text-muted-foreground text-lg">Manage your account security and privacy settings</p>
            </div>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Account Security</h3>
                </div>
                <div className="space-y-1">
                  <SettingItem
                    label="Change Password"
                    description="Update your account password"
                    icon={<Lock className="h-5 w-5" />}
                    onClick={() => navigate('/change-password')}
                  />
                  <Separator className="my-2" />
                  <SettingItem
                    label="Security Dashboard"
                    description="View login history and active sessions"
                    icon={<Shield className="h-5 w-5" />}
                    onClick={() => navigate('/security')}
                  />
                </div>
              </div>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Privacy Settings</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Private Account</p>
                      <p className="text-sm text-muted-foreground">Only approved followers can see your posts</p>
                    </div>
                    <Switch
                      checked={privateAccount}
                      onCheckedChange={(checked) => {
                        setPrivateAccount(checked);
                        handlePrivacyToggle('is_private', checked);
                      }}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Show Online Status</p>
                      <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                    </div>
                    <Switch
                      checked={showOnlineStatus}
                      onCheckedChange={(checked) => {
                        setShowOnlineStatus(checked);
                        handlePrivacyToggle('show_online_status', checked);
                      }}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Read Receipts</p>
                      <p className="text-sm text-muted-foreground">Show when you've read messages</p>
                    </div>
                    <Switch
                      checked={showReadReceipts}
                      onCheckedChange={(checked) => {
                        setShowReadReceipts(checked);
                        handlePrivacyToggle('show_read_receipts', checked);
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
              <p className="text-muted-foreground text-lg">Manage how you receive notifications</p>
            </div>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Push Notifications</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Enable push notifications to receive alerts for new messages, likes, and replies even when the app is closed
                </p>
                <EnableNotificationsButton />
                
                <Separator className="my-6" />
                
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">In-App Notifications</p>
                      <p className="text-sm text-muted-foreground">Show notifications while using the app</p>
                    </div>
                    <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Appearance</h2>
              <p className="text-muted-foreground text-lg">Customize how the app looks</p>
            </div>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Theme</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Choose your preferred color scheme</p>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105",
                      theme === 'light' 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                        : 'border-border/40 hover:bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-lg",
                      theme === 'light' ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      <Sun className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105",
                      theme === 'dark' 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                        : 'border-border/40 hover:bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-lg",
                      theme === 'dark' ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      <Moon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105",
                      theme === 'system' 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                        : 'border-border/40 hover:bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-lg",
                      theme === 'system' ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      <Monitor className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold">System</span>
                  </button>
                </div>
              </div>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Languages className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Language</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Select your preferred language</p>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full h-12 bg-muted/30 border-border/50">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50">
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-3">
                          <span className="text-xl">{lang.flag}</span>
                          <span className="font-medium">{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
              <p className="text-muted-foreground text-lg">Get help and contact support</p>
            </div>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <SettingItem
                  label="Support Center"
                  description="Browse FAQs and help articles"
                  icon={<HelpCircle className="h-5 w-5" />}
                  onClick={() => navigate('/support')}
                />
              </div>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Contact Support</h3>
                </div>
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-6 border border-border/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Mail className="h-6 w-6 text-primary shrink-0" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="font-semibold">Email Support</p>
                      <a 
                        href="mailto:support@afuchat.com" 
                        className="text-sm text-primary hover:underline font-medium block"
                      >
                        support@afuchat.com
                      </a>
                      <p className="text-xs text-muted-foreground">Response time: 24-48 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">About</h2>
              <p className="text-muted-foreground text-lg">App information and legal</p>
            </div>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">App Information</h3>
                </div>
                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Version</span>
                    <span className="text-sm font-semibold">1.0.0</span>
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">© 2024 AfuChat. All rights reserved.</p>
                </div>
              </div>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Legal</h3>
                </div>
                <div className="space-y-1">
                  <SettingItem
                    label="Terms of Use"
                    description="Read our terms and conditions"
                    onClick={() => navigate('/terms')}
                  />
                  <Separator className="my-2" />
                  <SettingItem
                    label="Privacy Policy"
                    description="Learn how we protect your data"
                    onClick={() => navigate('/privacy')}
                  />
                </div>
              </div>
            </Card>

            <Button 
              variant="destructive" 
              size="lg"
              className="w-full shadow-lg hover:shadow-xl transition-all duration-200 h-14 text-base font-semibold" 
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Log Out
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 hidden lg:block">
        <div className="flex h-16 items-center px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="lg:flex lg:min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-72 xl:w-80 border-r border-border/40 bg-muted/30 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    activeSection === item.id
                      ? "bg-background text-primary font-semibold shadow-md shadow-primary/10 border border-primary/20"
                      : "hover:bg-background/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    activeSection === item.id 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Section Selector */}
        <div className="lg:hidden border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-40">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 p-3 min-w-max">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card text-muted-foreground hover:bg-card/80 border border-border/40"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content with Smooth Scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8 lg:py-12 pb-24 lg:pb-12">
            <div className="space-y-8">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper component for clickable settings items
const SettingItem = ({ 
  label, 
  description, 
  onClick, 
  icon 
}: { 
  label: string; 
  description: string; 
  onClick: () => void;
  icon?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-4 px-4 rounded-xl hover:bg-muted/50 transition-all duration-200 text-left group border border-transparent hover:border-border/40"
  >
    <div className="flex items-center gap-4 flex-1">
      {icon && (
        <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="font-semibold mb-0.5 group-hover:text-primary transition-colors">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
  </button>
);

export default Settings;
