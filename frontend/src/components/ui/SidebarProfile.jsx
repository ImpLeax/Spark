import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function SidebarProfile({ name, avatar, gender, looking_for, isCollapsed, isLoading }) {
  const { t } = useTranslation();

  const initials = name && name !== "" ? name.split(" ").map(n => n[0]).join("").toUpperCase() : t('sidebar_profile.na');

  if (isLoading) {
    return (
      <div className="px-4 py-4 h-24 flex items-center">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      </div>
    );
  }

  return (
    <div className={cn(
      "h-24 transition-all duration-300 flex items-center shrink-0 overflow-hidden mx-3",
      !isCollapsed ? "bg-muted/30 rounded-2xl border border-border/50 px-3" : "bg-transparent border-transparent px-0"
    )}>
      <div className="flex items-center w-full">

        <div className="min-w-[56px] flex items-center justify-center shrink-0">
          <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm shrink-0">
            <AvatarImage src={avatar} alt={name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col ml-1 overflow-hidden whitespace-nowrap"
            >
              <span className="font-bold text-foreground text-sm truncate">
                {name || t('sidebar_profile.user')}
              </span>
              <div className="flex flex-col text-[10px] text-muted-foreground mt-0.5">
                <span className="truncate">
                  {t('sidebar_profile.gender')}: {gender ? t(`genders.${gender}`) : t('sidebar_profile.not_available')}
                </span>
                <span className="truncate">
                  {t('sidebar_profile.seeking')}: {looking_for ? t(`genders.${looking_for}`) : t('sidebar_profile.not_available')}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SidebarProfile;