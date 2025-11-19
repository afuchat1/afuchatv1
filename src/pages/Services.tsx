import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wallet, QrCode, Trophy, Users, ShoppingBag, Bot, TrendingUp, Gift, Heart, Building2, UserPlus, HelpCircle, FileText, Shield, Image as ImageIcon, MessageSquare, Send, Zap, Mail, Code } from 'lucide-react';
import Logo from '@/components/Logo';

const Services = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const services = [
    {
      category: t('services.socialContent'),
      items: [
        { icon: ImageIcon, title: t('services.moments'), description: t('services.momentsDesc'), route: '/moments', color: 'text-pink-500' },
        { icon: MessageSquare, title: t('services.chats'), description: t('services.chatsDesc'), route: '/chats', color: 'text-green-500' },
        { icon: Users, title: t('services.discover'), description: t('services.discoverDesc'), route: '/search', color: 'text-purple-500' },
        { icon: TrendingUp, title: t('services.trending'), description: t('services.trendingDesc'), route: '/trending', color: 'text-orange-500' },
      ]
    },
    {
      category: t('services.financial'),
      items: [
        { icon: Wallet, title: t('services.wallet'), description: t('services.walletDesc'), route: '/wallet', color: 'text-blue-500' },
        { icon: Send, title: t('services.transfer'), description: t('services.transferDesc'), route: '/transfer', color: 'text-indigo-500' },
        { icon: Mail, title: t('services.redEnvelopes'), description: t('services.redEnvelopesDesc'), route: '/red-envelope', color: 'text-red-500' },
      ]
    },
    {
      category: t('services.miniPrograms'),
      items: [
        { icon: Zap, title: t('services.appStore'), description: t('services.appStoreDesc'), route: '/mini-programs', color: 'text-yellow-500' },
        { icon: Code, title: t('services.developerSDK'), description: t('services.developerSDKDesc'), route: '/developer-sdk', color: 'text-purple-600' },
      ]
    },
    {
      category: t('services.gamification'),
      items: [
        { icon: Trophy, title: t('services.leaderboard'), description: t('services.leaderboardDesc'), route: '/leaderboard', color: 'text-yellow-600' },
        { icon: QrCode, title: t('services.qrCode'), description: t('services.qrCodeDesc'), route: '/qr-code', color: 'text-blue-500' },
      ]
    },
    {
      category: t('services.shopping'),
      items: [
        { icon: ShoppingBag, title: t('services.shop'), description: t('services.shopDesc'), route: '/shop', color: 'text-purple-500' },
      ]
    },
    {
      category: t('services.business'),
      items: [
        { icon: Building2, title: t('services.businessDashboard'), description: t('services.businessDashboardDesc'), route: '/business/dashboard', color: 'text-blue-600' },
        { icon: UserPlus, title: t('services.affiliates'), description: t('services.affiliatesDesc'), route: '/affiliate-request', color: 'text-indigo-500' },
      ]
    },
    {
      category: t('services.aiTools'),
      items: [
        { icon: Bot, title: t('services.afuAI'), description: t('services.afuAIDesc'), route: '/ai-chat', color: 'text-cyan-500' },
      ]
    },
    {
      category: t('services.support'),
      items: [
        { icon: HelpCircle, title: t('services.supportCenter'), description: t('services.supportCenterDesc'), route: '/support', color: 'text-gray-500' },
        { icon: FileText, title: t('services.terms'), description: t('services.termsDesc'), route: '/terms', color: 'text-gray-500' },
        { icon: Shield, title: t('services.privacy'), description: t('services.privacyDesc'), route: '/privacy', color: 'text-gray-500' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size="sm" />
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t('services.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('services.subtitle')}</p>
        </div>

        <div className="space-y-6">
          {services.map((category, idx) => (
            <div key={idx}>
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 px-1">{category.category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {category.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <Card 
                      key={itemIdx} 
                      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group overflow-hidden"
                      onClick={() => navigate(item.route)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-background/50 ${item.color} group-hover:scale-110 transition-transform`}>
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg mb-1 truncate">{item.title}</CardTitle>
                            <CardDescription className="text-xs sm:text-sm line-clamp-2">{item.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Services;
