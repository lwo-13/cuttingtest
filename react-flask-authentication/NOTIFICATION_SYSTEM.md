# Admin Notification System

This document describes the new admin notification system that allows administrators to send system-wide notifications to active users, particularly useful for notifying users to save their work before system restarts.

## Features

### Backend Features
- **System Notifications API**: RESTful API for managing system notifications
- **Role-based Access**: Only administrators, managers, and project admins can send notifications
- **Real-time Delivery**: Server-Sent Events (SSE) for real-time notification delivery
- **Flexible Targeting**: Send notifications to all users or specific roles
- **Priority Levels**: Support for low, normal, high, and critical priority notifications
- **Expiration**: Notifications can have expiration times
- **Read Tracking**: Track which users have read notifications

### Frontend Features
- **Admin Panel**: Dedicated interface for sending and managing notifications
- **Global Alerts**: System-wide notification display with priority-based positioning
- **Real-time Updates**: Automatic notification updates via SSE
- **Quick Templates**: Pre-configured templates for common scenarios (e.g., restart warnings)
- **Active User Monitoring**: View currently active users in the system

## Usage

### For Administrators

1. **Access the Notification Panel**:
   - Navigate to "Administration" → "System Notifications" in the sidebar
   - Only visible to users with Administrator, Manager, or Project Admin roles

2. **Send a Restart Warning**:
   - Click "Quick: Restart Warning" button for a pre-filled restart notification
   - Customize the message and timing as needed
   - Click "Send Notification"

3. **Send Custom Notifications**:
   - Fill in the notification title and message
   - Select notification type (info, warning, error, success)
   - Choose priority level (low, normal, high, critical)
   - Set expiration time in minutes
   - Optionally target specific user roles
   - Click "Send Notification"

4. **Monitor Active Users**:
   - View the count of active users in the right panel
   - Click "View Active Users" to see detailed list with usernames, roles, and emails

5. **Manage Active Notifications**:
   - View all active system notifications in the table
   - Dismiss notifications by clicking the trash icon

### For Regular Users

1. **Receiving Notifications**:
   - Critical and high-priority notifications appear as persistent alerts at the top of the screen
   - Normal and low-priority notifications appear as snackbars in the bottom-right
   - Critical notifications may include an audio alert

2. **Dismissing Notifications**:
   - Click the "X" button on alerts to dismiss them
   - Dismissed notifications are marked as read and won't reappear

## API Endpoints

### Send Notification (Admin Only)
```
POST /api/notifications/send
```
**Body:**
```json
{
    "title": "System Restart Imminent",
    "message": "The system will be restarted in 15 minutes...",
    "notification_type": "warning",
    "priority": "critical",
    "expires_in_minutes": 20,
    "target_roles": ["Planner", "Spreader"]
}
```

### Get Active Notifications
```
GET /api/notifications/active
```

### Mark Notification as Read
```
POST /api/notifications/mark_read/{notification_id}
```

### Dismiss Notification (Admin Only)
```
POST /api/notifications/dismiss/{notification_id}
```

### Get Active Users (Admin Only)
```
GET /api/notifications/active_users
```

### Real-time Stream
```
GET /api/notifications/stream
```
Server-Sent Events endpoint for real-time notifications.

## Database Schema

### system_notifications
- `id`: Primary key
- `title`: Notification title
- `message`: Notification content
- `notification_type`: Type (info, warning, error, success)
- `priority`: Priority level (low, normal, high, critical)
- `created_by`: User ID who created the notification
- `created_at`: Creation timestamp
- `expires_at`: Expiration timestamp (optional)
- `is_active`: Whether notification is active
- `target_roles`: JSON array of target roles (optional)

### user_notification_read
- `id`: Primary key
- `user_id`: User who read the notification
- `notification_id`: Notification that was read
- `read_at`: Timestamp when read

## Implementation Details

### Real-time Communication
- Uses Server-Sent Events (SSE) for real-time notification delivery
- Automatic reconnection on connection loss
- Polls for new notifications every 5 seconds
- Includes authentication via JWT tokens

### Priority Handling
- **Critical**: Persistent alert at top of screen, audio notification
- **High**: Persistent alert below critical notifications
- **Normal**: Snackbar notification (auto-dismiss after 6 seconds)
- **Low**: Snackbar notification (auto-dismiss after 6 seconds)

### Role-based Access
- **Send notifications**: Administrator, Manager, Project Admin
- **Receive notifications**: All authenticated users (filtered by target_roles if specified)
- **View active users**: Administrator, Manager, Project Admin
- **Dismiss notifications**: Administrator, Manager, Project Admin

## Security Considerations

- All notification endpoints require authentication
- Admin-only endpoints check user roles
- SSE stream validates JWT tokens
- No sensitive information should be included in notifications
- Notifications are stored in database and may be audited

## Troubleshooting

### Notifications Not Appearing
1. Check if user is authenticated
2. Verify notification hasn't expired
3. Check if user role matches target_roles (if specified)
4. Ensure SSE connection is established (check browser console)

### SSE Connection Issues
1. Check JWT token validity
2. Verify CORS settings allow SSE
3. Check network connectivity
4. Look for browser console errors

### Admin Panel Not Visible
1. Verify user has Administrator, Manager, or Project Admin role
2. Check if admin menu items are properly configured
3. Ensure user is authenticated

## Future Enhancements

- Email notifications for critical alerts
- Push notifications for mobile devices
- Notification templates and scheduling
- Advanced targeting (specific users, departments)
- Notification analytics and reporting
- Integration with external alerting systems
