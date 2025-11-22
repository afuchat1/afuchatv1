import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Globe, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AccountSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: t('languages.en'), flag: '🇬🇧' },
    { code: 'es', name: t('languages.es'), flag: '🇪🇸' },
    { code: 'fr', name: t('languages.fr'), flag: '🇫🇷' },
    { code: 'ar', name: t('languages.ar'), flag: '🇸🇦' },
    { code: 'sw', name: t('languages.sw'), flag: '🇹🇿' },
  ];

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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Profile Information</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => user && navigate(`/${user.id}/edit`)}>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Edit Profile</p>
                <p className="text-sm text-muted-foreground">Update your name, bio, and avatar</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Language & Region</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">App Language</p>
                <p className="text-sm text-muted-foreground">Choose your preferred language</p>
              </div>
            </div>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
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

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Contact Information</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email || 'No email set'}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">Not configured</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
