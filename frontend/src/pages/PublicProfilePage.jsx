import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  User,
  Heart,
  Briefcase,
  GraduationCap,
  Ruler,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Weight,
  MessageCircle,
  Loader2
} from "lucide-react";
import api from "@/services/axios";
import { calculateAge, parseLocation, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/Card.jsx";

const playMatchSound = () => {
  const audio = new Audio('/sounds/match.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio play blocked by browser:', e));
};

const PublicProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [cityName, setCityName] = useState("Loading location...");

  const [isLiking, setIsLiking] = useState(false);
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, galleryRes, currentUserRes] = await Promise.all([
          api.get(`user/profile/${userId}/`),
          api.get(`user/profile/${userId}/gallery/`).catch(() => ({ data: [] })),
          api.get("user/profile/").catch(() => ({ data: null }))
        ]);

        setProfile(profileRes.data);
        setGallery(galleryRes.data);
        setCurrentUser(currentUserRes.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        navigate("/recommendations");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId, navigate]);

  useEffect(() => {
    const getCity = async () => {
      const coords = parseLocation(profile?.location);
      if (!coords) {
        setCityName("Location hidden");
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&accept-language=en`
        );
        const data = await response.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.state;
        setCityName(city || "Unknown Location");
      } catch (error) {
        setCityName("Location unavailable");
      }
    };

    if (profile?.location) {
      getCity();
    }
  }, [profile]);

  const nextPhoto = () => setActivePhotoIndex((prev) => (prev + 1) % gallery.length);
  const prevPhoto = () => setActivePhotoIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  const handleLike = async () => {
    if (profile?.is_liked || isLiking) return;

    setIsLiking(true);
    try {
      const response = await api.post("recommendation/swipe/", {
        receiver: userId,
        is_like: true
      });

      setProfile(prev => ({ ...prev, is_liked: true }));

      if (response.data.is_match) {
        setMatchData(profile);
        playMatchSound();
      }
    } catch (error) {
      console.error("Failed to like user", error);
    } finally {
      setIsLiking(false);
    }
  };

  const checkCompatibility = () => {
    if (!profile || !currentUser) return true;

    const targetLookingFor = profile.looking_for?.toLowerCase();
    const myGender = currentUser.gender?.toLowerCase();
    const myLookingFor = currentUser.looking_for?.toLowerCase();
    const targetGender = profile.gender?.toLowerCase();

    const targetAcceptsMe = !targetLookingFor || targetLookingFor === "anyone" || targetLookingFor === myGender;

    const iAcceptTarget = !myLookingFor || myLookingFor === "anyone" || myLookingFor === targetGender;

    return targetAcceptsMe && iAcceptTarget;
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Profile not found.</div>;

  const age = calculateAge(profile?.additional_info?.birth_date);
  const isCompatible = checkCompatibility();

  return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-6xl lg:mx-auto px-4 py-6 md:px-8 md:py-10 pt-10 md:pt-10"
      >
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12">

        <div className="lg:col-span-5 w-full">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-xl border border-border bg-muted group">
              {gallery.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activePhotoIndex}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      src={gallery[activePhotoIndex]?.photo}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  </AnimatePresence>

                  {gallery.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 h-10 w-10 sm:h-12 sm:w-12" onClick={prevPhoto}>
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 h-10 w-10 sm:h-12 sm:w-12" onClick={nextPhoto}>
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {gallery.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all ${i === activePhotoIndex ? "w-6 bg-white" : "w-2 bg-white/40"}`} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No photos</div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 h-12 md:h-14 rounded-2xl text-base md:text-lg font-bold shadow-sm"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="mr-2 h-5 w-5" /> Back
              </Button>

              <Button
                className={cn(
                  "flex-1 h-12 md:h-14 rounded-2xl text-base md:text-lg font-bold shadow-sm transition-all",
                  profile?.is_liked
                    ? "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30 border-0"
                    : !isCompatible
                      ? "bg-muted text-muted-foreground border-0"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={handleLike}
                disabled={profile?.is_liked || isLiking || !isCompatible}
              >
                {isLiking ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Heart className={cn("mr-2 h-5 w-5", profile?.is_liked ? "fill-current" : "")} />
                )}
                {profile?.is_liked ? "Liked" : (!isCompatible ? "Incompatible" : "Like")}
              </Button>

            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8 md:space-y-10">

          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                {profile?.first_name}, <span className="text-muted-foreground font-medium">{age}</span>
              </h1>
              <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1 capitalize bg-primary/10 text-primary border-none font-bold">
                {profile?.gender}
              </Badge>
            </div>
            <div className="flex items-center text-muted-foreground text-base sm:text-lg font-medium">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              <span>{cityName}</span>
            </div>
          </div>

          <div className="h-px bg-border w-full" />

          <section className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> About
            </h3>
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
              {profile?.additional_info?.bio || "This user hasn't written a bio yet."}
            </p>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <InfoCard icon={<Heart />} label="Intention" value={profile?.intention?.name} />
            <InfoCard icon={<Ruler />} label="Height" value={profile?.additional_info?.height ? `${profile.additional_info.height} cm` : null} />
            <InfoCard icon={<Weight />} label="Weight" value={profile?.additional_info?.weight ? `${profile.additional_info.weight} kg` : null} />
            <InfoCard icon={<GraduationCap />} label="Education" value={profile?.additional_info?.education} />
            <InfoCard icon={<Calendar />} label="Joined" value="April 2026" />
          </section>

          {profile?.interests?.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.interests?.map((interest) => (
                  <Badge key={interest.id} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-secondary/80 text-foreground border-none">
                    {interest.name}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <Card className="p-5 sm:p-6 bg-linear-to-br from-primary/5 to-secondary/30 border-dashed border-2 rounded-[1.5rem] sm:rounded-[2rem]">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-base sm:text-lg">Looking for</h4>
                <p className="text-muted-foreground text-sm sm:text-base capitalize truncate">
                  {profile?.looking_for || "Anyone"} {profile?.intention?.name?.toLowerCase() === "still figuring it out." ? "" : `for ${profile?.intention?.name?.toLowerCase()}`}
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>

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
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

const InfoCard = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex items-center gap-4 hover:bg-muted/40 transition-colors">
      <div className="text-primary shrink-0">{React.cloneElement(icon, { size: 20 })}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/70">{label}</p>
        <p className="font-bold text-sm sm:text-base truncate text-foreground">{value}</p>
      </div>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-8">
    <div className="lg:col-span-5">
      <Skeleton className="aspect-[3/4] rounded-[2.5rem] w-full" />
    </div>
    <div className="lg:col-span-7 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    </div>
  </div>
);

export default PublicProfilePage;