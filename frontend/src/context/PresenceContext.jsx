import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api, { getAccessToken, API_BASE_URL } from '@/services/axios';

const PresenceContext = createContext();

export const PresenceProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState({});
    const [newMessageNotification, setNewMessageNotification] = useState(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [likesCount, setLikesCount] = useState(0);
    const [newMatchNotification, setNewMatchNotification] = useState(null);

    const suppressSoundUntil = useRef(0);

    const currentActiveChatRef = useRef(null);

    const notifiedCountsRef = useRef({});

    const audioRef = useRef(null);

    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log('Autoplay prevented by browser. User must interact with the page first.');
                });
            }
        }
    }, []);

    const setActiveChatId = useCallback((chatId) => {
        const idStr = chatId ? String(chatId) : null;
        currentActiveChatRef.current = idStr;

        if (idStr) {
            delete notifiedCountsRef.current[idStr];
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        api.get("recommendation/like/received/")
            .then(res => {
                const count = Array.isArray(res.data.results) ? res.data.results.length : res.data.length;
                setLikesCount(count || 0);
            })
            .catch(err => console.error("Failed to load initial likes count", err));
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const token = getAccessToken();
        if (!token) return;

        const wsBaseUrl = API_BASE_URL.startsWith("https")
            ? `wss://${API_BASE_URL.replace(/^https?:\/\//, '')}`
            : `ws://${API_BASE_URL.replace(/^https?:\/\//, '')}`;

        const socket = new WebSocket(`${wsBaseUrl}/ws/presence/?token=${token}`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "presence") {
                setOnlineUsers(prev => ({
                    ...prev,
                    [String(data.user_id)]: data.status
                }));
            }
            else if (data.type === "notification") {
                setNewMessageNotification(data);

                const incomingChatId = String(data.chat_id);

                if (currentActiveChatRef.current !== incomingChatId) {
                    if (Date.now() > suppressSoundUntil.current) {

                        if (!notifiedCountsRef.current[incomingChatId]) {
                            playNotificationSound();
                            notifiedCountsRef.current[incomingChatId] = true;
                        }
                    }
                }

                setUnreadMessagesCount(prev => prev + 1);
            }
            else if (data.type === "new_like") {
                setLikesCount(prev => prev + 1);
                if (Date.now() > suppressSoundUntil.current) {
                    playNotificationSound();
                }
            }
            else if (data.type === "new_match") {
                setNewMatchNotification(data.chat_data);

                if (Date.now() > suppressSoundUntil.current) {
                    playNotificationSound();
                }

                setUnreadMessagesCount(prev => prev + 1);
            }
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            } else if (socket.readyState === WebSocket.CONNECTING) {
                socket.onopen = () => socket.close();
            }
        };
    }, [isAuthenticated, playNotificationSound]);

    const clearLikesCount = () => setLikesCount(0);
    const muteNextNotification = () => suppressSoundUntil.current = Date.now() + 5000;

    return (
        <PresenceContext.Provider value={{
            onlineUsers,
            newMessageNotification,
            newMatchNotification,
            likesCount,
            clearLikesCount,
            unreadMessagesCount,
            setUnreadMessagesCount,
            muteNextNotification,
            setActiveChatId
        }}>
            {children}
            <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" style={{ display: 'none' }} />
        </PresenceContext.Provider>
    );
};

export const usePresence = () => useContext(PresenceContext);