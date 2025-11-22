import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, User, Bell, Lock, Shield, LogOut, Languages, 
  Sun, Moon, Monitor, Mail, HelpCircle, Palette, 
  ChevronRight, Settings as SettingsIcon, Loader2, Download, Trash2
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
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

  const handleDownloadData = async () => {
    if (!user) {
      toast.error('You must be signed in to download your data');
      return;
    }

    setIsDownloadingData(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      const response = await fetch(
        'https://rhnsjqqtdzlkvqazfcbg.supabase.co/functions/v1/export-user-data',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afuchat-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Your data has been downloaded successfully!');
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Failed to download data. Please try again.');
    } finally {
      setIsDownloadingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error('You must be signed in');
      return;
    }

    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      const response = await fetch(
        'https://rhnsjqqtdzlkvqazfcbg.supabase.co/functions/v1/delete-user-account',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast.success('Account deleted successfully');
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
      setDeleteConfirmText('');
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

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Data & Privacy</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Download Your Data</p>
                      <p className="text-sm text-muted-foreground">
                        Export all your data including posts, messages, and activity
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleDownloadData}
                      disabled={isDownloadingData}
                      className="flex-shrink-0"
                    >
                      {isDownloadingData ? 'Preparing...' : 'Download'}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-2">What's included:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Profile information</li>
                      <li>Posts and replies</li>
                      <li>Messages from your chats</li>
                      <li>Followers and following</li>
                      <li>Tips and gifts sent/received</li>
                      <li>Achievements and activity log</li>
                      <li>Game scores and shop purchases</li>
                    </ul>
                  </div>
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

            <Separator className="my-8" />

            <Card className="border-destructive shadow-lg">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="text-xl font-semibold text-destructive">Danger Zone</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                    <p className="text-sm text-muted-foreground mb-2">
                      ⚠️ <strong>Warning:</strong> This action is permanent and cannot be undone.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      All your data will be permanently deleted including posts, messages, and account information.
                    </p>
                  </div>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      I want to delete my account
                    </Button>
                  ) : (
                    <div className="space-y-4 p-4 bg-destructive/10 rounded-lg border-2 border-destructive">
                      <div>
                        <p className="text-sm font-semibold text-destructive mb-3">
                          Type <span className="font-mono bg-destructive/20 px-2 py-1 rounded">DELETE</span> to confirm account deletion:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE"
                          className="w-full px-4 py-2 border-2 border-destructive rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                          className="flex-1"
                        >
                          {isDeletingAccount ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Forever'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Render all sections vertically for mobile
  const renderAllSections = () => (
    <>
      {/* General Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">General</h2>
        </div>
        <Card className="border-border/50 shadow-md">
          <div className="p-4">
            <SettingItem
              label="Edit Profile"
              description="Update your name, bio, and profile"
              onClick={() => user && navigate(`/${user.id}/edit`)}
            />
          </div>
        </Card>
      </div>

      {/* Security & Privacy Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Security & Privacy</h2>
        </div>
        <Card className="border-border/50 shadow-md">
          <div className="p-4 space-y-1">
            <SettingItem
              label="Change Password"
              description="Update your account password"
              onClick={() => navigate('/change-password')}
            />
            <Separator className="my-2" />
            <SettingItem
              label="Security Dashboard"
              description="View login history and sessions"
              onClick={() => navigate('/security')}
            />
          </div>
        </Card>
        <Card className="border-border/50 shadow-md">
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
              <div className="flex-1">
                <p className="font-semibold mb-1">Private Account</p>
                <p className="text-xs text-muted-foreground">Only followers can see your posts</p>
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
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
              <div className="flex-1">
                <p className="font-semibold mb-1">Show Online Status</p>
                <p className="text-xs text-muted-foreground">Let others see when you're online</p>
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
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
              <div className="flex-1">
                <p className="font-semibold mb-1">Read Receipts</p>
                <p className="text-xs text-muted-foreground">Show when you've read messages</p>
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
        <Card className="border-border/50 shadow-md">
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
              <div className="flex-1">
                <p className="font-semibold mb-1">Download Your Data</p>
                <p className="text-xs text-muted-foreground">
                  Export all your data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadData}
                disabled={isDownloadingData}
                className="flex-shrink-0"
              >
                {isDownloadingData ? 'Preparing...' : 'Download'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
              <p className="font-medium mb-2">Includes:</p>
              <ul className="list-disc list-inside space-y-1 text-[10px]">
                <li>Profile & posts</li>
                <li>Messages & chats</li>
                <li>Tips & gifts</li>
                <li>Activity & achievements</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Notifications</h2>
        </div>
        <Card className="border-border/50 shadow-md">
          <div className="p-4 space-y-4">
            <div>
              <p className="font-semibold mb-2">Push Notifications</p>
              <p className="text-xs text-muted-foreground mb-4">
                Receive alerts even when app is closed
              </p>
              <EnableNotificationsButton />
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
              <div className="flex-1">
                <p className="font-semibold mb-1">In-App Notifications</p>
                <p className="text-xs text-muted-foreground">Show while using the app</p>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
          </div>
        </Card>
      </div>

      {/* Appearance Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Appearance</h2>
        </div>
        <Card className="border-border/50 shadow-md">
          <div className="p-4 space-y-4">
            <div>
              <p className="font-semibold mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    theme === 'light' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border/40'
                  )}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-xs font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    theme === 'dark' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border/40'
                  )}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-xs font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    theme === 'system' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border/40'
                  )}
                >
                  <Monitor className="h-5 w-5" />
                  <span className="text-xs font-medium">System</span>
                </button>
              </div>
            </div>
            <Separator />
            <div>
              <p className="font-semibold mb-3">Language</p>
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full bg-muted/30 border-border/50">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
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
      </div>

      {/* Help & Support Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Help & Support</h2>
        </div>
        <Card className="border-border/50 shadow-md">
          <div className="p-4">
            <SettingItem
              label="Support Center"
              description="Browse FAQs and help articles"
              onClick={() => navigate('/support')}
            />
          </div>
        </Card>
        <Card className="border-border/50 shadow-md">
          <div className="p-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Email Support</p>
                <a 
                  href="mailto:support@afuchat.com" 
                  className="text-sm text-primary hover:underline block"
                >
                  support@afuchat.com
                </a>
                <p className="text-xs text-muted-foreground">Response: 24-48 hours</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* About Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">About</h2>
        </div>
        <Card className="border-border/50 shadow-md">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium text-muted-foreground">Version</span>
              <span className="text-sm font-semibold">1.0.0</span>
            </div>
            <p className="text-xs text-muted-foreground px-3">© 2024 AfuChat. All rights reserved.</p>
          </div>
        </Card>
        <Card className="border-border/50 shadow-md">
          <div className="p-4 space-y-1">
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
        </Card>
        <Button 
          variant="destructive" 
          size="lg"
          className="w-full shadow-md h-12 font-semibold" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </div>

      <Separator className="my-6" />

      {/* Danger Zone - Moved to bottom */}
      <div className="space-y-4">
        <Card className="border-destructive shadow-md">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <p className="font-semibold text-destructive">Danger Zone</p>
            </div>
            <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
              <p className="text-xs text-muted-foreground">
                ⚠️ <strong>Warning:</strong> This action is permanent and cannot be undone. All your data will be deleted.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                I want to delete my account
              </Button>
            ) : (
              <div className="space-y-3 p-3 bg-destructive/10 rounded-lg border-2 border-destructive">
                <div>
                  <p className="text-xs font-semibold text-destructive mb-2">
                    Type <span className="font-mono bg-destructive/20 px-1.5 py-0.5 rounded text-[10px]">DELETE</span> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 text-sm border-2 border-destructive rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                    className="flex-1"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Forever'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );

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

        {/* Mobile: All Sections Vertical Scroll / Desktop: Selected Section */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-12 pb-24 lg:pb-12">
            {/* Mobile: Show all sections vertically */}
            <div className="lg:hidden space-y-8">
              {/* Mobile Header */}
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Settings</h1>
                </div>
              </div>

              {renderAllSections()}
            </div>

            {/* Desktop: Show selected section only */}
            <div className="hidden lg:block space-y-8">
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
