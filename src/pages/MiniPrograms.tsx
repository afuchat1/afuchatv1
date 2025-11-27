import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Star, Download, Gamepad2, ShoppingBag, Music, Video, Book, Zap, Calendar, Plane, UtensilsCrossed, Car, CalendarCheck, Wallet, Image, Brain, Puzzle, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface MiniProgram {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  developer_id: string;
  category: string;
  url: string;
  install_count: number;
  rating: number;
  profiles: {
    display_name: string;
  };
}

const MiniPrograms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [miniPrograms, setMiniPrograms] = useState<MiniProgram[]>([]);
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All', icon: Zap },
    { id: 'games', name: 'Games', icon: Gamepad2 },
    { id: 'services', name: 'Services', icon: Star },
    { id: 'shopping', name: 'Shopping', icon: ShoppingBag },
    { id: 'entertainment', name: 'Entertainment', icon: Music },
    { id: 'media', name: 'Media', icon: Video },
    { id: 'education', name: 'Education', icon: Book },
  ];

  // Built-in games
  const builtInGames = [
    { 
      id: 'nexa-collector',
      name: 'Nexa Collector',
      description: 'Click orbs to collect Nexa and level up',
      icon: Zap,
      category: 'games',
      route: '/game',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-500',
      isBuiltIn: true
    },
    { 
      id: 'memory-match',
      name: 'Memory Match',
      description: 'Test your memory by matching pairs',
      icon: Brain,
      category: 'games',
      route: '/memory-game',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
      isBuiltIn: true
    },
    { 
      id: '15-puzzle',
      name: '15 Puzzle',
      description: 'Solve the classic sliding puzzle',
      icon: Puzzle,
      category: 'games',
      route: '/puzzle-game',
      color: 'bg-blue-600',
      gradient: 'from-blue-600 to-cyan-500',
      isBuiltIn: true
    },
    { 
      id: 'trivia-challenge',
      name: 'Trivia Challenge',
      description: 'Answer questions to test your knowledge',
      icon: Brain,
      category: 'games',
      route: '/trivia-game',
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-purple-600',
      isBuiltIn: true
    },
  ];

  // Built-in services
  const builtInServices = [
    { 
      id: 'events',
      name: 'Events',
      description: 'Discover and book events near you',
      icon: Calendar,
      category: 'services',
      route: '/events',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
      isBuiltIn: true
    },
    { 
      id: 'travel',
      name: 'Travel',
      description: 'Book flights, hotels and plan your trips',
      icon: Plane,
      category: 'services',
      route: '/travel',
      color: 'bg-sky-500',
      gradient: 'from-sky-500 to-blue-500',
      isBuiltIn: true
    },
    { 
      id: 'food-delivery',
      name: 'Food Delivery',
      description: 'Order food from your favorite restaurants',
      icon: UtensilsCrossed,
      category: 'services',
      route: '/food-delivery',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-500',
      isBuiltIn: true
    },
    { 
      id: 'rides',
      name: 'Rides',
      description: 'Book rides and transportation services',
      icon: Car,
      category: 'services',
      route: '/rides',
      color: 'bg-green-500',
      gradient: 'from-green-500 to-emerald-500',
      isBuiltIn: true
    },
    { 
      id: 'bookings',
      name: 'Bookings',
      description: 'Manage all your reservations in one place',
      icon: CalendarCheck,
      category: 'services',
      route: '/bookings',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
      isBuiltIn: true
    },
    { 
      id: 'finance',
      name: 'Financial Hub',
      description: 'Manage your wallet and transactions',
      icon: Wallet,
      category: 'services',
      route: '/wallet',
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
      isBuiltIn: true
    },
    { 
      id: 'moments',
      name: 'Moments',
      description: 'Share and view stories and moments',
      icon: Image,
      category: 'services',
      route: '/moments',
      color: 'bg-pink-500',
      gradient: 'from-pink-500 to-rose-500',
      isBuiltIn: true
    },
  ];

  useEffect(() => {
    fetchMiniPrograms();
    fetchInstalledApps();
  }, []);

  const fetchMiniPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('mini_programs')
        .select(`
          *,
          profiles (display_name)
        `)
        .eq('is_published', true)
        .order('install_count', { ascending: false });

      if (error) throw error;
      setMiniPrograms(data || []);
    } catch (error) {
      console.error('Error fetching mini programs:', error);
      toast.error('Failed to load mini programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstalledApps = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_mini_programs')
        .select('mini_program_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setInstalledApps(new Set(data.map(d => d.mini_program_id)));
    } catch (error) {
      console.error('Error fetching installed apps:', error);
    }
  };

  const handleInstall = async (miniProgramId: string) => {
    if (!user) {
      toast.error('Please sign in to install apps');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_mini_programs')
        .insert({
          user_id: user.id,
          mini_program_id: miniProgramId
        });

      if (error) throw error;

      // Update install count
      await supabase.rpc('increment_mini_program_installs', {
        program_id: miniProgramId
      });

      setInstalledApps(prev => new Set([...prev, miniProgramId]));
      toast.success('App installed successfully!');
      fetchMiniPrograms();
    } catch (error: any) {
      console.error('Error installing app:', error);
      if (error.code === '23505') {
        toast.error('App already installed');
      } else {
        toast.error('Failed to install app');
      }
    }
  };

  const handleUninstall = async (miniProgramId: string) => {
    try {
      const { error } = await supabase
        .from('user_mini_programs')
        .delete()
        .eq('user_id', user?.id)
        .eq('mini_program_id', miniProgramId);

      if (error) throw error;

      setInstalledApps(prev => {
        const newSet = new Set(prev);
        newSet.delete(miniProgramId);
        return newSet;
      });
      toast.success('App uninstalled');
    } catch (error) {
      console.error('Error uninstalling app:', error);
      toast.error('Failed to uninstall app');
    }
  };

  const handleLaunch = (url: string) => {
    window.open(url, '_blank');
  };

  const handleBuiltInLaunch = (route: string) => {
    navigate(route);
  };

  // Combine built-in apps with user mini programs
  const allBuiltInApps = [...builtInGames, ...builtInServices];
  
  const filteredBuiltInApps = allBuiltInApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPrograms = miniPrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || program.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto">
        <div className="p-4">

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mini programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="p-4">
          <TabsList className="w-full grid grid-cols-3 md:grid-cols-6">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                <cat.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Mini Programs Grid */}
        <div className="p-4">
          {/* Built-in Games Section */}
          {(selectedCategory === 'all' || selectedCategory === 'games') && filteredBuiltInApps.some(app => app.category === 'games') && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Games</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/leaderboard')}
                  className="gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBuiltInApps.filter(app => app.category === 'games').map((game) => {
                  const Icon = game.icon;
                  return (
                    <div 
                      key={game.id}
                      className="cursor-pointer group relative overflow-hidden rounded-2xl border border-border bg-card hover:shadow-2xl transition-all duration-300"
                      onClick={() => handleBuiltInLaunch(game.route)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                      <div className="relative p-6">
                        <div className={`inline-flex p-4 rounded-2xl ${game.color} mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                        <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-2 transition-transform">
                          Play Now
                          <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Built-in Services Section */}
          {(selectedCategory === 'all' || selectedCategory === 'services') && filteredBuiltInApps.some(app => app.category === 'services') && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Services</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBuiltInApps.filter(app => app.category === 'services').map((service) => {
                  const Icon = service.icon;
                  return (
                    <div 
                      key={service.id}
                      className="cursor-pointer group relative overflow-hidden rounded-2xl border border-border bg-card hover:shadow-2xl transition-all duration-300"
                      onClick={() => handleBuiltInLaunch(service.route)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                      <div className="relative p-6">
                        <div className={`inline-flex p-4 rounded-2xl ${service.color} mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                        <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-2 transition-transform">
                          Open
                          <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Mini Programs */}
          {filteredPrograms.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Download className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Community Apps</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrograms.map((program) => {
                  const isInstalled = installedApps.has(program.id);
                  
                  return (
                    <Card key={program.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              {program.icon_url ? (
                                <img src={program.icon_url} alt={program.name} className="h-10 w-10 rounded-lg" />
                              ) : (
                                <Zap className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-base">{program.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                by {program.profiles.display_name}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {program.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CardDescription className="line-clamp-2">
                          {program.description || 'No description available'}
                        </CardDescription>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{program.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            <span>{program.install_count.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {isInstalled ? (
                            <>
                              <Button 
                                className="flex-1"
                                onClick={() => handleLaunch(program.url)}
                              >
                                Open
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleUninstall(program.id)}
                              >
                                Installed
                              </Button>
                            </>
                          ) : (
                            <Button 
                              className="w-full"
                              onClick={() => handleInstall(program.id)}
                            >
                              Install
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && filteredPrograms.length === 0 && filteredBuiltInApps.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No programs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniPrograms;
