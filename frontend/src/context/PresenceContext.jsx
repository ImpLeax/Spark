import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getAccessToken, API_BASE_URL } from '@/services/axios';

const PresenceContext = createContext();

export const PresenceProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState({});

    const [newMessageNotification, setNewMessageNotification] = useState(null);

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
            }
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            } else if (socket.readyState === WebSocket.CONNECTING) {
                socket.onopen = () => socket.close();
            }
        };
    }, [isAuthenticated]);

    return (
        <PresenceContext.Provider value={{ onlineUsers, newMessageNotification }}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => useContext(PresenceContext);