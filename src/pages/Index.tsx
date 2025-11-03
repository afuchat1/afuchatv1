import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Radio, Send, MessageSquarePlus, Search as SearchIcon, User, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Chats from './Chats';
import Feed from './Feed';
import Search from './Search';
import NewPostModal from '@/components/ui/NewPostModal';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import NewChatDialog from '@/components/ui/NewChatDialog';
import NotificationIcon from '@/components/nav/NotificationIcon';


// --- FAB Components (Positioned at bottom-20, above the collapsible nav) ---
// Note: FAB visibility is now controlled by the parent component's translate class
const NewPostFAB = ({ onClick, visible, isNavVisible }) => (
  <Button 
    size="lg" 
    onClick={onClick}
    aria-label="Create new post"
    className={`fixed bottom-20 right-6 rounded-full shadow-2xl h-14 w-14 transition-all duration-300 ease-in-out z-50 ${
      (visible && isNavVisible) ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
    }`}
  >
    <Send className="h-6 w-6" />
  </Button>
);

const NewChatFAB = ({ onClick, visible, isNavVisible }) => (
  <Button 
    size="lg" 
    onClick={onClick}
    aria-label="Start new chat"
    className={`fixed bottom-20 right-6 rounded-full shadow-2xl h-14 w-14 transition-all duration-300 ease-in-out z-50 ${
      (visible && isNavVisible) ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
    }`}
  >
    <MessageSquarePlus className="h-6 w-6" />
  </Button>
);
// --- END FAB Components ---

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed'); 
  const [isPostModalOpen, setIsPostModalOpen] = useState(false); 
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [forceLoaded, setForceLoaded] = useState(false);

  // --- Scroll-Hiding Nav State ---
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const headerRef = useRef(null);
  // -------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // --- Scroll Logic for Hiding All Elements ---
  useEffect(() => {
    const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 56; // Fallback to 56px (h-14)

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hiding condition: Scrolling down AND scrolled past the initial header height
      if (currentScrollY > lastScrollY.current && currentScrollY > headerHeight) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Showing condition: Scrolling up
        setIsNavVisible(true);
      } else if (currentScrollY <= headerHeight) {
        // Always show at the top of the page
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  // ------------------------------------

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const effectiveLoading = loading && !forceLoaded;

  const handleViewProfile = () => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleNewPost = () => {
    if (user) {
      setIsPostModalOpen(true);
    } else {
      // If user is not logged in, clicking the FAB takes them to auth
      navigate('/auth'); 
    }
  };

  const handleNewChat = () => {
    if (user) {
      setIsChatModalOpen(true);
    } else {
      // If user is not logged in, clicking the FAB takes them to auth
      navigate('/auth');
    }
  };

  const headerTranslateClass = isNavVisible ? 'translate-y-0' : '-translate-y-full';
  const navTranslateClass = isNavVisible ? 'translate-y-0' : 'translate-y-full';


  if (effectiveLoading) {
    // Skeleton loading state
    return (
      <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto">
        <div className="h-14 flex items-center justify-between rounded-b-lg">
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6 pt-4">
          <Skeleton className="h-10 w-full rounded-full" /> 
          <Skeleton className="h-10 w-full rounded-full" /> 
          <Skeleton className="h-10 w-full rounded-full" /> 
        </div>
        <div className="space-y-6 pt-2">
          <div className="p-4 rounded-xl shadow-xl space-y-3">
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
          <div className="p-4 rounded-xl shadow-xl space-y-3">
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
        <Skeleton className="fixed bottom-20 right-6 h-14 w-14 rounded-full" />
      </div>
    );
  }

  return (
    // Removed pb-16 since the fixed nav no longer occupies space when hidden
    <div className="min-h-screen bg-background flex flex-col"> 
      {/* Header (Hides on Scroll Down) */}
      <header 
        ref={headerRef}
        className={`bg-background sticky top-0 z-20 transition-transform duration-300 ease-in-out ${headerTranslateClass}`}
      >
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="md" />
            <h1 className="text-lg font-bold text-primary">AfuChat</h1>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Conditional Login Button or User Icons */}
            {user ? (
              // Logged In: Show icons
              <>
                {/* START: UPDATED SUBSCRIBE BUTTON (Pink, fully rounded) */}
                <Button 
                  size="sm" 
                  variant="default" // Use default variant or remove for full control
                  className="text-xs font-semibold h-8 px-3 rounded-full bg-pink-500 hover:bg-pink-600 text-white"
                >
                  Subscribe
                </Button>
                {/* END: UPDATED SUBSCRIBE BUTTON */}
                <NotificationIcon />
                {isAdmin && (
                  <Link to="/admin">
                    <Button size="icon" variant="ghost" className="rounded-full">
                      <Shield className="h-5 w-5 text-primary" />
                    </Button>
                  </Link>
                )}
                <Link to={`/profile/${user.id}`}>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            ) : (
              // Logged Out: Show Log In Button
              <Link to="/auth">
                <Button size="sm" variant="default" className="text-sm font-semibold">
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-1 relative">
            <TabsContent value="feed" className="h-full mt-0">
              <Feed />
            </TabsContent>
            <TabsContent value="search" className="h-full mt-0">
              <Search />
            </TabsContent>
            <TabsContent value="chats" className="h-full mt-0">
              <Chats />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Bottom Navigation (Hides on Scroll Down) */}
      <nav 
        className={`fixed bottom-0 left-0 right-0 bg-background z-30 transition-transform duration-300 ease-in-out ${navTranslateClass}`}
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-4 h-14">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'feed' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span className="text-xs font-medium">Feed</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'search' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <SearchIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Search</span>
            </button>
            
            {/* --- MODIFIED CHATS BUTTON (Ghosted when logged out) --- */}
            <button
              // Navigate to auth if not logged in, otherwise set tab
              onClick={() => user ? setActiveTab('chats') : navigate('/auth')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                user 
                  ? (activeTab === 'chats' ? 'text-primary' : 'text-muted-foreground')
                  : 'text-muted-foreground opacity-50' // Ghosted style
              }`}
              title={user ? "Open Chats" : "Log in to view chats"}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium">Chats</span>
            </button>
            {/* --- END MODIFIED CHATS BUTTON --- */}

            {/* --- MODIFIED AFUAI BUTTON (Ghosted when logged out) --- */}
            <button
              // Navigate to auth if not logged in, otherwise navigate to AI Chat page
              onClick={() => user ? navigate('/ai-chat') : navigate('/auth')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                user 
                  ? 'text-muted-foreground hover:text-primary' 
                  : 'text-muted-foreground opacity-50' // Ghosted style
              }`}
              title={user ? "Talk to AfuAI" : "Log in to use AfuAI"}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span className="text-xs font-medium">AfuAI</span>
            </button>
            {/* --- END MODIFIED AFUAI BUTTON --- */}
          </div>
        </div>
      </nav>
      
      {/* FAB for new content (Visibility now depends on isNavVisible) */}
      {/* Only show FABs if the user is authenticated */}
      {/* The FABs will now also navigate to /auth if clicked when the user is logged out (handled in handleNewPost/handleNewChat) */}
      {activeTab === 'feed' && <NewPostFAB onClick={handleNewPost} visible={true} isNavVisible={isNavVisible} />}
      {activeTab === 'chats' && <NewChatFAB onClick={handleNewChat} visible={true} isNavVisible={isNavVisible} />}
      
      {/* Modals */}
      <NewPostModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
      />
      
      <NewChatDialog
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
    </div>
  );
};

export default Index;
