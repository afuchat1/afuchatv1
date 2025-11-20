import React, { Suspense, lazy } from "react";
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
import { Loader2 } from "lucide-react";

// Eager load critical pages
import Home from "./pages/Home";
import Welcome from "./pages/auth/Welcome";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import NotFound from "./pages/NotFound";

// Lazy load other pages
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ChatsPage = lazy(() => import("./pages/Chats"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const SearchPage = lazy(() => import("./pages/Search"));
const ShopPage = lazy(() => import("./pages/Shop"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Install = lazy(() => import("./pages/Install"));
const Support = lazy(() => import("./pages/Support"));

const UnifiedLeaderboard = lazy(() => import("./pages/UnifiedLeaderboard"));
const Wallet = lazy(() => import("./pages/Wallet"));
const QRCode = lazy(() => import("./pages/QRCode"));
const Settings = lazy(() => import("./pages/Settings"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TrendingHashtags = lazy(() => import("./pages/TrendingHashtags"));
const AdminAffiliateRequests = lazy(() => import("./pages/AdminAffiliateRequests"));
const AdminVerificationRequests = lazy(() => import("./pages/AdminVerificationRequests"));
const AffiliateRequest = lazy(() => import("./pages/AffiliateRequest"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const Moments = lazy(() => import("./pages/Moments"));
const MiniPrograms = lazy(() => import("./pages/MiniPrograms"));
const Transfer = lazy(() => import("./pages/Transfer"));
const RedEnvelope = lazy(() => import("./pages/RedEnvelope"));
const DeveloperSDK = lazy(() => import("./pages/DeveloperSDK"));
const VerificationRequest = lazy(() => import("./pages/VerificationRequest"));
const Followers = lazy(() => import("./pages/Followers"));
const Following = lazy(() => import("./pages/Following"));
const SuggestedUsers = lazy(() => import("./pages/SuggestedUsers"));
const SimpleGame = lazy(() => import("./pages/SimpleGame"));
const MemoryGame = lazy(() => import("./pages/MemoryGame"));
const PuzzleGame = lazy(() => import("./pages/PuzzleGame"));
const TriviaGame = lazy(() => import("./pages/TriviaGame"));
const Games = lazy(() => import("./pages/Games"));
const FinancialHub = lazy(() => import("./pages/FinancialHub"));
const SocialHub = lazy(() => import("./pages/SocialHub"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const SuperAppHub = lazy(() => import("./pages/SuperAppHub"));
const FoodDelivery = lazy(() => import("./pages/FoodDelivery"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Rides = lazy(() => import("./pages/Rides"));
const Travel = lazy(() => import("./pages/Travel"));
const Events = lazy(() => import("./pages/Events"));
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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/hub" element={<Layout><SuperAppHub /></Layout>} />
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
      <Route path="/support" element={<Support />} />
      <Route path="/leaderboard" element={<Layout><UnifiedLeaderboard /></Layout>} />
      <Route path="/wallet" element={<Layout><FinancialHub /></Layout>} />
      <Route path="/social" element={<Layout><SocialHub /></Layout>} />
      <Route path="/qr-code" element={<Layout><QRCode /></Layout>} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="/security" element={<Layout><SecurityDashboard /></Layout>} />
      <Route path="/change-password" element={<Layout><ChangePassword /></Layout>} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/suggested-users" element={<SuggestedUsers />} />
      <Route path="/trending" element={<Layout><TrendingHashtags /></Layout>} />
      <Route path="/admin/affiliate-requests" element={<Layout><AdminAffiliateRequests /></Layout>} />
      <Route path="/admin/verification-requests" element={<Layout><AdminVerificationRequests /></Layout>} />
      <Route path="/affiliate-request" element={<Layout><AffiliateRequest /></Layout>} />
      <Route path="/affiliate-dashboard" element={<Layout><AffiliateDashboard /></Layout>} />
      <Route path="/business/dashboard" element={<Layout><BusinessDashboard /></Layout>} />
      <Route path="/moments" element={<Layout><Moments /></Layout>} />
      <Route path="/mini-programs" element={<Layout><MiniPrograms /></Layout>} />
      <Route path="/transfer" element={<Layout><Transfer /></Layout>} />
      <Route path="/red-envelope" element={<Layout><RedEnvelope /></Layout>} />
      <Route path="/developer-sdk" element={<Layout><DeveloperSDK /></Layout>} />
      <Route path="/verification-request" element={<Layout><VerificationRequest /></Layout>} />
      <Route path="/games" element={<Layout><Games /></Layout>} />
      <Route path="/game" element={<Layout><SimpleGame /></Layout>} />
      <Route path="/memory-game" element={<Layout><MemoryGame /></Layout>} />
      <Route path="/puzzle-game" element={<Layout><PuzzleGame /></Layout>} />
      <Route path="/trivia-game" element={<Layout><TriviaGame /></Layout>} />
      
      {/* New Super App Services */}
      <Route path="/food-delivery" element={<Layout><FoodDelivery /></Layout>} />
      <Route path="/bookings" element={<Layout><Bookings /></Layout>} />
      <Route path="/rides" element={<Layout><Rides /></Layout>} />
      <Route path="/travel" element={<Layout><Travel /></Layout>} />
      <Route path="/events" element={<Layout><Events /></Layout>} />

      <Route path="/profile/:userId" element={<ProfileRedirect />} />

      <Route path="/:userId" element={<Layout><Profile /></Layout>} />
      <Route path="/:userId/edit" element={<Layout><EditProfile /></Layout>} />
      <Route path="/:userId/followers" element={<Layout><Followers /></Layout>} />
      <Route path="/:userId/following" element={<Layout><Following /></Layout>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
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
