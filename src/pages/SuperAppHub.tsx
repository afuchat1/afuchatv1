import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, ShoppingBag, Wallet, Trophy, Users, Briefcase,
  Utensils, Calendar, Car, Plane, MapPin, Ticket, Search,
  TrendingUp, Zap, Gift, Gamepad2, Store, Building2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: any;
  route: string;
  category: string;
  color: string;
  badge?: string;
  isNew?: boolean;
}

const services: Service[] = [
  // Social
  { id: 'feed', name: 'Feed', description: 'Posts & Updates', icon: Users, route: '/', category: 'Social', color: 'bg-blue-500' },
  { id: 'chat', name: 'Messages', description: 'Chat with friends', icon: MessageSquare, route: '/chats', category: 'Social', color: 'bg-green-500' },
  { id: 'social', name: 'Social Hub', description: 'Stories & Connect', icon: Users, route: '/social', category: 'Social', color: 'bg-cyan-500' },
  
  // Commerce
  { id: 'shop', name: 'Shop', description: 'Buy exclusive items', icon: ShoppingBag, route: '/shop', category: 'Commerce', color: 'bg-purple-500' },
  { id: 'marketplace', name: 'Marketplace', description: 'P2P trading', icon: Store, route: '/shop', category: 'Commerce', color: 'bg-orange-500' },
  
  // Financial
  { id: 'wallet', name: 'Wallet', description: 'Manage your XP', icon: Wallet, route: '/wallet', category: 'Financial', color: 'bg-emerald-500' },
  { id: 'transfer', name: 'Transfer', description: 'Send XP to friends', icon: TrendingUp, route: '/transfer', category: 'Financial', color: 'bg-teal-500' },
  { id: 'gifts', name: 'Gifts', description: 'Send virtual gifts', icon: Gift, route: '/social', category: 'Financial', color: 'bg-pink-500' },
  
  // Entertainment
  { id: 'games', name: 'Games', description: 'Play & earn XP', icon: Gamepad2, route: '/games', category: 'Entertainment', color: 'bg-indigo-500' },
  { id: 'leaderboard', name: 'Leaderboard', description: 'Top players', icon: Trophy, route: '/leaderboard', category: 'Entertainment', color: 'bg-yellow-500' },
  
  // Services (NEW)
  { id: 'food', name: 'Food Delivery', description: 'Order meals', icon: Utensils, route: '/food-delivery', category: 'Services', color: 'bg-red-500', isNew: true },
  { id: 'booking', name: 'Bookings', description: 'Reserve services', icon: Calendar, route: '/bookings', category: 'Services', color: 'bg-cyan-500', isNew: true },
  { id: 'rides', name: 'Rides', description: 'Book transportation', icon: Car, route: '/rides', category: 'Services', color: 'bg-slate-700', isNew: true },
  { id: 'travel', name: 'Travel', description: 'Flights & hotels', icon: Plane, route: '/travel', category: 'Services', color: 'bg-sky-500', isNew: true },
  { id: 'events', name: 'Events', description: 'Tickets & venues', icon: Ticket, route: '/events', category: 'Services', color: 'bg-violet-500', isNew: true },
  
  // Business
  { id: 'business', name: 'Business Hub', description: 'Grow your business', icon: Building2, route: '/business/dashboard', category: 'Business', color: 'bg-amber-600' },
  { id: 'affiliate', name: 'Affiliate', description: 'Earn commissions', icon: Briefcase, route: '/affiliate-dashboard', category: 'Business', color: 'bg-rose-500' },
  
  // Tools
  { id: 'mini', name: 'Mini Programs', description: 'Explore mini-apps', icon: Zap, route: '/mini-programs', category: 'Tools', color: 'bg-lime-500' },
];

const categories = ['All', 'Social', 'Commerce', 'Financial', 'Entertainment', 'Services', 'Business', 'Tools'];

const SuperAppHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredServices = services.filter(s => s.isNew).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AfuChat Super App
              </h1>
              <p className="text-sm text-muted-foreground">Everything you need, all in one place</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Settings
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services, features, mini-programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Featured Services */}
        {!searchQuery && selectedCategory === 'All' && featuredServices.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">New Services</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredServices.map((service) => (
                <Card
                  key={service.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-primary/20"
                  onClick={() => navigate(service.route)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('p-3 rounded-xl', service.color)}>
                      <service.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="default">New</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Services Grid */}
        <section>
          <h2 className="text-xl font-bold mb-4">
            {selectedCategory === 'All' ? 'All Services' : selectedCategory}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all hover:scale-105 group"
                onClick={() => navigate(service.route)}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={cn('p-4 rounded-2xl group-hover:scale-110 transition-transform', service.color)}>
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 flex items-center justify-center gap-2">
                      {service.name}
                      {service.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                    </h3>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services found matching your search</p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        {!searchQuery && selectedCategory === 'All' && (
          <section>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/transfer')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Send Money</h3>
                      <p className="text-sm text-muted-foreground">Transfer XP instantly</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/games')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                      <Gamepad2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Play Games</h3>
                      <p className="text-sm text-muted-foreground">Earn XP & compete</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default SuperAppHub;
