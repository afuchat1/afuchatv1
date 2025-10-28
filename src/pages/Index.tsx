import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Radio, Settings, LogOut, Send, MessageSquarePlus } from 'lucide-react'; // Added Send and MessageSquarePlus
import { supabase } from '@/integrations/supabase/client';
import Chats from './Chats';
import Feed from './Feed';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton'; 

// --- FAB Components (New UI for Instantaneous Utility) ---

// FAB for creating a new post (for the Feed tab)
const NewPostFAB = () => (
    <Button 
        size="lg" 
        className="fixed bottom-6 right-6 rounded-full shadow-2xl h-14 w-14 transition-transform duration-200 hover:scale-105 bg-primary"
        // onClick={() => console.log('Open New Post Modal')} // Placeholder action
    >
        <Send className="h-6 w-6" />
    </Button>
);

// FAB for creating a new chat (for the Chats tab)
const NewChatFAB = () => (
    <Button 
        size="lg" 
        className="fixed bottom-6 right-6 rounded-full shadow-2xl h-14 w-14 transition-transform duration-200 hover:scale-105 bg-primary"
        // onClick={() => console.log('Open New Chat Modal')} // Placeholder action
    >
        <MessageSquarePlus className="h-6 w-6" />
    </Button>
);
// --- END FAB Components ---

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed'); 

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

  // --- Skeleton Loading (Rich UI simulation) ---
  if (loading) {
    // ... (Skeleton code remains the same as previous step for brevity)
    return (
      <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="h-14 flex items-center justify-between border-b border-border bg-card mb-4 p-4 shadow-md rounded-b-lg">
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-10 w-full rounded-full" /> 
          <Skeleton className="h-10 w-full rounded-full" /> 
        </div>

        {/* Content/List Skeleton */}
        <div className="space-y-6 pt-2">
          <div className="p-4 rounded-xl bg-card shadow-xl space-y-3">
             <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                <Skeleton className="h-4 w-1/4 bg-muted" />
             </div>
             <Skeleton className="h-4 w-full bg-muted" />
             <Skeleton className="h-4 w-5/6 bg-muted" />
             <div className="pt-2 flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
             </div>
          </div>
          <div className="p-4 rounded-xl bg-card shadow-xl space-y-3">
             <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-1/3" />
             </div>
             <Skeleton className="h-4 w-4/5 bg-muted" />
             <Skeleton className="h-4 w-2/3 bg-muted" />
             <div className="pt-2 flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
             </div>
          </div>
        </div>
        {/* FAB Skeleton */}
        <Skeleton className="fixed bottom-6 right-6 h-14 w-14 rounded-full" />
      </div>
    );
  }
  // --- End Skeleton Loading ---

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header (No borders used in previous step) */}
      <header className="bg-card shadow-md">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-primary tracking-wide">AfuChat</h1>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => navigate('/settings')} className="text-foreground hover:bg-muted rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleSignOut} className="text-foreground hover:bg-muted rounded-full">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Tabs - Rich Pill Tabs */}
          <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 rounded-full shadow-inner">
            <TabsTrigger 
              value="feed" 
              className="flex items-center gap-2 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:font-bold transition-all duration-300"
            >
              <Radio className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger 
              value="chats" 
              className="flex items-center gap-2 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:font-bold transition-all duration-300"
            >
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
      
      {/* --- FAB Renderer --- */}
      {activeTab === 'feed' && <NewPostFAB />}
      {activeTab === 'chats' && <NewChatFAB />}
      {/* --- END FAB Renderer --- */}
    </div>
  );
};

export default Index;
