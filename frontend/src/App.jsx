import { ThemeProvider, Navbar, Sidebar } from '@/components/index';
import LandingPage from "@/pages/LandingPage.jsx";
import SignupPage from "@/pages/SignupPage.jsx";
import RecommendationsPage from "@/pages/RecommendationsPage";
import ActivationPage from "@/pages/ActivationPage.jsx"
import ProfilePage from "@/pages/ProfilePage.jsx";
import SettingsPage from "@/pages/SettingsPage.jsx";
import EmailChangeConfirmPage from "@/pages/EmailChangeConfirmPage.jsx";
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PresenceProvider } from '@/context/PresenceContext';
import { useState } from "react";
import { cn } from "@/lib/utils.js";
import { Menu } from "lucide-react";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "@/pages/ResetPasswordPage.jsx";
import PublicProfilePage from "@/pages/PublicProfilePage.jsx";
import MessagesPage from "@/pages/MessagesPage.jsx";
import TeamPage from "@/pages/TeamPage.jsx";
import NotFoundPage from "@/pages/NotFoundPage.jsx";
import SuccessRegistrationPage from "@/pages/SuccessRegistrationPage.jsx";

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);

  const location = useLocation();
  const isLandingPage = location.pathname === "/" || location.pathname === "/team";

  return (
    <div className="relative min-h-screen flex flex-col">
      {isLandingPage && <Navbar />}

      <div className="flex flex-1">
        {isAuthenticated && (
          <Sidebar
            render={isAuthenticated}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        )}

        {isAuthenticated && !isLandingPage && (
          <button
            id="mobile-menu-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="md:hidden fixed bottom-6 right-6 z-[60] bg-primary text-primary-foreground p-4 rounded-full shadow-2xl active:scale-90 transition-transform"
          >
            <Menu size={24} />
          </button>
        )}

        <main className={cn(
          "flex-1 transition-all duration-300 w-full",
          isAuthenticated
            ? (isCollapsed
                ? "md:pl-[80px] pl-0"
                : "md:pl-[280px] pl-0"
              )
            : "pl-0",
          isLandingPage ? "pt-[65px]" : "pt-0"
        )}>
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/team" element={<PublicRoute><TeamPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/success" element={<RegistrationSuccessRoute><SuccessRegistrationPage /></RegistrationSuccessRoute>}/>
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
            <Route path="/activate/:uid/:token" element={<PublicRoute><ActivationPage /></PublicRoute>} />
            <Route path="/confirm-email" element={<EmailChangeConfirmPage />} />
            <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/recommendations" replace /> : children;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const RegistrationSuccessRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to="/recommendations" replace />;
  }

  if (!location.state?.email) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <PresenceProvider>
          <AppContent />
        </PresenceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;