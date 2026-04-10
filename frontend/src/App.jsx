import { ThemeProvider, Navbar, Sidebar } from '@/components/index';
import LandingPage from "@/pages/LandingPage.jsx";
import SignupPage from "@/pages/SignupPage.jsx";
import RecommendationsPage from "@/pages/RecommendationsPage";
import ProfilePage from "@/pages/ProfilePage.jsx";
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useState } from "react";
import { cn } from "@/lib/utils.js";
import { Menu } from "lucide-react";

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);

  const location = useLocation();
  const isLandingPage = location.pathname === "/";

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
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;