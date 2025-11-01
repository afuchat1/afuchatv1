import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatRoom from "./pages/ChatRoom";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PostDetail from "./pages/PostDetail";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const ProfileRedirect = () => {
  const { userId } = useParams();
  return <Navigate to={`/${userId}`} replace />;
};

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
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/post/:postId" element={<PostDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />

            <Route path="/profile/:userId" element={<ProfileRedirect />} />

            <Route path="/:userId" element={<Profile />} />
            <Route path="/:userId/edit" element={<EditProfile />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
