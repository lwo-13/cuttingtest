import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    
    useEffect(() => {
        // Initial fetch of notifications
        fetchNotifications();
        
        // Set up Server-Sent Events for real-time notifications
        setupSSE();
        
        // Cleanup function
        return () => {
            // SSE cleanup will be handled by the component unmount
        };
    }, []);
    
    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/notifications/active');
            if (response.data.success) {
                const activeNotifications = response.data.data;
                setNotifications(activeNotifications);
                
                // Count unread notifications
                const unread = activeNotifications.filter(n => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };
    
    const setupSSE = () => {
        // Get the auth token for SSE
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const eventSource = new EventSource(`/notifications/stream`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            eventSource.onopen = () => {
                console.log('SSE connection opened');
                setIsConnected(true);
            };
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.notifications) {
                        // Update notifications with new data
                        setNotifications(data.notifications);
                        
                        // Count unread notifications
                        const unread = data.notifications.filter(n => !n.is_read).length;
                        setUnreadCount(unread);
                        
                        // Play notification sound for critical notifications
                        const criticalNotifications = data.notifications.filter(n => 
                            n.priority === 'critical' && !n.is_read
                        );
                        
                        if (criticalNotifications.length > 0) {
                            playNotificationSound();
                        }
                    }
                } catch (error) {
                    console.error('Error parsing SSE data:', error);
                }
            };
            
            eventSource.onerror = (error) => {
                console.error('SSE error:', error);
                setIsConnected(false);
                
                // Attempt to reconnect after 5 seconds
                setTimeout(() => {
                    if (eventSource.readyState === EventSource.CLOSED) {
                        setupSSE();
                    }
                }, 5000);
            };
            
            // Store reference for cleanup
            window.notificationEventSource = eventSource;
            
        } catch (error) {
            console.error('Error setting up SSE:', error);
        }
    };
    
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
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
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
        isConnected,
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
