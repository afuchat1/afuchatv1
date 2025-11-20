import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, QrCode, Trophy, Users, ShoppingBag, Bot, TrendingUp, Building2, UserPlus, HelpCircle, FileText, Shield, Image as ImageIcon, MessageSquare, Send, Zap, Mail, Code } from 'lucide-react';
import Logo from '@/components/Logo';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Services = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const services = [
    {
      category: 'Social & Content',
      gradient: 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10',
      items: [
        { icon: ImageIcon, title: 'Moments', description: 'Share photos and stories', route: '/moments', color: 'text-pink-500' },
        { icon: MessageSquare, title: 'Chats', description: 'Message friends privately', route: '/chats', color: 'text-green-500' },
        { icon: Users, title: 'Discover', description: 'Find new connections', route: '/search', color: 'text-purple-500' },
        { icon: TrendingUp, title: 'Trending', description: 'Explore trending topics', route: '/trending', color: 'text-orange-500' },
      ]
    },
    {
      category: 'Financial',
      gradient: 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10',
      items: [
        { icon: Wallet, title: 'Wallet', description: 'Manage your XP balance', route: '/wallet', color: 'text-blue-500' },
        { icon: Send, title: 'Transfer XP', description: 'Send XP to other users', route: '/transfer', color: 'text-indigo-500' },
        { icon: Mail, title: 'Red Envelopes', description: 'Send lucky money gifts', route: '/red-envelope', color: 'text-red-500' },
      ]
    },
    {
      category: 'Mini Programs',
      gradient: 'bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10',
      items: [
        { icon: Zap, title: 'App Store', description: 'Discover mini apps', route: '/mini-programs', color: 'text-yellow-500' },
        { icon: Code, title: 'Developer SDK', description: 'Build your own apps', route: '/developer-sdk', color: 'text-purple-600' },
      ]
    },
    {
      category: 'Gamification',
      gradient: 'bg-gradient-to-r from-yellow-500/10 via-green-500/10 to-emerald-500/10',
      items: [
        { icon: Trophy, title: 'Leaderboard', description: 'View top users and rankings', route: '/leaderboard', color: 'text-yellow-600' },
        { icon: QrCode, title: 'QR Code', description: 'Share your profile easily', route: '/qr-code', color: 'text-blue-500' },
        { icon: Zap, title: 'XP Collector', description: 'Play and earn XP rewards', route: '/game', color: 'text-orange-500' },
      ]
    },
    {
      category: 'Shopping',
      gradient: 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10',
      items: [
        { icon: ShoppingBag, title: 'Shop', description: 'Browse and purchase items', route: '/shop', color: 'text-purple-500' },
      ]
    },
    {
      category: 'Business',
      gradient: 'bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-teal-500/10',
      items: [
        { icon: Building2, title: 'Business Dashboard', description: 'Manage your business', route: '/business/dashboard', color: 'text-blue-600' },
        { icon: UserPlus, title: 'Affiliates', description: 'Join affiliate program', route: '/affiliate-request', color: 'text-indigo-500' },
      ]
    },
    {
      category: 'AI Tools',
      gradient: 'bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10',
      items: [
        { icon: Bot, title: 'AfuAI', description: 'Chat with AI assistant', route: '/ai-chat', color: 'text-cyan-500' },
      ]
    },
    {
      category: 'Support',
      gradient: 'bg-gradient-to-r from-gray-500/10 via-slate-500/10 to-zinc-500/10',
      items: [
        { icon: HelpCircle, title: 'Support Center', description: 'Get help and support', route: '/support', color: 'text-gray-500' },
        { icon: FileText, title: 'Terms', description: 'Terms of service', route: '/terms', color: 'text-gray-500' },
        { icon: Shield, title: 'Privacy', description: 'Privacy policy', route: '/privacy', color: 'text-gray-500' },
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

      <main className="container max-w-4xl mx-auto py-6">
        <div className="mb-6 px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Services</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Discover all available features and tools</p>
        </div>

        <div className="space-y-6">
          {services.map((category, idx) => (
            <div key={idx} className={`rounded-lg p-4 ${category.gradient}`}>
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">{category.category}</h2>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-4">
                  {category.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={itemIdx} 
                        className="cursor-pointer hover:opacity-80 transition-opacity group flex-shrink-0 w-[280px]"
                        onClick={() => navigate(item.route)}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-muted/50 ${item.color} group-hover:scale-110 transition-transform`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold mb-1 text-foreground">{item.title}</h3>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Services;
