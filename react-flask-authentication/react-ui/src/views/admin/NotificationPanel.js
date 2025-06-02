import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// material-ui
import {
    Grid,
    Card,
    CardContent,
    CardHeader,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    Alert,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
    FormGroup
} from '@mui/material';

// icons
import { IconSend, IconUsers, IconTrash, IconAlertTriangle } from '@tabler/icons';

// project imports
import MainCard from '../../ui-component/cards/MainCard';

const NotificationPanel = () => {
    const { t } = useTranslation();
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        notification_type: 'warning',
        priority: 'high',
        expires_in_minutes: 60,
        target_roles: []
    });
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [activeUsers, setActiveUsers] = useState([]);
    const [activeNotifications, setActiveNotifications] = useState([]);
    const [showActiveUsers, setShowActiveUsers] = useState(false);
    
    // Available roles for targeting
    const availableRoles = ['Administrator', 'Manager', 'Project Admin', 'Planner', 'Spreader', 'Cutter'];
    
    useEffect(() => {
        fetchActiveUsers();
        fetchActiveNotifications();
    }, []);
    
    const fetchActiveUsers = async () => {
        try {
            const response = await axios.get('/notifications/active_users');
            if (response.data.success) {
                setActiveUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching active users:', error);
        }
    };
    
    const fetchActiveNotifications = async () => {
        try {
            const response = await axios.get('/notifications/active');
            if (response.data.success) {
                setActiveNotifications(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching active notifications:', error);
        }
    };
    
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const handleRoleToggle = (role) => {
        setFormData(prev => ({
            ...prev,
            target_roles: prev.target_roles.includes(role)
                ? prev.target_roles.filter(r => r !== role)
                : [...prev.target_roles, role]
        }));
    };
    
    const handleSendNotification = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            setSnackbar({
                open: true,
                message: 'Title and message are required',
                severity: 'error'
            });
            return;
        }
        
        setLoading(true);
        try {
            const response = await axios.post('/notifications/send', formData);
            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: 'Notification sent successfully!',
                    severity: 'success'
                });
                
                // Reset form
                setFormData({
                    title: '',
                    message: '',
                    notification_type: 'warning',
                    priority: 'high',
                    expires_in_minutes: 60,
                    target_roles: []
                });
                
                // Refresh notifications list
                fetchActiveNotifications();
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleDismissNotification = async (notificationId) => {
        try {
            const response = await axios.post(`/notifications/dismiss/${notificationId}`);
            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: 'Notification dismissed',
                    severity: 'success'
                });
                fetchActiveNotifications();
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Error: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        }
    };
    
    const handleQuickRestartWarning = () => {
        setFormData({
            title: 'System Restart Imminent',
            message: 'The system will be restarted in 15 minutes for maintenance. Please save all your work immediately to avoid data loss.',
            notification_type: 'warning',
            priority: 'critical',
            expires_in_minutes: 20,
            target_roles: []
        });
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
    
    const getTypeColor = (type) => {
        switch (type) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'success': return 'success';
            case 'info': return 'info';
            default: return 'default';
        }
    };
    
    return (
        <Grid container spacing={3}>
            {/* Send Notification Form */}
            <Grid item xs={12} md={8}>
                <MainCard title="Send System Notification">
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box display="flex" gap={2} mb={2}>
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<IconAlertTriangle />}
                                    onClick={handleQuickRestartWarning}
                                >
                                    Quick: Restart Warning
                                </Button>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notification Title"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                required
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Message"
                                multiline
                                rows={4}
                                value={formData.message}
                                onChange={(e) => handleInputChange('message', e.target.value)}
                                required
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={formData.notification_type}
                                    onChange={(e) => handleInputChange('notification_type', e.target.value)}
                                >
                                    <MenuItem value="info">Info</MenuItem>
                                    <MenuItem value="warning">Warning</MenuItem>
                                    <MenuItem value="error">Error</MenuItem>
                                    <MenuItem value="success">Success</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={formData.priority}
                                    onChange={(e) => handleInputChange('priority', e.target.value)}
                                >
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="critical">Critical</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Expires in (minutes)"
                                type="number"
                                value={formData.expires_in_minutes}
                                onChange={(e) => handleInputChange('expires_in_minutes', parseInt(e.target.value))}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Target Roles (leave empty for all users):
                            </Typography>
                            <FormGroup row>
                                {availableRoles.map((role) => (
                                    <FormControlLabel
                                        key={role}
                                        control={
                                            <Checkbox
                                                checked={formData.target_roles.includes(role)}
                                                onChange={() => handleRoleToggle(role)}
                                            />
                                        }
                                        label={role}
                                    />
                                ))}
                            </FormGroup>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<IconSend />}
                                onClick={handleSendNotification}
                                disabled={loading}
                                size="large"
                            >
                                {loading ? 'Sending...' : 'Send Notification'}
                            </Button>
                        </Grid>
                    </Grid>
                </MainCard>
            </Grid>
            
            {/* Active Users Panel */}
            <Grid item xs={12} md={4}>
                <MainCard title={`Active Users (${activeUsers.length})`}>
                    <Button
                        variant="outlined"
                        startIcon={<IconUsers />}
                        onClick={() => setShowActiveUsers(true)}
                        fullWidth
                    >
                        View Active Users
                    </Button>
                </MainCard>
            </Grid>
            
            {/* Active Notifications */}
            <Grid item xs={12}>
                <MainCard title="Active System Notifications">
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Expires</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activeNotifications.map((notification) => (
                                    <TableRow key={notification.id}>
                                        <TableCell>{notification.title}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={notification.notification_type} 
                                                color={getTypeColor(notification.notification_type)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={notification.priority} 
                                                color={getPriorityColor(notification.priority)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(notification.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {notification.expires_at 
                                                ? new Date(notification.expires_at).toLocaleString()
                                                : 'Never'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDismissNotification(notification.id)}
                                            >
                                                <IconTrash />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {activeNotifications.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No active notifications
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </MainCard>
            </Grid>
            
            {/* Active Users Dialog */}
            <Dialog open={showActiveUsers} onClose={() => setShowActiveUsers(false)} maxWidth="md" fullWidth>
                <DialogTitle>Currently Active Users</DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Email</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activeUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>
                                            <Chip label={user.role} size="small" />
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowActiveUsers(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            
            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Grid>
    );
};

export default NotificationPanel;
