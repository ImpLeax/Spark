import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Loader2, Search, MessageCircle, Check, CheckCheck, ChevronDown, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import api from "@/services/axios";
import { cn } from "@/lib/utils";
import { getAccessToken, API_BASE_URL } from "@/services/axios";
import { usePresence } from "@/context/PresenceContext";
import KlipyPicker from "@/components/KlipyPicker";

const getAvatarUrl = (avatarPath, firstName) => {
  if (!avatarPath) return `https://ui-avatars.com/api/?name=${firstName}&background=random&color=fff`;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `${API_BASE_URL}${avatarPath}`;
};

const getAttachmentUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBaseUrl}${cleanPath}`;
};

const getFileNameFromUrl = (url) => {
    if (!url) return "Attachment";
    try {
        return decodeURIComponent(url.split('/').pop().split('?')[0]);
    } catch (error) {
        return "Attachment";
    }
};

const getWebSocketBaseUrl = () => {
    const isSecure = API_BASE_URL.startsWith("https");
    const domain = API_BASE_URL.replace(/^https?:\/\//, '');
    return isSecure ? `wss://${domain}` : `ws://${domain}`;
};

const MessagesPage = () => {
  const { onlineUsers, newMessageNotification } = usePresence();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const currentUserId = localStorage.getItem("user_id") || "spark_user";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const ws = useRef(null);
  const chatContainerRef = useRef(null);
  const unreadMessageRef = useRef(null);
  const fileInputRef = useRef(null);

  const processedNotifications = useRef(new Set());
  const previousScrollHeight = useRef(0);

  const isOnline = useCallback((userId, fallback) => {
    if (!onlineUsers) return fallback;
    const status = onlineUsers[String(userId)] ?? onlineUsers[Number(userId)];
    return status !== undefined ? status : fallback;
  }, [onlineUsers]);

  // Затримка пошуку: чекаємо 500мс після останнього введення
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Завантаження чатів із врахуванням пошуку
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      try {
        const res = await api.get(`chat/?search=${encodeURIComponent(debouncedSearch)}`);
        setChats(res.data);
      } catch (error) {
        console.error("Failed to load chats:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };
    fetchChats();
  }, [debouncedSearch]);

  useEffect(() => {
    if (!newMessageNotification) return;

    const notifKey = newMessageNotification.id || `${newMessageNotification.chat_id}-${newMessageNotification.created_at}`;

    if (processedNotifications.current.has(notifKey)) return;
    processedNotifications.current.add(notifKey);

    if (activeChat && activeChat.id === newMessageNotification.chat_id) return;

    setChats(prevChats => {
        const chatIndex = prevChats.findIndex(c => c.id === newMessageNotification.chat_id);
        if (chatIndex === -1) {
            api.get("chat/").then(res => setChats(res.data));
            return prevChats;
        }

        const existingChat = prevChats[chatIndex];
        const updatedChat = {
            ...existingChat,
            last_message: {
                text: newMessageNotification.message,
                is_mine: false,
                created_at: newMessageNotification.created_at,
                is_read: false
            },
            unread_count: existingChat.unread_count + 1
        };

        const newChats = [...prevChats];
        newChats[chatIndex] = updatedChat;
        return newChats.sort((a, b) => new Date(b.last_message?.created_at || b.created_at) - new Date(a.last_message?.created_at || a.created_at));
    });
  }, [newMessageNotification, activeChat]);


  const sendMarkAsRead = useCallback(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN && activeChat) {
          const hasUnread = messages.some(m => !m.is_mine && !m.is_read);
          if (hasUnread || activeChat.unread_count > 0) {
              ws.current.send(JSON.stringify({ action: "mark_as_read" }));

              setChats(prev => prev.map(c =>
                  c.id === activeChat.id ? { ...c, unread_count: 0 } : c
              ));

              setMessages(prev => prev.map(m =>
                  !m.is_mine ? { ...m, is_read: true } : m
              ));
          }
      }
  }, [messages, activeChat]);


  useEffect(() => {
    if (!activeChat) return;

    setMessages([]);
    setNextCursor(null);
    setIsLoadingMessages(true);
    setShowScrollBottomBtn(false);
    setSelectedFiles([]);

    const roomId = activeChat.id;
    const token = getAccessToken();

    const fetchInitialMessages = async () => {
      try {
        const res = await api.get(`chat/${roomId}/messages/`);
        const fetchedMessages = res.data.results.reverse();
        setMessages(fetchedMessages);

        if (res.data.next) {
          const url = new URL(res.data.next);
          setNextCursor(url.searchParams.get("cursor"));
        }

        const unreadCount = fetchedMessages.filter(m => !m.is_mine && !m.is_read).length;

        setTimeout(() => {
            if (unreadCount > 0 && unreadMessageRef.current && chatContainerRef.current) {
                const container = chatContainerRef.current;
                const offsetTop = unreadMessageRef.current.offsetTop;
                container.scrollTop = offsetTop - container.clientHeight / 3;
            } else {
                scrollToBottom("auto");
            }
        }, 50);

      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchInitialMessages();

    const wsBaseUrl = getWebSocketBaseUrl();
    const wsUrl = `${wsBaseUrl}/ws/chat/${roomId}/?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {};

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.action === "new_message") {
          const newMessage = {
            id: data.msg_id,
            text: data.message,
            file_url: data.file_url,
            is_mine: data.sender_id === activeChat.partner.id ? false : true,
            created_at: new Date().toISOString(),
            is_read: data.is_read
          };

          let isAtBottom = true;
          if (chatContainerRef.current) {
              const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current;
              isAtBottom = scrollHeight - scrollTop - clientHeight < 300;
          }

          if (!newMessage.is_mine && isAtBottom) {
              if (ws.current.readyState === WebSocket.OPEN) {
                  ws.current.send(JSON.stringify({ action: "mark_as_read" }));
              }
              newMessage.is_read = true;
          }

          setMessages((prev) => [...prev, newMessage]);

          setChats((prevChats) => {
            const existingChatIndex = prevChats.findIndex(c => c.id === roomId);
            if (existingChatIndex === -1) return prevChats;

            const existingChat = prevChats[existingChatIndex];
            const updatedChat = {
                ...existingChat,
                last_message: {
                    text: newMessage.text,
                    file_url: newMessage.file_url,
                    is_mine: newMessage.is_mine,
                    created_at: newMessage.created_at,
                    is_read: newMessage.is_read
                },
                unread_count: (newMessage.is_mine || isAtBottom) ? 0 : existingChat.unread_count + 1
            };

            const newChats = [...prevChats];
            newChats[existingChatIndex] = updatedChat;
            return newChats.sort((a, b) => new Date(b.last_message?.created_at || b.created_at) - new Date(a.last_message?.created_at || a.created_at));
          });

          if (newMessage.is_mine || isAtBottom) {
              scrollToBottom("smooth");
          }
      }
      else if (data.action === "messages_read") {
          if (data.reader_id === activeChat.partner.id) {
              setMessages(prev => prev.map(m =>
                  m.is_mine ? { ...m, is_read: true } : m
              ));

              setChats(prev => prev.map(c =>
                  c.id === roomId && c.last_message?.is_mine
                      ? { ...c, last_message: { ...c.last_message, is_read: true } }
                      : c
              ));
          }
      }
    };

    ws.current.onclose = (e) => {
      if (e.code === 4003) alert("You don't have permission to view this chat.");
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [activeChat]);


  useEffect(() => {
      const observer = new IntersectionObserver(
          (entries) => {
              if (entries[0].isIntersecting) {
                  sendMarkAsRead();
              }
          },
          { threshold: 0.5 }
      );

      const target = chatContainerRef.current?.lastElementChild;
      if (target) observer.observe(target);

      return () => {
          if (target) observer.unobserve(target);
      };
  }, [sendMarkAsRead, messages]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      setSelectedFiles(prev => {
        const prevArray = prev || [];
        return [...prevArray, ...newFiles].slice(0, 10);
      });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0) return;

    if (selectedFiles.length > 0) {
        const formData = new FormData();
        
        if (input.trim()) {
            formData.append('message', input.trim());
        }

        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            await api.post(`chat/${activeChat.id}/upload/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setInput("");
            setSelectedFiles([]);
        } catch (error) {
            console.error("Помилка завантаження файлу: ", error);
            const errorMessage = error.response?.data?.error 
                              || error.response?.data?.detail 
                              || "Помилка при завантаженні файлу. Перевірте формат та розмір.";
            
            alert(`Не вдалося відправити файл: ${errorMessage}`);
  
        }
    } 
    else {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
        ws.current.send(JSON.stringify({
            action: "send_message",
            message: input.trim()
        }));
        setInput("");
    }
  };

  const sendGif = (gifUrl) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    
    ws.current.send(JSON.stringify({
        action: "send_message",
        message: gifUrl
    }));
    
    setShowGifPicker(false);
  };

  const isGifMessage = (text) => {
    if (!text) return false;
    const urlPattern = /^(https?:\/\/(?:[a-z0-9\-]+\.)*(?:tenor\.com|giphy\.com|gph\.is)[^\s]*|\S+\.gif)$/i;
    return urlPattern.test(text.trim());
  };



  const scrollToBottom = (behavior = "smooth") => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        if (behavior === "auto") {
          container.scrollTop = container.scrollHeight;
        } else {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
          });
        }
      }
    }, 250);
  };

  const handleGifSelect = (gifUrl) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({
        action: "send_message",
        message: gifUrl
    }));

    setShowGifPicker(false);
  };

  const handleScroll = useCallback(async () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
    setShowScrollBottomBtn(!isNearBottom);

    if (container.scrollTop === 0 && nextCursor && !isFetchingOlder) {
      setIsFetchingOlder(true);
      previousScrollHeight.current = container.scrollHeight;

      try {
        const res = await api.get(`chat/${activeChat.id}/messages/?cursor=${nextCursor}`);
        const olderMessages = res.data.results.reverse();

        setMessages((prev) => [...olderMessages, ...prev]);

        if (res.data.next) {
          const url = new URL(res.data.next);
          setNextCursor(url.searchParams.get("cursor"));
        } else {
          setNextCursor(null);
        }

        requestAnimationFrame(() => {
            if (chatContainerRef.current) {
                const newScrollHeight = chatContainerRef.current.scrollHeight;
                const heightDifference = newScrollHeight - previousScrollHeight.current;
                chatContainerRef.current.scrollTop = heightDifference;
            }
        });

      } catch (error) {
        console.error("Failed to load older messages", error);
      } finally {
        setIsFetchingOlder(false);
      }
    }
  }, [nextCursor, isFetchingOlder, activeChat]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
        container.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    const menuBtn = document.getElementById("mobile-menu-btn");
    if (menuBtn) {
      if (activeChat) menuBtn.style.display = "none";
      else menuBtn.style.display = "";
    }
    return () => {
      if (menuBtn) menuBtn.style.display = "";
    };
  }, [activeChat]);

  let firstUnreadIndex = -1;
  if (messages.length > 0) {
      firstUnreadIndex = messages.findIndex(m => !m.is_mine && !m.is_read);
  }

  const currentChatData = chats.find(c => c.id === activeChat?.id) || activeChat;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <div className={cn(
        "w-full md:w-[320px] lg:w-[380px] flex-col border-r border-border bg-card shrink-0 transition-all z-10 shadow-sm",
        activeChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border h-[65px] flex items-center shrink-0">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>

        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-border"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin scrollbar-thumb-muted">
          {isLoadingChats ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : chats.length === 0 && !searchQuery ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages yet.<br/>Start swiping to get matches!</p>
            </div>
          ) : chats.length === 0 && searchQuery ? (
            <div className="text-center py-10 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Нічого не знайдено за запитом<br/>"{searchQuery}"</p>
            </div>
          ) : (
            chats.map(chat => {
              const partnerOnline = isOnline(chat.partner.id, chat.partner.is_online);
              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                    activeChat?.id === chat.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className="relative w-12 h-12 shrink-0">
                    <img
                      src={getAvatarUrl(chat.partner.avatar, chat.partner.first_name)}
                      alt={chat.partner.first_name}
                      className="w-full h-full object-cover rounded-full bg-secondary shadow-sm"
                    />

                    {chat.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card z-10">
                        {chat.unread_count}
                      </div>
                    )}

                    {partnerOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full z-10"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-semibold truncate">{chat.partner.first_name}</h3>
                      <span className={cn(
                        "text-[10px] whitespace-nowrap ml-2 font-medium",
                        activeChat?.id === chat.id ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {chat.last_message ? format(new Date(chat.last_message.created_at), "HH:mm") : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {chat.last_message?.is_mine && (
                            <div className={cn(
                                "shrink-0",
                                activeChat?.id === chat.id ? "text-primary-foreground/80" : "text-primary"
                            )}>
                                {chat.last_message.is_read ? (
                                    <CheckCheck className="w-3.5 h-3.5" />
                                ) : (
                                    <Check className="w-3.5 h-3.5 opacity-50" />
                                )}
                            </div>
                        )}
                        <p className={cn(
                          "text-[13px] truncate leading-tight flex-1",
                          activeChat?.id === chat.id ? "text-primary-foreground/90" : "text-muted-foreground",
                          chat.unread_count > 0 && activeChat?.id !== chat.id && "text-foreground font-semibold"
                        )}>
                          {chat.last_message
                            ? (chat.last_message.text || (chat.last_message.file_url ? "📎 File" : ""))
                            : "New match! Say hello 👋"}
                        </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {activeChat ? (
        <div className={cn(
          "flex-1 flex flex-col bg-background/50 relative w-full h-full",
          !activeChat && "hidden md:flex"
        )}>
          <div className="h-[65px] border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 shrink-0 z-10 shadow-sm">
            <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 shrink-0">
                <img
                  src={getAvatarUrl(activeChat.partner.avatar, activeChat.partner.first_name)}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover shadow-sm"
                />
                {isOnline(activeChat.partner.id, activeChat.partner.is_online) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full z-10"></span>
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-[15px] leading-tight">{activeChat.partner.first_name}</h3>
                <span className="text-[11px] text-muted-foreground font-medium">
                    {isOnline(activeChat.partner.id, activeChat.partner.is_online) ? "Online" : "Offline"}
                </span>
              </div>
            </div>
              <AnimatePresence>
                {currentChatData?.unread_count > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 15 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                    >
                        <span className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg border border-primary-foreground/20 whitespace-nowrap">
                            New messages
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 relative scrollbar-thin scrollbar-thumb-muted"
            style={{ overflowAnchor: "none" }}
          >

            {isFetchingOlder && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-border">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}

            {isLoadingMessages ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              messages.map((msg, index) => {
                const showAvatar = !msg.is_mine && (index === messages.length - 1 || messages[index + 1]?.is_mine);
                const isFirstUnread = index === firstUnreadIndex;
                const fileUrl = getAttachmentUrl(msg.file_url);

                return (
                  <React.Fragment key={msg.id || index}>
                    <motion.div
                      ref={isFirstUnread ? unreadMessageRef : null}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn("flex items-end gap-2", msg.is_mine ? "justify-end" : "justify-start")}
                    >
                      {!msg.is_mine && (
                        <div className="w-7 h-7 shrink-0 mb-1">
                          {showAvatar && (
                            <img
                              src={getAvatarUrl(activeChat.partner.avatar, activeChat.partner.first_name)}
                              className="w-full h-full rounded-full object-cover shadow-sm"
                              alt="avatar"
                            />
                          )}
                        </div>
                      )}

                      <div className={cn(
                        "max-w-[70%] px-4 py-2 rounded-[1.2rem] shadow-sm flex flex-col",
                        msg.is_mine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm"
                      )}>
                        
                        {/* Відображення файлу */}
                        {fileUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden flex flex-col">
                                {fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                    <img src={fileUrl} alt="attachment" className="max-w-full h-auto rounded-md object-contain" />
                                ) : (
                                    <a 
                                        href={fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-2 p-2 bg-background/20 rounded-md hover:bg-background/30 transition-colors"
                                    >
                                        <Paperclip className="w-4 h-4 shrink-0 text-foreground/80" />
                                        <span className="truncate text-[13px] font-medium underline-offset-2 hover:underline">
                                            {getFileNameFromUrl(msg.file_url)}
                                        </span>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Відображення тексту (якщо він є) */}
                        {msg.text && (
                            isGifMessage(msg.text) ? (
                                  <div className="mt-1 rounded-lg overflow-hidden bg-muted/20 max-w-[250px]">
                                      <img src={msg.text} alt="GIF" className="w-full h-auto object-contain" />
                                  </div>
                              ) : (
                                  <p className="text-[14px] leading-relaxed break-words">{msg.text}</p>
                              )
                        )}

                        <div className={cn(
                            "flex items-center justify-end gap-1 mt-0.5",
                            msg.is_mine ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                            <span className="text-[10px] font-medium">
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>

                            {msg.is_mine && (
                                msg.is_read ? (
                                    <CheckCheck className="w-3.5 h-3.5" />
                                ) : (
                                    <Check className="w-3.5 h-3.5 opacity-70" />
                                )
                            )}
                        </div>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })
            )}

          </div>
            <AnimatePresence>
                {showScrollBottomBtn && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        onClick={() => scrollToBottom("smooth")}
                        className="fixed bottom-24 left-[calc(50%+140px)] md:left-[calc(50%+160px)] lg:left-[calc(50%+190px)] -translate-x-1/2 w-10 h-10 bg-card border border-border shadow-lg rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors z-50 cursor-pointer"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>

          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-[85px] mb-2 left-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg z-50 p-2 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-muted"
              >
                {selectedFiles.map((file, index) => (
                  <motion.div 
                    key={`${file.name}-${index}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-2 bg-muted/50 p-1.5 pr-2 rounded-lg border border-border/50 shrink-0"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Paperclip className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col max-w-[120px]">
                      <span className="text-[12px] font-medium truncate text-foreground">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      type="button"
                      className="p-1 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showGifPicker && (
              <div className="absolute bottom-[85px] left-4 z-[100]">
                <KlipyPicker 
                  apiKey={import.meta.env.VITE_KLIPY_API_KEY}
                  onGifClick={handleGifSelect}
                  onClose={() => setShowGifPicker(false)}
                />
              </div>
            )}
          </AnimatePresence>

          <form onSubmit={sendMessage} className="p-4 bg-background border-t border-border shrink-0 flex gap-2 relative items-center">
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden"
                multiple 
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors shrink-0 cursor-pointer"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-colors shrink-0 cursor-pointer",
                  showGifPicker ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span className="font-bold text-[11px] border-2 border-current rounded-[4px] px-1 tracking-wider leading-none py-0.5">
                  GIF
                </span>
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-muted/50 px-4 py-3 rounded-full text-[14px] outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-border"
              />
              
              <button
                type="submit"
                disabled={!input.trim() && selectedFiles.length === 0}
                className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 shadow-md active:scale-95 cursor-pointer"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted-foreground bg-background/50">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-10 h-10 opacity-40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground/80">Your messages</h3>
          <p className="text-sm">Select a conversation to start chatting.</p>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;