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
import { ArrowLeft, Search, Star, Download, Gamepad2, ShoppingBag, Music, Video, Book, Zap } from 'lucide-react';
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
    { id: 'all', name: t('miniPrograms.all'), icon: Zap },
    { id: 'games', name: t('miniPrograms.games'), icon: Gamepad2 },
    { id: 'shopping', name: t('miniPrograms.shopping'), icon: ShoppingBag },
    { id: 'entertainment', name: t('miniPrograms.entertainment'), icon: Music },
    { id: 'media', name: t('miniPrograms.media'), icon: Video },
    { id: 'education', name: t('miniPrograms.education'), icon: Book },
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

  const filteredPrograms = miniPrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || program.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/services')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Mini Programs</h1>
            </div>
          </div>

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
                            {t('miniPrograms.open')}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleUninstall(program.id)}
                          >
                            {t('miniPrograms.installed')}
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

          {!loading && filteredPrograms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No mini programs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniPrograms;
