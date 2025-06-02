import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'utils/axiosInstance';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const playNotificationSound = () => {
        // Create a simple notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    };

    // Check for critical notifications and play sound
    const checkForCriticalNotifications = (notifications) => {
        const criticalNotifications = notifications.filter(n =>
            n.priority === 'critical' && !n.is_read
        );

        if (criticalNotifications.length > 0) {
            playNotificationSound();
        }
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await axios.get('/notifications/active');
            if (response.data.success) {
                const activeNotifications = response.data.data;
                setNotifications(activeNotifications);

                // Count unread notifications
                const unread = activeNotifications.filter(n => !n.is_read).length;
                setUnreadCount(unread);

                // Check for critical notifications and play sound
                checkForCriticalNotifications(activeNotifications);
            } else {
                console.error('Error fetching notifications:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error.response?.data?.message || error.message);
        }
    }, []);

    useEffect(() => {
        // Initial fetch of notifications
        fetchNotifications();

        // Set up polling for notifications every 30 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000); // Poll every 30 seconds

        // Cleanup function
        return () => {
            clearInterval(interval);
        };
    }, [fetchNotifications]);
    
    const markAsRead = async (notificationId) => {
        try {
            const response = await axios.post(`/notifications/mark_read/${notificationId}`);
            if (response.data.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId
                            ? { ...n, is_read: true }
                            : n
                    )
                );

                // Update unread count
                setUnreadCount(prev => Math.max(0, prev - 1));

                return true;
            } else {
                console.error('Error marking notification as read:', response.data.message);
                return false;
            }
        } catch (error) {
            console.error('Error marking notification as read:', error.response?.data?.message || error.message);
            return false;
        }
    };
    
    const dismissNotification = (notificationId) => {
        // Remove from local state immediately for better UX
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Mark as read on server
        markAsRead(notificationId);
    };
    
    const refreshNotifications = () => {
        fetchNotifications();
    };
    
    const getNotificationsByPriority = (priority) => {
        return notifications.filter(n => n.priority === priority && !n.is_read);
    };
    
    const getCriticalNotifications = () => {
        return getNotificationsByPriority('critical');
    };
    
    const getHighPriorityNotifications = () => {
        return getNotificationsByPriority('high');
    };
    
    const hasUnreadCritical = () => {
        return getCriticalNotifications().length > 0;
    };
    
    const hasUnreadHigh = () => {
        return getHighPriorityNotifications().length > 0;
    };
    
    const contextValue = {
        notifications,
        unreadCount,
        markAsRead,
        dismissNotification,
        refreshNotifications,
        getNotificationsByPriority,
        getCriticalNotifications,
        getHighPriorityNotifications,
        hasUnreadCritical,
        hasUnreadHigh
    };
    
    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationContext;
