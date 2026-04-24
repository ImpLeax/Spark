import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  User,
  Heart,
  Briefcase,
  GraduationCap,
  Ruler,
  Calendar,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Weight
} from "lucide-react";
import api from "@/services/axios";
import { calculateAge, parseLocation } from "@/lib/utils";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/Card.jsx";
import { useTranslation } from "react-i18next";

const intentionKeyMap = {
  "Still figuring it out": "still_figuring",
  "Casual dating": "casual_dating",
  "New friends": "new_friends",
  "Short-term dating": "short_term",
  "Long-term relationship": "long_term"
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [locationData, setLocationData] = useState({ status: "loading", city: null });

  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, galleryRes] = await Promise.all([
          api.get("user/profile/"),
          api.get("user/profile/gallery/")
        ]);
        setProfile(profileRes.data);
        setGallery(galleryRes.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  useEffect(() => {
    const getCity = async () => {
      const coords = parseLocation(profile?.location);
      if (!coords) {
        setLocationData({ status: "hidden", city: null });
        return;
      }

      try {
        const currentLang = i18n.language?.substring(0, 2) || "en";

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&accept-language=${currentLang}`
        );
        const data = await response.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.state;

        if (city) {
          setLocationData({ status: "success", city });
        } else {
          setLocationData({ status: "unknown", city: null });
        }
      } catch (error) {
        setLocationData({ status: "unavailable", city: null });
      }
    };

    if (profile?.location) {
      getCity();
    } else if (profile && !profile.location) {
      setLocationData({ status: "hidden", city: null });
    }
  }, [profile, i18n.language]);

  const nextPhoto = () => setActivePhotoIndex((prev) => (prev + 1) % gallery.length);
  const prevPhoto = () => setActivePhotoIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  const getDisplayLocation = () => {
    switch (locationData.status) {
      case "loading": return t('profile_page.location.loading');
      case "hidden": return t('profile_page.location.hidden');
      case "unknown": return t('profile_page.location.unknown');
      case "unavailable": return t('profile_page.location.unavailable');
      case "success": return locationData.city;
      default: return "";
    }
  };

  if (loading) return <ProfileSkeleton />;

  const age = calculateAge(profile?.additional_info?.birth_date);

  const translatedLookingFor = profile?.looking_for
    ? t(`genders.${profile.looking_for.toLowerCase()}`)
    : t('profile_page.anyone');

  const translatedIntention = profile?.intention?.name
    ? t(`intentions.${intentionKeyMap[profile.intention.name] || profile.intention.name.toLowerCase()}`)
    : '';

  const showForText = profile?.intention?.name && profile.intention.name !== "Still figuring it out";

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
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">{t('profile_page.no_photos')}</div>
              )}
            </div>

            <Button className="w-full h-12 md:h-14 rounded-2xl text-base md:text-lg font-bold shadow-sm" variant="outline" onClick={() => window.location.href = '/settings'}>
              <Settings2 className="mr-2 h-5 w-5" /> {t('profile_page.edit_profile')}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8 md:space-y-10">

          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                {profile?.first_name}, <span className="text-muted-foreground font-medium">{age}</span>
              </h1>
              {profile?.gender && (
                <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1 capitalize bg-primary/10 text-primary border-none font-bold">
                  {t(`genders.${profile.gender.toLowerCase()}`)}
                </Badge>
              )}
            </div>
            <div className="flex items-center text-muted-foreground text-base sm:text-lg font-medium">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              <span>{getDisplayLocation()}</span>
            </div>
          </div>

          <div className="h-px bg-border w-full" />

          <section className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> {t('profile_page.about_me')}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
              {profile?.additional_info?.bio || t('profile_page.no_bio')}
            </p>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <InfoCard
              icon={<Heart />}
              label={t('profile_page.labels.intention')}
              value={translatedIntention}
            />
            <InfoCard
              icon={<Ruler />}
              label={t('profile_page.labels.height')}
              value={profile?.additional_info?.height ? `${profile.additional_info.height} ${t('profile_page.units.cm')}` : null}
            />
            <InfoCard
              icon={<Weight />}
              label={t('profile_page.labels.weight')}
              value={profile?.additional_info?.weight ? `${profile.additional_info.weight} ${t('profile_page.units.kg')}` : null}
            />
            <InfoCard
              icon={<GraduationCap />}
              label={t('profile_page.labels.education')}
              value={profile?.additional_info?.education}
            />
            <InfoCard
              icon={<Calendar />}
              label={t('profile_page.labels.joined')}
              value={t('profile_page.joined_date')}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold">{t('profile_page.interests_title')}</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.interests?.map((interest) => (
                <Badge key={interest.id} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold bg-secondary/80 text-foreground border-none">
                  {t(`interests.${interest.name.toLowerCase()}`)}
                </Badge>
              ))}
            </div>
          </section>

          <Card className="p-5 sm:p-6 bg-gradient-to-br from-primary/5 to-secondary/30 border-dashed border-2 rounded-[1.5rem] sm:rounded-[2rem]">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-base sm:text-lg">{t('profile_page.looking_for_title')}</h4>
                <p className="text-muted-foreground text-sm sm:text-base capitalize truncate">
                  {translatedLookingFor} {showForText ? `${t('profile_page.for')} ${translatedIntention.toLowerCase()}` : ""}
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>
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

export default ProfilePage;