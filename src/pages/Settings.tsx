import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Bell, Lock, Shield, FileText, LogOut, Languages, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import { useTranslation } from 'react-i18next';
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
  const { tier, isPremium, isVIP } = useSubscription();
  const { t, i18n } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

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

          {/* Subscription */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {isVIP ? <Crown className="h-5 w-5 text-yellow-500" /> : isPremium ? <Sparkles className="h-5 w-5 text-purple-500" /> : <Shield className="h-5 w-5 text-muted-foreground" />}
                <h2 className="text-lg font-semibold">Subscription</h2>
                {isPremium && (
                  <Badge variant={isVIP ? 'default' : 'secondary'} className={isVIP ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}>
                    {isVIP ? 'VIP' : 'Premium'}
                  </Badge>
                )}
              </div>
              <Separator />
              <button
                onClick={() => navigate('/subscription')}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <span>{isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}</span>
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

          {/* Privacy Settings */}
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
    </div>
  );
};

export default Settings;
