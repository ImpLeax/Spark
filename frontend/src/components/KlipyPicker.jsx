import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";

const KlipyPicker = ({ apiKey, onGifClick, onClose, userId = "anonymous_user" }) => {
  console.log(apiKey)
  const [gifs, setGifs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchGifs = async (query = "") => {
    setLoading(true);
    try {
      
      const baseUrl = `https://api.klipy.com/api/v1/${apiKey}/gifs`;
      
      const params = new URLSearchParams({
        page: 1,
        per_page: 24,
        customer_id: userId, 
        locale: "uk",        
      });

      let endpoint = "";
      if (query) {
        params.append("q", query);
        endpoint = `${baseUrl}/search?${params.toString()}`;
      } else {
        endpoint = `${baseUrl}/trending?${params.toString()}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

    
      if (result.result && result.data && result.data.data) {
        setGifs(result.data.data);
      } else {
        setGifs([]);
      }
    } catch (err) {
      console.error("Klipy Fetch Error:", err);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (apiKey) {
      fetchGifs();
    }
  }, [apiKey]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="flex flex-col w-[350px] h-[450px] bg-card border border-border rounded-2xl overflow-hidden shadow-2xl mb-2 z-[100]"
    >
      <div className="p-3 border-b border-border flex gap-2 bg-muted/30">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Пошук GIF..." 
            className="w-full bg-background border border-border pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchGifs(search)}
          />
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 hover:bg-muted rounded-full transition-colors"
          title="Закрити"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 custom-scrollbar bg-background/50">
        {loading ? (
          <div className="col-span-2 flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
            <p className="text-xs text-muted-foreground animate-pulse">Завантаження...</p>
          </div>
        ) : gifs.length > 0 ? (
          gifs.map((gif) => {
            const previewUrl = gif.file?.sm?.webp?.url || gif.file?.sm?.gif?.url;
            
            const originalUrl = gif.file?.md?.gif?.url || gif.file?.hd?.gif?.url || previewUrl;

            return (
              <div 
                key={gif.id}
                className="relative h-[120px] rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                onClick={() => onGifClick(originalUrl)}
              >
                <img 
                  src={previewUrl} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  alt={gif.title || "gif"}
                  loading="lazy"
                />
              </div>
            );
          })
        ) : (
          <div className="col-span-2 flex items-center justify-center h-full text-muted-foreground text-sm">
            Нічого не знайдено 😕
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-muted/30 text-[10px] flex items-center justify-between text-muted-foreground border-t border-border">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          API Online
        </div>
        <span className="font-medium">Powered by KLIPY</span>
      </div>
    </motion.div>
  );
};

export default KlipyPicker;