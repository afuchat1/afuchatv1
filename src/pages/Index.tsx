import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Radio, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Chats from './Chats';
import Feed from './Feed';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming you have a Skeleton component

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/auth');
    }
  };

  // --- IMPLEMENTED: Skeleton Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="h-14 flex items-center justify-between border-b border-border bg-card mb-4 p-4">
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Content/List Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  // --- END: Skeleton Loading ---

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">AfuChat</h1>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => navigate('/settings')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* --- IMPLEMENTED: Tab Order (Chats left, Feed right) --- */}
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Feed
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="chats" className="h-full mt-0">
              <Chats />
            </TabsContent>
            <TabsContent value="feed" className="h-full mt-0">
              <Feed />
            </TabsContent>
          </div>
          {/* --- END: Tab Order --- */}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
