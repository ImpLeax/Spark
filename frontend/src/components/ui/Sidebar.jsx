import { Link, useNavigate, useLocation } from "react-router-dom";
import SidebarProfile from "./SidebarProfile";
import { MessageCircle, Search, Settings, User, LogOut, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from '@/services/axios';
import { useEffect, useState, useRef } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { usePresence } from "@/context/PresenceContext";
import { useTranslation } from "react-i18next";

const SidebarLangSwitcher = ({ isCollapsed }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const langMenuRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'uk', label: 'Українська', short: 'UK' },
    { code: 'ga', label: 'Галицька', short: 'GA' },
    { code: 'de', label: 'Deutsch', short: 'DE' },
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'es', label: 'Español', short: 'ES' },
    { code: 'ja', label: '日本語', short: 'JA' },
    { code: 'cz', label: 'Čeština', short: 'CZ' }
  ];

  useEffect(() => {
    if (isCollapsed) setIsOpen(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  const handleMainClick = () => {
    if (isCollapsed) {
      const currentIndex = languages.findIndex(l => i18n.language?.startsWith(l.code));
      const nextLang = languages[(currentIndex + 1) % languages.length];
      changeLang(nextLang.code);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const currentLang = languages.find(l => i18n.language?.startsWith(l.code)) || languages[0];

  return (
    <div className="relative flex flex-col w-full" ref={langMenuRef}>
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="absolute bottom-full left-0 w-full mb-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 flex flex-col p-1"
          >
            {languages.map((lang) => {
              const isActive = i18n.language?.startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang.code)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between rounded-lg",
                    isActive
                      ? "text-primary font-bold bg-primary/5"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {lang.label}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleMainClick}
        className="flex items-center h-12 w-full text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl transition-colors cursor-pointer overflow-hidden relative"
      >
        <div className="min-w-[48px] flex items-center justify-center shrink-0">
          <Globe size={20} />
        </div>
        <motion.div
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 items-center justify-between pr-4 whitespace-nowrap"
        >
          <span>{currentLang.label}</span>
          <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-md uppercase text-foreground">
            {currentLang.short}
          </span>
        </motion.div>
      </button>
    </div>
  );
};

const Sidebar = ({ render, isCollapsed, setIsCollapsed }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const { likesCount, unreadMessagesCount } = usePresence();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (location.pathname.startsWith("/messages")) {
      setIsCollapsed(true);
    }
    else if (window.innerWidth >= 768) {
      setIsCollapsed(false);
    }
  }, [location.pathname, setIsCollapsed]);

  const formatBadgeCount = (count) => {
    if (!count || count <= 0) return null;
    return count > 9999 ? "9999+" : count;
  };

  const menuItems = [
    {
      name: t('sidebar.discover', "Discover"),
      path: "/recommendations",
      icon: <Search size={22} />,
      isActive: (pathname) => pathname === "/recommendations" || (pathname.startsWith("/profile/") && pathname !== "/profile"),
      badge: formatBadgeCount(likesCount)
    },
    {
      name: t('sidebar.messages', "Messages"),
      path: "/messages",
      icon: <MessageCircle size={22} />,
      isActive: (pathname) => pathname.startsWith("/messages"),
      badge: formatBadgeCount(unreadMessagesCount)
    },
    {
      name: t('sidebar.my_profile', "My Profile"),
      path: "/profile",
      icon: <User size={22} />,
      isActive: (pathname) => pathname === "/profile"
    },
    {
      name: t('sidebar.settings', "Settings"),
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
          const data = response.data;

          if (data.avatar) {
            data.avatar = `${data.avatar}?t=${new Date().getTime()}`;
          }

          setProfile(data);
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
          width: isCollapsed ? (window.innerWidth < 768 ? 0 : 80) : 280,
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
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-6 flex items-center gap-2"
              >
                <img src="/spark.png" alt="Spark logo" className="w-6 h-6" />

                <span className="text-2xl font-bold bg-gradient-to-bl dark:from-red-600 dark:to-chart-1 from-pink-400 to-gray-400 bg-clip-text text-transparent">
                  Spark
                </span>
              </motion.div>
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
                  className="flex-1 truncate pr-10"
                >
                  {item.name}
                </motion.span>

                {!isCollapsed && item.badge && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm"
                    >
                        {item.badge}
                    </motion.div>
                )}

                {isCollapsed && item.badge && (
                    <div className="absolute top-2 right-3 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border mt-auto shrink-0 pb-safe flex flex-col gap-2">

          <SidebarLangSwitcher isCollapsed={isCollapsed} />

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
              className="whitespace-nowrap"
            >
              {t('sidebar.logout', "Log out")}
            </motion.span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;