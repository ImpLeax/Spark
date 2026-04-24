import React from 'react';
import { Compass, Heart } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function FeedToggle({ isLikesView, setIsLikesView, likesBadge }) {
  const { t } = useTranslation();

  return (
    <div className="relative flex items-center p-1 bg-secondary/50 backdrop-blur-md rounded-full w-72 mx-auto border border-border shadow-inner">
      <div
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-full shadow-md transition-all duration-300 ease-out",
          isLikesView ? "left-[calc(50%+2px)]" : "left-1"
        )}
      />

      <button
        onClick={() => setIsLikesView(false)}
        className={cn(
          "relative flex-1 flex items-center justify-center gap-2 h-10 text-sm font-bold transition-colors z-10",
          !isLikesView ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Compass size={18} />
        {t('feed_toggle.discover')}
      </button>

      <button
        onClick={() => setIsLikesView(true)}
        className={cn(
          "relative flex-1 flex items-center justify-center gap-2 h-10 text-sm font-bold transition-colors z-10",
          isLikesView ? "text-pink-500" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Heart size={18} />
        {t('feed_toggle.likes')}

        {likesBadge > 0 && (
          <span className="absolute top-1 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300">
            {likesBadge}
          </span>
        )}
      </button>
    </div>
  );
}