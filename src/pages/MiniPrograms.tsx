import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Download, Gamepad2, ShoppingBag, Music, Video, Book, Zap, Calendar, Plane, UtensilsCrossed, Car, CalendarCheck, Wallet, Image, Brain, Puzzle, Trophy, Sparkles, TrendingUp, Users, ArrowRight, Grid3x3 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';

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

  // Calculate statistics
  const totalApps = allBuiltInApps.length + miniPrograms.length;
  const totalInstalls = miniPrograms.reduce((sum, p) => sum + p.install_count, 0);
  const featuredApps = [...builtInGames.slice(0, 2), ...builtInServices.slice(0, 2)];

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-safe">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b border-border"
        >
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                <Grid3x3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Mini Programs
                </h1>
                <p className="text-muted-foreground mt-1">Discover apps, games, and services</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50"
              >
                <Sparkles className="h-5 w-5 text-primary mb-2" />
                <div className="text-2xl font-bold">{totalApps}</div>
                <div className="text-xs text-muted-foreground">Total Apps</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50"
              >
                <TrendingUp className="h-5 w-5 text-primary mb-2" />
                <div className="text-2xl font-bold">{totalInstalls.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Installs</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50"
              >
                <Users className="h-5 w-5 text-primary mb-2" />
                <div className="text-2xl font-bold">{installedApps.size}</div>
                <div className="text-xs text-muted-foreground">Installed</div>
              </motion.div>
            </div>

            {/* Search */}
            <div className="mt-8 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search apps, games, and services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 rounded-2xl bg-card/50 backdrop-blur-sm border-border/50 text-base"
              />
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Category Pills */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                      : 'bg-card hover:bg-accent border border-border/50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {cat.name}
                </motion.button>
              );
            })}
          </div>

          {/* Featured Section - Only show when 'all' category selected */}
          {selectedCategory === 'all' && !searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Featured</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredApps.map((app, index) => {
                  const Icon = app.icon;
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleBuiltInLaunch(app.route)}
                      className="cursor-pointer group relative overflow-hidden rounded-3xl border-2 border-border bg-card hover:border-primary/50 transition-all duration-300"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                      <div className="relative p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 rounded-2xl ${app.color} shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="h-10 w-10 text-white" />
                          </div>
                          <Badge className="bg-primary/10 text-primary border-primary/20">Featured</Badge>
                        </div>
                        <h3 className="text-2xl font-bold mb-3">{app.name}</h3>
                        <p className="text-muted-foreground mb-6">{app.description}</p>
                        <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-2 transition-transform">
                          {app.category === 'games' ? 'Play Now' : 'Open App'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Built-in Games Section */}
          {(selectedCategory === 'all' || selectedCategory === 'games') && filteredBuiltInApps.some(app => app.category === 'games') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                    <Gamepad2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-2xl font-bold">Games</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/leaderboard')}
                  className="gap-2 hover:bg-primary/10"
                >
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuiltInApps.filter(app => app.category === 'games').map((game, index) => {
                  const Icon = game.icon;
                  return (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleBuiltInLaunch(game.route)}
                      className="cursor-pointer group relative overflow-hidden rounded-3xl border border-border bg-card hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                      <div className="relative p-6">
                        <div className={`inline-flex p-4 rounded-2xl ${game.color} mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{game.name}</h3>
                        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{game.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                            Play Now
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </div>
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Built-in Services Section */}
          {(selectedCategory === 'all' || selectedCategory === 'services') && filteredBuiltInApps.some(app => app.category === 'services') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold">Services</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuiltInApps.filter(app => app.category === 'services').map((service, index) => {
                  const Icon = service.icon;
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleBuiltInLaunch(service.route)}
                      className="cursor-pointer group relative overflow-hidden rounded-3xl border border-border bg-card hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                      <div className="relative p-6">
                        <div className={`inline-flex p-4 rounded-2xl ${service.color} mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                            Open App
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </div>
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* User Mini Programs */}
          {filteredPrograms.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold">Community Apps</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program, index) => {
                  const isInstalled = installedApps.has(program.id);
                  
                  return (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="h-full hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 border-border rounded-3xl overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-1 ring-border">
                                {program.icon_url ? (
                                  <img src={program.icon_url} alt={program.name} className="h-12 w-12 rounded-xl object-cover" />
                                ) : (
                                  <Zap className="h-7 w-7 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate">{program.name}</CardTitle>
                                <p className="text-xs text-muted-foreground truncate">
                                  by {program.profiles.display_name}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="capitalize shrink-0 ml-2">
                              {program.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <CardDescription className="line-clamp-2 text-sm">
                            {program.description || 'No description available'}
                          </CardDescription>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-semibold">{program.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Download className="h-4 w-4" />
                              <span className="font-medium">{program.install_count.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            {isInstalled ? (
                              <>
                                <Button 
                                  className="flex-1 rounded-xl h-11"
                                  onClick={() => handleLaunch(program.url)}
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Open
                                </Button>
                                <Button 
                                  variant="outline"
                                  className="rounded-xl h-11"
                                  onClick={() => handleUninstall(program.id)}
                                >
                                  <Download className="h-4 w-4 fill-current" />
                                </Button>
                              </>
                            ) : (
                              <Button 
                                className="w-full rounded-xl h-11"
                                onClick={() => handleInstall(program.id)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Install
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {!loading && filteredPrograms.length === 0 && filteredBuiltInApps.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="inline-flex p-6 rounded-3xl bg-muted/50 mb-6">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No programs found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MiniPrograms;
