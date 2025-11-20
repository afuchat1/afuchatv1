import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, User, Bell, Lock, Shield, FileText, LogOut, Languages, 
  Sun, Moon, Monitor, Link2, Github, Building2, UserPlus, Mail, 
  HelpCircle, Palette, Database, ChevronRight, Settings as SettingsIcon
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
  const [businessMode, setBusinessMode] = useState(false);
  const [showBusinessConfirm, setShowBusinessConfirm] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const languages = [
    { code: 'en', name: t('languages.en'), flag: '🇬🇧' },
    { code: 'es', name: t('languages.es'), flag: '🇪🇸' },
    { code: 'fr', name: t('languages.fr'), flag: '🇫🇷' },
    { code: 'ar', name: t('languages.ar'), flag: '🇸🇦' },
    { code: 'sw', name: t('languages.sw'), flag: '🇹🇿' },
  ];

  const sidebarItems = [
    { id: 'general' as const, label: 'General', icon: User },
    { id: 'security' as const, label: 'Security & Privacy', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'business' as const, label: 'Business', icon: Building2 },
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
      fetchConnectedProviders();
      fetchProfileSettings();
    }
  }, [user]);

  const fetchConnectedProviders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) throw error;
      
      if (data?.identities) {
        const providers = data.identities.map(identity => identity.provider);
        setConnectedProviders(providers);
      }
    } catch (error) {
      console.error('Error fetching identities:', error);
    }
  };

  const fetchProfileSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('is_business_mode, is_affiliate, is_private, show_online_status, show_read_receipts')
      .eq('id', user.id)
      .single();

    if (data) {
      setBusinessMode(data.is_business_mode || false);
      setIsAffiliate(data.is_affiliate || false);
      setPrivateAccount(data.is_private || false);
      setShowOnlineStatus(data.show_online_status ?? true);
      setShowReadReceipts(data.show_read_receipts ?? true);
    }

    const { data: pendingRequest } = await supabase
      .from('affiliate_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    setHasPendingRequest(!!pendingRequest);
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

  const handleConnectProvider = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/settings?section=security`,
        },
      });
      
      if (error) throw error;
      toast.success('Account linked successfully');
    } catch (error: any) {
      toast.error(error.message || t('common.error'));
      setLoadingProvider(null);
    }
  };

  const handleDisconnectProvider = async (provider: string) => {
    try {
      const { data: identities } = await supabase.auth.getUserIdentities();
      const identity = identities?.identities?.find(id => id.provider === provider);
      
      if (!identity) {
        toast.error(t('common.error'));
        return;
      }

      if (identities?.identities && identities.identities.length <= 1) {
        toast.error('You must have at least one sign-in method');
        return;
      }

      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;

      setConnectedProviders(prev => prev.filter(p => p !== provider));
      toast.success(t('common.success'));
    } catch (error: any) {
      toast.error(error.message || t('common.error'));
    }
  };

  const handleBusinessModeToggle = (checked: boolean) => {
    if (checked) {
      setShowBusinessConfirm(true);
    } else {
      updateBusinessMode(false);
    }
  };

  const updateBusinessMode = async (enabled: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_business_mode: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setBusinessMode(enabled);
      toast.success(enabled ? 'Business mode enabled' : 'Business mode disabled');
      setShowBusinessConfirm(false);
    } catch (error) {
      console.error('Error updating business mode:', error);
      toast.error(t('common.error'));
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
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">General Settings</h2>
              <p className="text-muted-foreground">Manage your account and profile information</p>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Profile</h3>
              <div className="space-y-3">
                <SettingItem
                  label="Edit Profile"
                  description="Update your name, bio, and other profile details"
                  onClick={() => user && navigate(`/${user.id}/edit`)}
                />
                <Separator />
                <SettingItem
                  label="Customize Avatar"
                  description="Personalize your owl avatar appearance"
                  onClick={() => navigate('/avatar/edit')}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Shop & Rewards</h3>
              <SettingItem
                label="Cosmetic Shop"
                description="Browse and purchase items with XP"
                onClick={() => navigate('/shop')}
              />
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Security & Privacy</h2>
              <p className="text-muted-foreground">Manage your security settings and privacy preferences</p>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your sign-in methods and connect multiple providers
              </p>
              <div className="space-y-4">
                {/* Google */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Google</p>
                      <p className="text-sm text-muted-foreground">
                        {connectedProviders.includes('google') ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {connectedProviders.includes('google') ? (
                    <Button variant="outline" size="sm" onClick={() => handleDisconnectProvider('google')} disabled={connectedProviders.length <= 1}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={() => handleConnectProvider('google')} disabled={loadingProvider === 'google'}>
                      {loadingProvider === 'google' ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                </div>

                <Separator />

                {/* GitHub */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center">
                      <Github className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">GitHub</p>
                      <p className="text-sm text-muted-foreground">
                        {connectedProviders.includes('github') ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {connectedProviders.includes('github') ? (
                    <Button variant="outline" size="sm" onClick={() => handleDisconnectProvider('github')} disabled={connectedProviders.length <= 1}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={() => handleConnectProvider('github')} disabled={loadingProvider === 'github'}>
                      {loadingProvider === 'github' ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Email/Password */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Email & Password</p>
                      <p className="text-sm text-muted-foreground">{user?.email || 'Not set'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/auth/forgot-password')}>
                    Change Password
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Private Account</p>
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
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Online Status</p>
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
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Read Receipts</p>
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
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Notifications</h2>
              <p className="text-muted-foreground">Manage how you receive notifications</p>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable push notifications to receive alerts for new messages, likes, and replies even when the app is closed
              </p>
              <EnableNotificationsButton />
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">In-App Notifications</p>
                    <p className="text-sm text-muted-foreground">Show notifications while using the app</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>
              </div>
            </Card>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Appearance</h2>
              <p className="text-muted-foreground">Customize how the app looks</p>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Theme</h3>
              <p className="text-sm text-muted-foreground mb-4">Choose your preferred color scheme</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    theme === 'light' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    theme === 'dark' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    theme === 'system' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <Monitor className="h-6 w-6" />
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Language</h3>
              <p className="text-sm text-muted-foreground mb-4">Select your preferred language</p>
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Business</h2>
              <p className="text-muted-foreground">Manage business features and affiliate program</p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Business Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Enable business features like website URL display
                      </p>
                    </div>
                  </div>
                  <Switch checked={businessMode} onCheckedChange={handleBusinessModeToggle} />
                </div>
              </div>
            </Card>

            {businessMode && (
              <Card className="p-6">
                <SettingItem
                  label="Business Dashboard"
                  description="View analytics and manage your business profile"
                  icon={<Building2 className="h-5 w-5" />}
                  onClick={() => navigate('/business/dashboard')}
                />
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Affiliate Program</h3>
              <div className="space-y-3">
                {isAffiliate ? (
                  <SettingItem
                    label="Affiliate Dashboard"
                    description="Track your earnings and referrals"
                    icon={<UserPlus className="h-5 w-5" />}
                    onClick={() => navigate('/affiliate-dashboard')}
                  />
                ) : hasPendingRequest ? (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Request Pending</p>
                        <p className="text-sm text-muted-foreground">Your affiliate request is under review</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <SettingItem
                    label="Apply for Affiliate Status"
                    description="Join our affiliate program and earn rewards"
                    icon={<UserPlus className="h-5 w-5" />}
                    onClick={() => navigate('/affiliate-request')}
                  />
                )}
              </div>
            </Card>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Help & Support</h2>
              <p className="text-muted-foreground">Get help and contact support</p>
            </div>

            <Card className="p-6">
              <SettingItem
                label="Support Center"
                description="Browse FAQs and help articles"
                icon={<HelpCircle className="h-5 w-5" />}
                onClick={() => navigate('/support')}
              />
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Support</h3>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email Support</p>
                    <a href="mailto:support@afuchat.com" className="text-sm text-primary hover:underline">
                      support@afuchat.com
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">Response time: 24-48 hours</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">About</h2>
              <p className="text-muted-foreground">App information and legal</p>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">App Information</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                <p className="text-sm text-muted-foreground">© 2024 AfuChat. All rights reserved.</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <div className="space-y-3">
                <SettingItem
                  label="Terms of Use"
                  description="Read our terms and conditions"
                  onClick={() => navigate('/terms')}
                />
                <Separator />
                <SettingItem
                  label="Privacy Policy"
                  description="Learn how we protect your data"
                  onClick={() => navigate('/privacy')}
                />
              </div>
            </Card>

            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-4 text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="lg:flex lg:min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 border-r border-border bg-muted/30">
          <div className="sticky top-0 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <SettingsIcon className="h-6 w-6" />
                Settings
              </h1>
            </div>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    activeSection === item.id
                      ? "bg-background text-primary font-medium shadow-sm"
                      : "hover:bg-background/50 text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Section Selector */}
        <div className="lg:hidden border-b border-border bg-background sticky top-14 z-40">
          <div className="overflow-x-auto">
            <div className="flex gap-2 p-2 min-w-max">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-3xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Business Mode Confirmation Dialog */}
      <AlertDialog open={showBusinessConfirm} onOpenChange={setShowBusinessConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Business Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              Business mode will allow you to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Display your business website URL on your profile</li>
                <li>Show a business badge next to your name</li>
                <li>Access business-specific features</li>
              </ul>
              <p className="mt-3 text-sm">You can disable business mode at any time from settings.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateBusinessMode(true)}>
              Enable Business Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
  >
    <div className="flex items-center gap-3 flex-1">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
  </button>
);

export default Settings;
