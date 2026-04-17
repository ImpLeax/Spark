import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Info, MapPin, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedToggle } from "@/components/ui/FeedToggle";
import { cn } from "@/lib/utils";

// --- КОМПОНЕНТ КАРТКИ З ГАЛЕРЕЄЮ ---
const ProfileCard = ({ profile, isTop, exitX, zIndex, onNavigate }) => {
  const [gallery, setGallery] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Завантажуємо галерею саме для цього профілю
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await api.get(`user/profile/${profile.user_id}/gallery/`);
        setGallery(res.data);
      } catch (error) {
        console.error("Failed to load gallery for", profile.user_id);
      }
    };
    fetchGallery();
  }, [profile.user_id]);

  // Навігація між фотографіями
  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex < gallery.length - 1) setPhotoIndex(prev => prev + 1);
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex > 0) setPhotoIndex(prev => prev - 1);
  };

  // Визначаємо поточне фото (якщо галерея ще вантажиться або порожня, показуємо аватар)
  const currentPhoto = gallery.length > 0 ? gallery[photoIndex]?.photo : profile.avatar;

  return (
    <motion.div
      initial={{ scale: 0.95, y: 20, opacity: 0 }}
      animate={{
        scale: isTop ? 1 : 0.95,
        y: isTop ? 0 : 20,
        opacity: 1,
        zIndex: zIndex
      }}
      exit={{
        x: exitX,
        opacity: 0,
        rotate: exitX * 0.05,
        transition: { duration: 0.2 }
      }}
      className="absolute inset-0 w-full h-full rounded-[2rem] bg-card border border-border shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="relative flex-1 bg-muted">
        {/* Індикатори фотографій (Tinder-style bars) */}
        {gallery.length > 1 && (
          <div className="absolute top-3 inset-x-0 flex gap-1 px-3 z-20">
            {gallery.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full bg-white/50 backdrop-blur-sm transition-all",
                  i === photoIndex ? "bg-white shadow-sm" : "bg-white/30"
                )}
              />
            ))}
          </div>
        )}

        {/* Зображення */}
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt={profile.first_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50">
            <span className="text-muted-foreground">No Photo</span>
          </div>
        )}

        {/* Градієнт знизу для читабельності тексту */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Невидимі зони для кліку (ліворуч/праворуч) */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/2 h-full cursor-pointer" onClick={handlePrevPhoto} />
          <div className="w-1/2 h-full cursor-pointer" onClick={handleNextPhoto} />
        </div>

        {/* Тег дистанції */}
        {profile.distance_km !== undefined && (
          <div className="absolute top-6 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md text-white rounded-full text-xs font-bold flex items-center gap-1.5 z-20 pointer-events-none">
            <MapPin size={14} /> {profile.distance_km} km away
          </div>
        )}

        {/* Відсоток збігу */}
        {profile.shared_interests_score !== undefined && (
          <div className="absolute top-6 right-4 px-3 py-1.5 bg-primary/90 backdrop-blur-md text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg z-20 pointer-events-none">
            <Sparkles size={14} /> {profile.shared_interests_score}% Match
          </div>
        )}
      </div>

      {/* Інформація під фото */}
      <div className="absolute bottom-0 w-full p-6 text-white space-y-3 z-30 pointer-events-none">
        <div className="flex items-end justify-between pointer-events-auto">
          <div>
            <h2 className="text-3xl font-black drop-shadow-md">
              {profile.first_name}, {profile.age}
            </h2>
            <p className="text-white/80 font-medium text-sm mt-1 drop-shadow-md line-clamp-2">
              {profile.bio || "No bio available."}
            </p>
          </div>

          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md border-0 shrink-0 h-10 w-10 cursor-pointer"
            onClick={() => onNavigate(profile.user_id)}
          >
            <Info size={20} />
          </Button>
        </div>

        {profile.intention && (
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm pointer-events-auto">
            Looking for: {profile.intention}
          </Badge>
        )}
      </div>
    </motion.div>
  );
};

// --- ГОЛОВНА СТОРІНКА ---
const RecommendationsPage = () => {
  const [isLikesView, setIsLikesView] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [exitX, setExitX] = useState(0);
  const [matchData, setMatchData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const endpoint = isLikesView ? "recommendation/like/received/" : "recommendation/list/";
        const response = await api.get(endpoint);

        const data = response.data.results || response.data;
        setProfiles(data);
      } catch (error) {
        console.error("Failed to load profiles", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [isLikesView]);

  const handleSwipe = async (isLike) => {
    if (profiles.length === 0) return;

    setExitX(isLike ? 200 : -200);
    const currentProfile = profiles[0];

    try {
      const response = await api.post("recommendation/swipe/", {
        receiver: currentProfile.user_id,
        is_like: isLike
      });

      if (isLike && response.data.is_match) {
        setMatchData(currentProfile);
      }

    } catch (error) {
      console.error("Swipe failed", error);
    }

    setTimeout(() => {
      setProfiles(prev => prev.slice(1));
      setExitX(0);
    }, 200);
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-65px)] md:min-h-screen bg-muted/20 relative overflow-hidden">

      <div className="pt-6 pb-4 px-4 shrink-0 relative z-10 flex flex-col items-center gap-4">
        <FeedToggle isLikesView={isLikesView} setIsLikesView={setIsLikesView} />

        <p className="text-sm text-muted-foreground font-medium">
          {isLikesView
            ? "People who already liked you"
            : "Discover new people around you"}
        </p>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4">
        {isLoading ? (
          <div className="flex flex-col items-center text-muted-foreground gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-medium">Finding the best sparks for you...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">No profiles left</h3>
            <p className="text-muted-foreground">
              {isLikesView
                ? "You haven't received any new likes yet. Keep swiping!"
                : "You've seen everyone nearby. Try adjusting your search settings or check back later."}
            </p>
          </div>
        ) : (
          <div className="relative w-full max-w-md aspect-[3/4] sm:aspect-[4/5] mx-auto">
            <AnimatePresence>
              {profiles.map((profile, index) => {
                if (index > 1) return null;
                const isTop = index === 0;

                return (
                  <ProfileCard
                    key={profile.user_id}
                    profile={profile}
                    isTop={isTop}
                    exitX={exitX}
                    zIndex={profiles.length - index}
                    onNavigate={(id) => navigate(`/profile/${id}`)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!isLoading && profiles.length > 0 && (
        <div className="pb-8 pt-4 px-4 shrink-0 flex items-center justify-center gap-6 z-10 relative">
          <Button
            onClick={() => handleSwipe(false)}
            variant="outline"
            className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all shadow-lg active:scale-90"
          >
            <X size={28} strokeWidth={3} />
          </Button>

          <Button
            onClick={() => handleSwipe(true)}
            className="w-20 h-20 rounded-full bg-linear-to-br from-pink-500 to-primary text-white shadow-[0_8px_30px_rgb(236,72,153,0.3)] hover:shadow-[0_8px_30px_rgb(236,72,153,0.5)] transition-all active:scale-90 border-0"
          >
            <Heart size={36} fill="currentColor" />
          </Button>
        </div>
      )}

      <AnimatePresence>
        {matchData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center space-y-8 max-w-sm w-full"
            >
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 animate-pulse">
                  It's a Match!
                </h2>
                <p className="text-lg text-white/70">You and {matchData.first_name} liked each other.</p>
              </div>

              <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping opacity-20" />
                <img
                  src={matchData.avatar || 'https://via.placeholder.com/150'}
                  alt={matchData.first_name}
                  className="w-full h-full rounded-full object-cover border-4 border-pink-500 relative z-10"
                />
              </div>

              <div className="space-y-4 pt-8">
                <Button
                  onClick={() => {
                    setMatchData(null);
                    navigate('/messages');
                  }}
                  className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 text-lg font-bold"
                >
                  <MessageCircle className="mr-2 h-5 w-5" /> Say Hello
                </Button>

                <Button
                  onClick={() => setMatchData(null)}
                  variant="ghost"
                  className="w-full h-14 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 text-lg"
                >
                  Keep Swiping
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecommendationsPage;