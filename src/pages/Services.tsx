import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wallet, QrCode, Trophy, Users, ShoppingBag, Bot, TrendingUp, Gift, Heart, Building2, UserPlus, HelpCircle, FileText, Shield, Image as ImageIcon, MessageSquare, Send, Zap } from 'lucide-react';
import Logo from '@/components/Logo';

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      category: 'Social & Content',
      items: [
        { icon: ImageIcon, title: 'Moments', description: 'Share temporary photo & video stories', route: '/moments', color: 'text-pink-500' },
        { icon: MessageSquare, title: 'Chats', description: 'Private & group conversations', route: '/chats', color: 'text-green-500' },
        { icon: Users, title: 'Discover', description: 'Find and follow interesting people', route: '/search', color: 'text-purple-500' },
        { icon: TrendingUp, title: 'Trending', description: 'Explore trending topics', route: '/trending', color: 'text-orange-500' },
      ]
    },
    {
      category: 'Financial',
      items: [
        { icon: Wallet, title: 'Wallet', description: 'Manage your XP balance', route: '/wallet', color: 'text-blue-500' },
        { icon: Send, title: 'Transfer XP', description: 'Send XP to other users', route: '/transfer', color: 'text-indigo-500' },
        { icon: Gift, title: 'Gifts', description: 'Send virtual gifts', route: '/gifts', color: 'text-pink-500' },
        { icon: Heart, title: 'Tips', description: 'Support creators', route: '/tips', color: 'text-red-500' },
      ]
    },
    {
      category: 'Mini Programs',
      items: [
        { icon: Zap, title: 'App Store', description: 'Discover mini apps and games', route: '/mini-programs', color: 'text-yellow-500' },
      ]
    },
    {
      category: 'Gamification',
      items: [
        { icon: Trophy, title: 'Leaderboard', description: 'Top contributors', route: '/leaderboard', color: 'text-yellow-600' },
        { icon: QrCode, title: 'My QR Code', description: 'Share your profile', route: '/qr-code', color: 'text-blue-500' },
      ]
    },
    {
      category: 'Shopping',
      items: [
        { icon: ShoppingBag, title: 'Shop', description: 'Buy accessories', route: '/shop', color: 'text-purple-500' },
      ]
    },
    {
      category: 'Business',
      items: [
        { icon: Building2, title: 'Business', description: 'Business dashboard', route: '/business/dashboard', color: 'text-blue-600' },
        { icon: UserPlus, title: 'Affiliates', description: 'Affiliate program', route: '/affiliate-request', color: 'text-indigo-500' },
      ]
    },
    {
      category: 'AI & Tools',
      items: [
        { icon: Bot, title: 'AfuAI', description: 'AI assistant', route: '/ai-chat', color: 'text-cyan-500' },
      ]
    },
    {
      category: 'Support',
      items: [
        { icon: HelpCircle, title: 'Support', description: 'Get help', route: '/support', color: 'text-gray-500' },
        { icon: FileText, title: 'Terms', description: 'Terms of use', route: '/terms', color: 'text-gray-500' },
        { icon: Shield, title: 'Privacy', description: 'Privacy policy', route: '/privacy', color: 'text-gray-500' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">All Services</h1>
            <p className="text-muted-foreground">Everything AfuChat has to offer</p>
          </div>

          {services.map((category, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xl font-semibold">{category.category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.items.map((service, i) => {
                  const Icon = service.icon;
                  return (
                    <Card key={i} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(service.route)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted ${service.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <CardTitle className="text-lg">{service.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{service.description}</CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Services;
