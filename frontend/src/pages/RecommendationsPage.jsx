import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Info, MapPin, Sparkles, MessageCircle, User, Sliders } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedToggle } from "@/components/ui/FeedToggle";
import { cn } from "@/lib/utils";
import { usePresence } from "@/context/PresenceContext";

const playMatchSound = () => {
  const audio = new Audio('/sounds/match.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio play blocked by browser:', e));
};

const CardSkeleton = () => (
  <div className="absolute inset-0 w-full h-full rounded-[2rem] bg-card border border-border shadow-2xl overflow-hidden flex flex-col animate-pulse">
    <div className="relative flex-1 bg-muted/50 flex items-center justify-center">
      <User size={80} className="text-muted/30" />
    </div>
    <div className="absolute bottom-0 w-full p-6 space-y-4 bg-gradient-to-t from-background to-transparent">
      <div className="h-10 bg-muted/80 rounded-lg w-2/3" />
      <div className="h-4 bg-muted/80 rounded-md w-full" />
      <div className="h-4 bg-muted/80 rounded-md w-4/5" />
      <div className="h-6 bg-muted/80 rounded-full w-1/3 mt-2" />
    </div>
  </div>
);

const SwipeFeedback = ({ type }) => {
  if (!type) return null;

  const isLike = type === 'like';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: isLike ? -50 : 50, rotate: isLike ? -20 : 20 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1.5], x: isLike ? 50 : -50, rotate: isLike ? 10 : -10 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "absolute inset-0 z-50 pointer-events-none flex items-center justify-center",
        isLike ? "text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]" : "text-destructive drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
      )}
    >
      {isLike ? (
        <Heart size={140} fill="currentColor" />
      ) : (
        <X size={140} strokeWidth={4} />
      )}
    </motion.div>
  );
};

const ProfileCard = ({ profile, isTop, exitX, zIndex, onNavigate }) => {
  const [gallery, setGallery] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

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

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex < gallery.length - 1) setPhotoIndex(prev => prev + 1);
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex > 0) setPhotoIndex(prev => prev - 1);
  };

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
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="absolute inset-0 w-full h-full rounded-[2rem] bg-card border border-border shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="relative flex-1 bg-muted">
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

        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt={profile.first_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50 text-muted-foreground">
            <User size={64} className="mb-4 opacity-50" />
            <span className="font-medium">No Photo</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        <div className="absolute inset-0 flex z-10">
          <div className="w-1/2 h-full cursor-pointer" onClick={handlePrevPhoto} />
          <div className="w-1/2 h-full cursor-pointer" onClick={handleNextPhoto} />
        </div>

        {profile.distance_km !== undefined && profile.distance_km !== null && (
          <div className="absolute top-6 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md text-white rounded-full text-xs font-bold flex items-center gap-1.5 z-20 pointer-events-none">
            <MapPin size={14} /> {profile.distance_km} km away
          </div>
        )}

        {profile.shared_interests_score !== undefined && (
          <div className="absolute top-6 right-4 px-3 py-1.5 bg-primary/90 backdrop-blur-md text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg z-20 pointer-events-none">
            <Sparkles size={14} /> {profile.shared_interests_score}% Match
          </div>
        )}
      </div>

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

const RecommendationsPage = () => {
  const [isLikesView, setIsLikesView] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [maxDistance, setMaxDistance] = useState(null);

  const [exitX, setExitX] = useState(0);
  const [swipeFeedback, setSwipeFeedback] = useState(null);
  const [matchData, setMatchData] = useState(null);

  const navigate = useNavigate();

  const { likesCount, clearLikesCount, muteNextNotification  } = usePresence();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("user/profile/settings/");
        setMaxDistance(res.data.search_distance);
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };
    fetchSettings();
  }, []);

  const fetchProfiles = async (isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const endpoint = isLikesView ? "recommendation/like/received/" : "recommendation/list/";
      const response = await api.get(endpoint);

      const data = response.data.results || response.data;

      if (isLoadMore) {
        setProfiles(prev => {
            const existingIds = new Set(prev.map(p => p.user_id));
            const newProfiles = data.filter(p => !existingIds.has(p.user_id));
            return [...prev, ...newProfiles];
        });
      } else {
        setProfiles(data);
      }

      if (isLikesView && !isLoadMore) {
          clearLikesCount();
      }
    } catch (error) {
      console.error("Failed to load profiles", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchProfiles(false);
  }, [isLikesView]);

  useEffect(() => {
      if (likesCount > 0 && isLikesView && !isLoading) {
          fetchProfiles(false);
      }
  }, [likesCount, isLikesView, isLoading]);

  const handleSwipe = async (isLike) => {
    if (profiles.length === 0) return;

    setExitX(isLike ? 200 : -200);
    setSwipeFeedback(isLike ? 'like' : 'pass');

    const currentProfile = profiles[0];

    if (isLike) {
        muteNextNotification();
    }

    try {
      const response = await api.post("recommendation/swipe/", {
        receiver: currentProfile.user_id,
        is_like: isLike
      });

      if (isLike && response.data.is_match) {
        setMatchData(currentProfile);
        playMatchSound();
      }

    } catch (error) {
      console.error("Swipe failed", error);
    }

    setTimeout(() => {
      setProfiles(prev => {
        const newProfiles = prev.slice(1);

        if (newProfiles.length <= 1 && !isFetchingMore) {
          fetchProfiles(true);
        }

        return newProfiles;
      });

      setExitX(0);
      setSwipeFeedback(null);
    }, 300);
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-65px)] md:min-h-screen bg-muted/20 relative overflow-hidden">

      <AnimatePresence>
        {swipeFeedback === 'like' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-green-500/20 to-transparent z-0 pointer-events-none"
          />
        )}
        {swipeFeedback === 'pass' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-red-500/20 to-transparent z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="pt-6 pb-4 px-4 shrink-0 relative z-10 flex flex-col items-center gap-4">
        <FeedToggle isLikesView={isLikesView} setIsLikesView={setIsLikesView} likesBadge={likesCount}/>

        <p className="text-sm text-muted-foreground font-medium">
          {isLikesView
            ? "People who already liked you"
            : "Discover new people around you"}
        </p>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4 z-10">
        <div className="relative w-full max-w-md aspect-[3/4] sm:aspect-[4/5] mx-auto flex items-center justify-center">

          <SwipeFeedback type={swipeFeedback} />

          {isLoading ? (
            <CardSkeleton />
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

              {!isLikesView && maxDistance !== null && maxDistance < 5000 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 p-5 bg-card/60 backdrop-blur-md rounded-2xl border border-border shadow-sm text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-full shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Want more matches?</h4>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Try expanding your search distance. You are currently looking within {maxDistance} km.
                      </p>
                      <Button
                        onClick={() => navigate('/settings')}
                        variant="default"
                        className="w-full rounded-xl shadow-sm"
                      >
                        <Sliders className="w-4 h-4 mr-2" /> Adjust Distance
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          ) : (
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
          )}
        </div>
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

                {matchData.avatar ? (
                  <img
                    src={matchData.avatar}
                    alt={matchData.first_name}
                    className="w-full h-full rounded-full object-cover border-4 border-pink-500 relative z-10 bg-card"
                  />
                ) : (
                  <div className="w-full h-full rounded-full border-4 border-pink-500 relative z-10 bg-secondary flex flex-col items-center justify-center text-muted-foreground shadow-inner">
                     <User size={64} />
                  </div>
                )}
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