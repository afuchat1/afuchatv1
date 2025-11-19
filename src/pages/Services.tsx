import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wallet, QrCode, Trophy, Users, ShoppingBag, Bot, TrendingUp, Gift, Heart, Building2, UserPlus, HelpCircle, FileText, Shield } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

const Services = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const services = [
    {
      category: 'Financial',
      items: [
        { icon: Wallet, title: 'Wallet', description: 'Manage your XP balance', route: '/wallet', color: 'text-green-500' },
        { icon: Gift, title: 'Gifts', description: 'Send virtual gifts', route: '/gifts', color: 'text-pink-500' },
        { icon: Heart, title: 'Tips', description: 'Support creators', route: '/tips', color: 'text-red-500' },
      ]
    },
    {
      category: 'Social',
      items: [
        { icon: Users, title: 'Leaderboard', description: 'Top contributors', route: '/leaderboard', color: 'text-yellow-500' },
        { icon: QrCode, title: 'My QR Code', description: 'Share your profile', route: '/qr-code', color: 'text-blue-500' },
        { icon: TrendingUp, title: 'Trending', description: 'Popular topics', route: '/trending', color: 'text-orange-500' },
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
        { icon: HelpCircle, title: 'Support Center', description: 'Get help', route: '/support', color: 'text-gray-500' },
        { icon: FileText, title: 'Terms', description: 'Terms of use', route: '/terms', color: 'text-gray-500' },
        { icon: Shield, title: 'Privacy', description: 'Privacy policy', route: '/privacy', color: 'text-gray-500' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
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
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Services</h1>
          <p className="text-muted-foreground">
            Explore all available features and tools
          </p>
        </div>

        <div className="space-y-8">
          {services.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-semibold mb-4">{section.category}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Card 
                      key={service.title}
                      className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                      onClick={() => navigate(service.route)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Icon className={`h-8 w-8 ${service.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-lg mb-1">{service.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {service.description}
                        </CardDescription>
                      </CardContent>
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
