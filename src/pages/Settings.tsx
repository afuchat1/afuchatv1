import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Bell, Lock, Shield, FileText, LogOut, Languages, Sun, Moon, Monitor, Link2, Github, Building2, UserPlus, Mail, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
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

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
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

  const handleLanguageChange = async (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    
    // Apply RTL for Arabic
    if (languageCode === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }

    // Save language to database
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

  useEffect(() => {
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
        .select('is_business_mode, is_affiliate')
        .eq('id', user.id)
        .single();

      if (data) {
        setBusinessMode(data.is_business_mode || false);
        setIsAffiliate(data.is_affiliate || false);
      }

      // Check for pending affiliate request
      const { data: pendingRequest } = await supabase
        .from('affiliate_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      setHasPendingRequest(!!pendingRequest);
    };

    fetchConnectedProviders();
    fetchProfileSettings();
  }, [user]);

  const handleConnectProvider = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/settings`,
        },
      });
      
      if (error) throw error;
      toast.success(`Connecting ${provider}...`);
    } catch (error: any) {
      toast.error(error.message || `Failed to connect ${provider}`);
      setLoadingProvider(null);
    }
  };

  const handleDisconnectProvider = async (provider: string) => {
    try {
      const { data: identities } = await supabase.auth.getUserIdentities();
      const identity = identities?.identities?.find(id => id.provider === provider);
      
      if (!identity) {
        toast.error('Provider not found');
        return;
      }

      // Check if user has other auth methods before unlinking
      if (identities?.identities && identities.identities.length <= 1) {
        toast.error('Cannot disconnect your only sign-in method');
        return;
      }

      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;

      // Update local state
      setConnectedProviders(prev => prev.filter(p => p !== provider));
      toast.success(`${provider} disconnected successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to disconnect ${provider}`);
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
      toast.error('Failed to update business mode');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo size="sm" />
            </div>
            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('settings.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
          </div>

          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Shop & Rewards</h2>
              </div>
              <Separator />
              <button
                onClick={() => navigate('/shop')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <span>Cosmetic Shop</span>
                <span className="text-muted-foreground">›</span>
              </button>
              <button
                onClick={() => navigate('/gift-leaderboard')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <span>Gift Leaderboard</span>
                <span className="text-muted-foreground">›</span>
              </button>
            </div>
          </Card>

          {/* Account Settings */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('settings.account')}</h2>
              </div>
              <Separator />
              <button
                onClick={() => navigate('/avatar/edit')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <span>Customize Owl Avatar</span>
                <span className="text-muted-foreground">›</span>
              </button>
              <button
                onClick={() => user && navigate(`/${user.id}/edit`)}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <span>{t('settings.editProfile')}</span>
                <span className="text-muted-foreground">›</span>
              </button>
            </div>
          </Card>

          {/* Business & Affiliate */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Business & Affiliate</h2>
              </div>
              <Separator />
              {businessMode ? (
                <Link to="/business/dashboard">
                  <button className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Business Dashboard</span>
                    </div>
                    <span className="text-muted-foreground">›</span>
                  </button>
                </Link>
              ) : (
                <>
                  {isAffiliate ? (
                    <Link to="/affiliate-dashboard">
                      <button className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          <span>Affiliate Dashboard</span>
                        </div>
                        <span className="text-muted-foreground">›</span>
                      </button>
                    </Link>
                  ) : hasPendingRequest ? (
                    <div className="w-full flex items-center justify-between py-3 px-2 rounded-lg bg-muted/50 opacity-60">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Affiliate Request Pending</span>
                      </div>
                    </div>
                  ) : (
                    <Link to="/affiliate-request">
                      <button className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          <span>Apply for Affiliate Status</span>
                        </div>
                        <span className="text-muted-foreground">›</span>
                      </button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Connected Accounts */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Connected Accounts</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your sign-in methods and connect multiple providers
              </p>
              <Separator />
              
              {/* Google Provider */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectProvider('google')}
                    disabled={connectedProviders.length <= 1}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleConnectProvider('google')}
                    disabled={loadingProvider === 'google'}
                  >
                    {loadingProvider === 'google' ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
              </div>

              <Separator />

              {/* GitHub Provider */}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectProvider('github')}
                    disabled={connectedProviders.length <= 1}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleConnectProvider('github')}
                    disabled={loadingProvider === 'github'}
                  >
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
                    <p className="text-sm text-muted-foreground">
                      {user?.email || 'Not set'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth/forgot-password')}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </Card>

          {/* Privacy Settings */}
          {/* Privacy & Business Settings */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('settings.privacy')}</h2>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3 px-2">
                <div>
                  <p className="font-medium">{t('settings.privateAccount')}</p>
                  <p className="text-sm text-muted-foreground">{t('settings.privateAccountDesc')}</p>
                </div>
                <Switch
                  checked={privateAccount}
                  onCheckedChange={setPrivateAccount}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Business Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Enable business features like website URL display
                    </p>
                  </div>
                </div>
                <Switch
                  checked={businessMode}
                  onCheckedChange={handleBusinessModeToggle}
                />
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('settings.notifications')}</h2>
              </div>
              <Separator />
              <div className="space-y-3">
                <div>
                  <p className="font-medium mb-2">Push Notifications</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enable push notifications to receive alerts for new messages, likes, and replies even when the app is closed
                  </p>
                  <EnableNotificationsButton />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-3 px-2">
                  <div>
                    <p className="font-medium">{t('settings.pushNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.pushNotificationsDesc')}</p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Theme Settings */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Theme</h2>
              </div>
              <Separator />
              <div className="py-3 px-2 space-y-3">
                <div>
                  <p className="font-medium mb-1">Appearance</p>
                  <p className="text-sm text-muted-foreground mb-3">Choose how the app looks</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      theme === 'light' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      theme === 'dark' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      theme === 'system' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Language Settings */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('settings.language')}</h2>
              </div>
              <Separator />
              <div className="py-3 px-2 space-y-3">
                <div>
                  <p className="font-medium mb-1">{t('settings.selectLanguage')}</p>
                  <p className="text-sm text-muted-foreground mb-3">{t('settings.languageDesc')}</p>
                </div>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('settings.selectLanguage')} />
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
              </div>
            </div>
          </Card>

          {/* Legal */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('settings.legal')}</h2>
              </div>
              <Separator />
              <button
                onClick={() => navigate('/terms')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <span>{t('settings.termsOfUse')}</span>
                <span className="text-muted-foreground">›</span>
              </button>
              <button
                onClick={() => navigate('/privacy')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <span>{t('settings.privacyPolicy')}</span>
                <span className="text-muted-foreground">›</span>
              </button>
            </div>
          </Card>

          {/* Support */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Support</h2>
              </div>
              <Separator />
              <button
                onClick={() => navigate('/support')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <span>Support Center</span>
                </div>
                <span className="text-muted-foreground">›</span>
              </button>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email Support</p>
                    <a 
                      href="mailto:support@afuchat.com"
                      className="text-sm text-primary hover:underline"
                    >
                      support@afuchat.com
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">
                      Response time: 24-48 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('settings.about')}</h2>
              </div>
              <Separator />
              <div className="py-3 px-2 space-y-2">
                <p className="text-sm text-muted-foreground">{t('settings.version')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.copyright')}</p>
              </div>
            </div>
          </Card>

          {/* Logout */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('common.logout')}
          </Button>
        </div>
      </main>

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
              <p className="mt-3 text-sm">
                You can disable business mode at any time from settings.
              </p>
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

export default Settings;
