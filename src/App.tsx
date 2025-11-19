import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AccountModeProvider } from "./contexts/AccountModeContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useDailyLogin } from "./hooks/useDailyLogin";
import { useLanguageSync } from "./hooks/useLanguageSync";
import { useScrollRestoration } from "./hooks/useScrollRestoration";
import { usePushNotifications } from "./hooks/usePushNotifications";
import Home from "./pages/Home";
import Welcome from "./pages/auth/Welcome";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
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
import AdminAffiliateRequests from "./pages/AdminAffiliateRequests";
import AffiliateRequest from "./pages/AffiliateRequest";
import BusinessDashboard from "./pages/BusinessDashboard";
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
  // Setup push notifications
  usePushNotifications();

  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/auth" element={<Welcome />} />
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/chats" element={<Layout><ChatsPage /></Layout>} />
      <Route path="/chat/:chatId" element={<Layout><ChatRoom /></Layout>} />
      <Route path="/search" element={<Layout><SearchPage /></Layout>} />
      <Route path="/shop" element={<Layout><ShopPage /></Layout>} />
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
      <Route path="/admin/affiliate-requests" element={<Layout><AdminAffiliateRequests /></Layout>} />
      <Route path="/affiliate-request" element={<Layout><AffiliateRequest /></Layout>} />
      <Route path="/business/dashboard" element={<Layout><BusinessDashboard /></Layout>} />

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
        <AccountModeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true }}>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AccountModeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
