import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatRoom from "./pages/ChatRoom";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";

// --- 1. IMPORT THE NEW POSTDETAIL PAGE ---
import PostDetail from "./pages/PostDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/chat/:chatId" element={<ChatRoom />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            
            {/* --- 2. ADD THE NEW ROUTE FOR POSTS --- */}
            <Route path="/post/:postId" element={<PostDetail />} />

            {/* CATCH-ALL "*" ROUTE MUST BE LAST */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
