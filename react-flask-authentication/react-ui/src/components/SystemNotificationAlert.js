import React, { useState, useEffect, useCallback } from 'react';
import axios from 'utils/axiosInstance';

// material-ui
import {
    Alert,
    AlertTitle,
    Snackbar,
    Box,
    Typography,
    Chip,
    IconButton
} from '@mui/material';

// icons
import { IconX, IconAlertTriangle, IconInfoCircle, IconCheck, IconExclamationMark } from '@tabler/icons';

const SystemNotificationAlert = () => {
    const [notifications, setNotifications] = useState([]);
    const [dismissedNotifications, setDismissedNotifications] = useState(new Set());

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await axios.get('/notifications/active');
            if (response.data.success) {
                // Filter out notifications that have been dismissed locally
                const activeNotifications = response.data.data.filter(
                    notification => !dismissedNotifications.has(notification.id) && !notification.is_read
                );
                setNotifications(activeNotifications);
            } else {
                console.error('Error fetching notifications:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error.response?.data?.message || error.message);
        }
    }, [dismissedNotifications]);

    useEffect(() => {
        fetchNotifications();

        // Set up polling for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);
    
    const handleDismiss = async (notificationId) => {
        try {
            // Mark as read on server
            const response = await axios.post(`/notifications/mark_read/${notificationId}`);
            if (response.data.success) {
                // Add to local dismissed set
                setDismissedNotifications(prev => new Set([...prev, notificationId]));

                // Remove from current notifications
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
            } else {
                console.error('Error dismissing notification:', response.data.message);
            }
        } catch (error) {
            console.error('Error dismissing notification:', error.response?.data?.message || error.message);
        }
    };
    
    const getAlertSeverity = (type) => {
        switch (type) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'success': return 'success';
            case 'info': return 'info';
            default: return 'info';
        }
    };
    
    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return <IconExclamationMark />;
            case 'warning': return <IconAlertTriangle />;
            case 'success': return <IconCheck />;
            case 'info': return <IconInfoCircle />;
            default: return <IconInfoCircle />;
        }
    };
    
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'normal': return 'info';
            case 'low': return 'default';
            default: return 'default';
        }
    };
    
    // Sort notifications by priority (critical first)
    const sortedNotifications = [...notifications].sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
    
    // Show critical and high priority notifications as persistent alerts
    const criticalNotifications = sortedNotifications.filter(n => 
        n.priority === 'critical' || n.priority === 'high'
    );
    
    // Show normal and low priority notifications as snackbars
    const normalNotifications = sortedNotifications.filter(n => 
        n.priority === 'normal' || n.priority === 'low'
    );
    
    return (
        <>
            {/* Critical/High Priority Notifications - Persistent Alerts */}
            {criticalNotifications.map((notification) => (
                <Box
                    key={notification.id}
                    sx={{
                        position: 'fixed',
                        top: notification.priority === 'critical' ? 20 : 80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        width: '90%',
                        maxWidth: '600px',
                        mb: 1
                    }}
                >
                    <Alert
                        severity={getAlertSeverity(notification.notification_type)}
                        icon={getAlertIcon(notification.notification_type)}
                        action={
                            <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                    label={notification.priority.toUpperCase()}
                                    color={getPriorityColor(notification.priority)}
                                    size="small"
                                />
                                <IconButton
                                    color="inherit"
                                    size="small"
                                    onClick={() => handleDismiss(notification.id)}
                                >
                                    <IconX />
                                </IconButton>
                            </Box>
                        }
                        sx={{
                            '& .MuiAlert-message': {
                                width: '100%'
                            },
                            boxShadow: 3,
                            border: notification.priority === 'critical' ? '2px solid' : '1px solid',
                            borderColor: notification.priority === 'critical' ? 'error.main' : 'warning.main'
                        }}
                    >
                        <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {notification.title}
                        </AlertTitle>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            {notification.message}
                        </Typography>
                        {notification.expires_at && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                                Expires: {new Date(notification.expires_at).toLocaleString()}
                            </Typography>
                        )}
                    </Alert>
                </Box>
            ))}
            
            {/* Normal/Low Priority Notifications - Snackbars */}
            {normalNotifications.map((notification, index) => (
                <Snackbar
                    key={notification.id}
                    open={true}
                    anchorOrigin={{ 
                        vertical: 'bottom', 
                        horizontal: 'right' 
                    }}
                    sx={{
                        bottom: 20 + (index * 80) // Stack multiple snackbars
                    }}
                >
                    <Alert
                        onClose={() => handleDismiss(notification.id)}
                        severity={getAlertSeverity(notification.notification_type)}
                        sx={{ 
                            width: '100%',
                            minWidth: '350px'
                        }}
                        action={
                            <Chip
                                label={notification.priority}
                                color={getPriorityColor(notification.priority)}
                                size="small"
                            />
                        }
                    >
                        <AlertTitle sx={{ fontWeight: 'bold' }}>
                            {notification.title}
                        </AlertTitle>
                        <Typography variant="body2">
                            {notification.message}
                        </Typography>
                        {notification.expires_at && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                                Expires: {new Date(notification.expires_at).toLocaleString()}
                            </Typography>
                        )}
                    </Alert>
                </Snackbar>
            ))}
        </>
    );
};

export default SystemNotificationAlert;
