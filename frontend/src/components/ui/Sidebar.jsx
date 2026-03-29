import { NavLink } from "react-router-dom";
import SidebarProfile from "./SidebarProfile";
import { Home, MessageCircle, Search, Settings, User } from "lucide-react";
import {motion} from "framer-motion";

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { name: "Головна", path: "/", icon: <Home size={20} /> },
    { name: "Пошук", path: "/search", icon: <Search size={20} /> },
    { name: "Повідомлення", path: "/messages", icon: <MessageCircle size={20} /> },
    { name: "Профіль", path: "/profile", icon: <User size={20} /> },
    { name: "Налаштування", path: "/settings", icon: <Settings size={20} /> },
  ];

  return(
    <motion.div initial={false} animate={{ x: isOpen ? 0 : "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 50 }} className="h-[calc(100vh-65px)] w-1/6 fixed z-50 bg-sidebar backdrop-blur-md flex flex-col border-border min-w-55">
            <SidebarProfile/>
        <div className="flex gap-4 flex-col p-3 overflow-auto ">
            {menuItems.map((item) =>
            <NavLink to={item.path} key={item.path}><div className="flex flex-row border-2 p-3 rounded-md text-muted-foreground dark:text-white">{item.icon}<span className="w-1"/>{item.name}</div></NavLink>)}
        </div>
            <div className="mt-auto p-3 border-t">
                <NavLink to="/logout" className="flex items-center gap-3 p-2 hover:bg-red-50 dark:hover:bg-primary dark:hover:text-black text-red-600 rounded-md">
                    <span>Вийти</span>
                </NavLink>
        </div>
    </motion.div>
  );
}
export default Sidebar;