import { NavLink } from "react-router-dom";
import SidebarProfile from "./SidebarProfile";
import { Home, MessageCircle, Search, Settings, User } from "lucide-react";
import { motion } from "framer-motion";
import api from '@/services/axios';
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/index";

const Sidebar = ({ isOpen, render}) => {
  const menuItems = [
    { name: "Main", path: "/", icon: <Home size={20} /> },
    { name: "Search", path: "/search", icon: <Search size={20} /> },
    { name: "Messages", path: "/messages", icon: <MessageCircle size={20} /> },
    { name: "Profile", path: "/profile", icon: <User size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  const [profile, setProfile] = useState(null);
  const [isLoading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get("user/profile/");
      setProfile(response.data);
    } catch (error) {
      console.error("Не вдалося завантажити профіль", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen]);

  if (render === false) {
    return <></>;
  }

  return (
    <motion.div
      initial={false}
      animate={{ x: isOpen ? 0 : "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 50 }}
      className="h-[calc(100vh-65px)] w-1/6 fixed z-50 bg-sidebar backdrop-blur-md flex flex-col border-border min-w-55"
    >
      {isLoading ? (
        <>
          <div className="flex gap-4 flex-col p-4 overflow-auto">
            <div className="flex flex-row p-3 gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-59 py-5" />
            </div>
            {menuItems.map((_, index) => (
              <Skeleton key={index} className="h-20 w-71" />
            ))}
          </div>
          <div className="mt-auto p-3 border-t">
            <Skeleton className="h-20 w-73" />
          </div>
        </>
      ) : (
        <>
          <SidebarProfile
            name={profile?.first_name + " " + profile?.surname || "Guest"}
            avatar={profile?.avatar}
            gender={profile?.gender || "N/A"}
            lookingFor={profile?.looking_for || "N/A"}
          />

          <div className="flex gap-4 flex-col p-3 overflow-auto ">
            {menuItems.map((item) => (
              <NavLink to={item.path} key={item.path}>
                <div className="flex flex-row border-2 p-3 rounded-md text-muted-foreground dark:text-white">
                  {item.icon}
                  <span className="w-1" />
                  {item.name}
                </div>
              </NavLink>
            ))}
          </div>

          <div className="mt-auto p-3 border-t">
            <NavLink
              to="/logout"
              className="flex items-center gap-3 p-2 hover:bg-red-50 dark:hover:bg-primary dark:hover:text-black text-red-600 rounded-md"
            >
              <span>Вийти</span>
            </NavLink>
          </div>
        </>
      )}
    </motion.div>
  );
};
export default Sidebar;