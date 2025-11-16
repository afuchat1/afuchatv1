import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useDailyLogin } from "./hooks/useDailyLogin";
import { useLanguageSync } from "./hooks/useLanguageSync";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ChatsPage from "./pages/ChatsPage";
import ChatRoom from "./pages/ChatRoom";
import SearchPage from "./pages/SearchPage";
import ShopPage from "./pages/ShopPage";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PostDetail from "./pages/PostDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AIChat from "./pages/AIChat";
import Install from "./pages/Install";
import Settings from "./pages/Settings";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Leaderboard from "./pages/Leaderboard";
import AvatarEditor from "./pages/AvatarEditor";
import GiftLeaderboard from "./pages/GiftLeaderboard";
import TrendingHashtags from "./pages/TrendingHashtags";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const ProfileRedirect = () => {
  const { userId } = useParams();
  return <Navigate to={`/${userId}`} replace />;
};

const AppRoutes = () => {
  // Check daily login streak automatically
  useDailyLogin();
  // Sync language preference from database
  useLanguageSync();
  // Restore scroll positions on navigation
  useScrollRestoration();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/chats" element={<ChatsPage />} />
      <Route path="/chat/:chatId" element={<Layout><ChatRoom /></Layout>} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
      <Route path="/post/:postId" element={<Layout><PostDetail /></Layout>} />
      <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
      <Route path="/ai-chat" element={<AIChat />} />
      <Route path="/install" element={<Install />} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
      <Route path="/gift-leaderboard" element={<Layout><GiftLeaderboard /></Layout>} />
      <Route path="/avatar/edit" element={<AvatarEditor />} />
      <Route path="/trending" element={<Layout><TrendingHashtags /></Layout>} />

      <Route path="/profile/:userId" element={<ProfileRedirect />} />

      <Route path="/:userId" element={<Layout><Profile /></Layout>} />
      <Route path="/:userId/edit" element={<Layout><EditProfile /></Layout>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
