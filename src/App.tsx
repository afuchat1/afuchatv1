import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// NOTE: useParams is not needed in this file anymore, removed it from import
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute"; 
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatRoom from "./pages/ChatRoom";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PostDetail from "./pages/PostDetail";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// The purpose of this component is now obsolete since the Profile component
// itself needs to handle the parameter as /:userId. 
// However, since it's only used for a temporary redirect, we can keep it
// but should ideally remove the /profile/:userId route entirely in the future.
// For now, removing useParams import to avoid warnings.
const ProfileRedirect = ({ userId }) => {
  // We need to access the route parameter via props or re-import useParams
  // Since we removed useParams from the top, let's keep the parameter access local.
  const { userId: paramUserId } = useParams();
  return <Navigate to={`/${paramUserId}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* 1. 🏠 Public/Index routes (must come first) */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Post detail usually allows non-logged-in viewing */}
            <Route path="/post/:postId" element={<PostDetail />} /> 

            {/* 2. 🔒 Protected User Routes (Require Auth) */}
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute>
                  <ChatRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            
            {/* 3. 👑 Protected Admin Route (CRITICAL: Must be above the generic /:userId route) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 4. 🔁 Redirect old /profile/:userId -> /:userId (This is a fixed path, so it can go here) */}
            <Route path="/profile/:userId" element={<ProfileRedirect />} />

            {/* 5. 👤 Clean username-based route (Catch-all for identifiers) - THIS MUST BE LAST OF THE FIXED ROUTES */}
            <Route path="/:userId" element={<Profile />} />

            {/* 6. 🚫 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
