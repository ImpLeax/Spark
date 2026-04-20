import { Link, useNavigate, useLocation } from "react-router-dom";
import SidebarProfile from "./SidebarProfile";
import { MessageCircle, Search, Settings, User, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from '@/services/axios';
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const Sidebar = ({ render, isCollapsed, setIsCollapsed }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/messages")) {
      setIsCollapsed(true);
    }
    else if (window.innerWidth >= 768) {
      setIsCollapsed(false);
    }
  }, [location.pathname, setIsCollapsed]);

  const menuItems = [
    {
      name: "Discover",
      path: "/recommendations",
      icon: <Search size={22} />,
      isActive: (pathname) => pathname === "/recommendations" || (pathname.startsWith("/profile/") && pathname !== "/profile")
    },
    {
      name: "Messages",
      path: "/messages",
      icon: <MessageCircle size={22} />,
      isActive: (pathname) => pathname.startsWith("/messages")
    },
    {
      name: "My Profile",
      path: "/profile",
      icon: <User size={22} />,
      isActive: (pathname) => pathname === "/profile"
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings size={22} />,
      isActive: (pathname) => pathname.startsWith("/settings")
    },
  ];

  const handleLogout = async () => {
    setIsExiting(true);
    await logout();
    navigate("/");
  };

  useEffect(() => {
    if (render && !profile) {
      const loadData = async () => {
        try {
          const response = await api.get("user/profile/");
          setProfile(response.data);
        } catch (error) {
          console.error("Failed to load profile data", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [render, profile]);

  if (render === false || isExiting) return null;

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          width: isCollapsed
            ? (window.innerWidth < 768 ? 0 : 80)
            : 280,
          x: isCollapsed && window.innerWidth < 768 ? -20 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        className={cn(
          "h-[100dvh] fixed top-0 left-0 z-50 bg-card border-r border-border flex flex-col shadow-xl overflow-hidden",
          "max-md:bg-card/98 max-md:backdrop-blur-xl"
        )}
      >
        <div className="flex items-center h-[65px] px-4 shrink-0 relative overflow-hidden">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-6 text-2xl font-bold bg-linear-to-bl dark:from-red-600 dark:to-chart-1 from-pink-400 to-gray-400 bg-clip-text text-transparent"
              >
                Spark
              </motion.span>
            )}
          </AnimatePresence>

          <div className={cn("transition-all duration-300 flex items-center", isCollapsed ? "mx-auto" : "ml-auto")}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-9 w-9 shrink-0 active:scale-90 transition-transform"
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </Button>
          </div>
        </div>

        <SidebarProfile
          name={`${profile?.first_name || ''} ${profile?.surname || ''}`.trim()}
          avatar={profile?.avatar}
          gender={profile?.gender}
          looking_for={profile?.looking_for}
          isCollapsed={isCollapsed}
          isLoading={isLoading}
        />

        <div className="flex-1 py-4 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden scrollbar-none">
          {menuItems.map((item) => {
            const active = item.isActive(location.pathname);

            return (
              <Link
                to={item.path}
                key={item.path}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center h-12 rounded-xl text-sm font-medium transition-colors group relative shrink-0",
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <div className="min-w-[56px] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>

                <motion.span
                  animate={{
                    opacity: isCollapsed ? 0 : 1,
                    x: isCollapsed ? -10 : 0
                  }}
                  transition={{ duration: 0.2 }}
                  className="truncate"
                >
                  {item.name}
                </motion.span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border mt-auto shrink-0 pb-safe flex flex-col gap-2">
          <ThemeToggle isCollapsed={isCollapsed} />
          <button
            onClick={handleLogout}
            className="flex items-center h-12 w-full text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl transition-colors cursor-pointer overflow-hidden"
          >
            <div className="min-w-[48px] flex items-center justify-center shrink-0">
              <LogOut size={20} />
            </div>
            <motion.span
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            >
              Log out
            </motion.span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;