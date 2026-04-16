import { use, useEffect, useState } from "react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import api from "@/services/axios";
import { Button } from "@/components/ui/button";
import { FancyToggle } from "@/components"; 
import { Heart, ThumbsDown, Flame, Sparkles } from 'lucide-react';

import { useTheme } from "@/components/theme-provider"; 

export default function MainContent() {
  const [recommendations, setRecommendations] = useState([]);
  const [page, setPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [carouselApi, setCarouselApi] = useState(null);
  const [current, setCurrent] = useState(1);
  
  const [isAnimating, setIsAnimating] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [dislikedIds, setDislikedIds] = useState(new Set());


  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const isLiked = recommendations[current - 1] ? likedIds.has(recommendations[current - 1].user_id) : false;
  const isDisliked = recommendations[current - 1] ? dislikedIds.has(recommendations[current - 1].user_id) : false;

  const [showLikedMe, setShowLikedMe] = useState(false);
  const [likedMeList, setLikedMeList] = useState([]);

  const handleLike = async () => {
    if (isAnimating === "like" || !carouselApi || isLiked) return;
    const currentUser = recommendations[current - 1];
    if (!currentUser) return;

    setIsAnimating("like");
    setLikedIds(prev => new Set(prev).add(currentUser.user_id));

    try {
      await api.post("recommendation/swipe/", {
        receiver: currentUser.user_id,
        is_like: true
      });
      setTimeout(() => {
        setIsAnimating(null);
        carouselApi.scrollNext();
      }, 400);
    } catch (error) {
      console.error("Помилка свайпу:", error);
      setIsAnimating(null);
      setLikedIds(prev => {
        const next = new Set(prev);
        next.delete(currentUser.user_id);
        return next;
      });
    }
  };

  const handleDislike = async () => {
    if (isAnimating || !carouselApi) return;
    const currentUser = recommendations[current - 1];
    if (!currentUser) return;

    setIsAnimating("dislike");
    setDislikedIds(prev => new Set(prev).add(currentUser.user_id));

    try {
      await api.post("recommendation/swipe/", {
        receiver: currentUser.user_id,
        is_like: false
      });
      setTimeout(() => {
        setIsAnimating(null);
        carouselApi.scrollNext();
      }, 400);
    } catch (error) {
      setDislikedIds(prev => {
        const next = new Set(prev);
        next.delete(currentUser.user_id);
        return next;
      });
      console.error("Помилка свайпу:", error);
      setIsAnimating(null);
    }
  };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        if (page === 1) setIsInitialLoading(true);
        else setIsFetchingMore(true);

        const response = await api.get(`recommendation/list/?page=${page}&size=5`);
        const newUsers = response.data.results || response.data;

        setRecommendations(prev => {
          const existingIds = new Set(prev.map(u => u.user_id));
          const uniqueNew = Array.isArray(newUsers) ? newUsers.filter(u => !existingIds.has(u.user_id)) : [];
          return [...prev, ...uniqueNew];
        });
      } catch (error) {
        console.error("Помилка API:", error);
      } finally {
        setIsInitialLoading(false);
        setIsFetchingMore(false);
      }
    };
    fetchFeed();
  }, [page]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      const index = carouselApi.selectedScrollSnap() + 1;
      setCurrent(index);
      if (index >= recommendations.length - 1 && !isFetchingMore) {
        setPage(prev => prev + 1);
      }
    };
    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);
    return () => carouselApi.off("select", onSelect);
  }, [carouselApi, recommendations.length, isFetchingMore]);

  useEffect(() => {
    const fetchLikedMe = async () => {
      try {
        const response = await api.get("http://127.0.0.1:8000/api/v1/like/received/");
        setLikedMeList(response.data);
      }catch (error) {
        console.error("Помилка при завантаженні 'Who liked me':", error);
      }
    };
    fetchLikedMe();
  }, [showLikedMe]);

  if (isInitialLoading) return <div className="h-screen flex items-center justify-center font-bold">Searching...</div>;
  if (recommendations.length === 0) return <div className="p-8 text-center text-gray-500">No new profiles found. Try later!</div>;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-700">
      
      <div className="flex flex-col items-center mb-6 z-10">
        <span className="text-xs font-bold uppercase tracking-widest mb-2 opacity-50">
          {showLikedMe ? "Who liked you" : "Discover"}
        </span>
        <div className="w-[160px]"> 
          <FancyToggle 
            isPicked={showLikedMe} 
            setIsPicked={setShowLikedMe} 
            OnIcon={Sparkles} 
            OffIcon={Flame}
            onColor="from-pink-500 to-rose-400"
            offColor="from-orange-400 to-amber-500"
            onIconColor="text-pink-900"
            offIconColor="text-orange-900"
          />
        </div>
      </div>
      <div className="max-w-lg px-8 py-6 mx-auto relative rounded-3xl shadow-2xl bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 transition-all duration-500 border">
        <Carousel setApi={setCarouselApi} className="w-full">
          <CarouselContent>
            {showLikedMe ? (
              likedMeList.length > 0 ? (
                likedMeList.map((user) => (
                  <CarouselItem key={user.user_id}>
                    <div className="rounded-2xl overflow-hidden shadow-sm relative group">
                      <img 
                        src={user.avatar || "https://placehold.co/400x500"} 
                        className="w-full h-[550px] object-cover"
                        alt="avatar"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white">
                        <h2 className="text-2xl font-bold">{user.first_name}, {user.age}</h2>
                        <p className="text-sm opacity-80">{user.distance_km} km away</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <div className="w-full p-8 text-center text-gray-500">
                  No one has liked you yet. Keep swiping!
                </div>
              )
            ) : (
              recommendations.map((user) => (
                <CarouselItem key={user.user_id}>
                  <div className="rounded-2xl overflow-hidden shadow-sm relative group">
                      <img 
                        src={user.avatar || "https://placehold.co/400x500"} 
                        className="w-full h-[550px] object-cover"
                        alt="avatar"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white">
                        <h2 className="text-2xl font-bold">{user.first_name}, {user.age}</h2>
                        <p className="text-sm opacity-80">{user.distance_km} km away</p>
                      </div>
                    </div>
                </CarouselItem>
              ))
            )}
          </CarouselContent>
        </Carousel>

        <div className="flex flex-row justify-center gap-8 mt-10">
          <Button 
            className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${
              isAnimating === "dislike" || isDisliked ? "bg-zinc-700" : "bg-zinc-200 dark:bg-zinc-800"
            }`}
            onClick={handleDislike}
            disabled={!!isAnimating || isDisliked || isLiked || (showLikedMe && likedMeList.length === 0)}
          >
            <ThumbsDown size={30} fill={isDisliked ? "currentColor" : "none"} />
          </Button>

          <Button 
            className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${
              isAnimating === "like" || isLiked ? "bg-pink-500 scale-110" : "bg-pink-400 hover:bg-pink-500"
            }`}
            onClick={handleLike}
            disabled={!!isAnimating || isLiked || isDisliked || (showLikedMe && likedMeList.length === 0)}
          >
            <Heart size={30} fill={isLiked ? "white" : "none"} />
          </Button>
        </div>
      </div>

      <div className="w-[200px] p-4 mt-8">
        <FancyToggle 
          isPicked={isDark} 
          setIsPicked={toggleTheme} 
        />
      </div>

    </div>
  );
}