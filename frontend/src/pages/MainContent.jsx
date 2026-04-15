import { useEffect, useState } from "react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import api from "@/services/axios";
import { Button } from "@/components/ui/button";
import { Heart,ThumbsDown } from 'lucide-react';

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

  const isLiked = recommendations[current - 1] ? likedIds.has(recommendations[current - 1].user_id) : false;
  const isDisliked = recommendations[current - 1] ? dislikedIds.has(recommendations[current - 1].user_id) : false;

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

  if (isInitialLoading) return <div className="h-screen flex items-center justify-center font-bold">Searching...</div>;

  if (recommendations.length === 0) return <div className="p-8 text-center text-gray-500">No new profiles found. Try later!</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="max-w-lg px-17 py-6 mx-auto mt-25 relative bg-card rounded-2xl shadow-lg">
        <Carousel setApi={setCarouselApi} className="w-full">
          <CarouselContent>
            {recommendations.map((user) => (
              <CarouselItem key={user.user_id}>
                <div className="border rounded-2xl overflow-hidden shadow-xl bg-card">
                  <img 
                    src={user.avatar || "https://placehold.co/400x500"} 
                    className="w-full h-[550px] object-cover"
                    alt="avatar"
                  />
                  <div className="p-6 bg-gradient-to-t from-black/80 to-transparent -mt-24 relative z-10 text-white">
                    <h2 className="text-2xl font-bold">{user.first_name}, {user.age}</h2>
                    <p className="text-sm opacity-90">{user.distance_km} km away</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="flex flex-row justify-evenly">
          <div className="flex justify-center mt-8">
            <Button 
              className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-300 ${
                isAnimating === "dislike" || isDisliked ? "bg-black scale-110" : "bg-gray-700 hover:bg-gray-800"
              }`}
              onClick={handleDislike}
              disabled={isAnimating === "dislike" || isDisliked}
            >
              <ThumbsDown
                size={36} 
                fill={isDisliked || isAnimating === "dislike" ? "white" : "none"} 
                className="text-white transition-colors"
              />
            </Button>
          </div>
          <div className="flex justify-center mt-8">
            <Button 
              className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-300 ${
                isAnimating === "like" || isLiked ? "bg-pink-500 scale-110" : "bg-pink-400 hover:bg-pink-500"
              }`}
              onClick={handleLike}
              disabled={isAnimating === "like" || isLiked}
            >
              <Heart 
                size={36} 
                fill={isLiked || isAnimating === "like" ? "white" : "none"} 
                className="text-white transition-colors"
              />
            </Button>
          </div>
        </div>
        <div className="py-4 text-center text-xs text-muted-foreground uppercase">
          Profile {current} of {recommendations.length}
        </div>
      </div>
    </div>
  );
}