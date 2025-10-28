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
import { Skeleton } from '@/components/ui/skeleton'; 

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

  // 🚀 CORRECTED: Skeleton Loading Implementation
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
        
        {/* Tabs Skeleton (Feed left, Chats right) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-10 w-full" /> {/* Feed Tab Skeleton */}
          <Skeleton className="h-10 w-full" /> {/* Chats Tab Skeleton */}
        </div>

        {/* Content/List Skeleton (Simulating conversation/post items) */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-2">
             <Skeleton className="h-10 w-10 rounded-full" />
             <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
             </div>
          </div>
          <div className="flex items-center space-x-3 p-2">
             <Skeleton className="h-10 w-10 rounded-full" />
             <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
             </div>
          </div>
          <div className="flex items-center space-x-3 p-2">
             <Skeleton className="h-10 w-10 rounded-full" />
             <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-5/6" />
             </div>
          </div>
        </div>
      </div>
    );
  }
  // --- End Skeleton Loading ---

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
          {/* Tab Order: Feed (left), Chats (right) */}
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chats
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
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
