// assets
import { IconSettings, IconBell, IconUsers, IconShield } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| ADMIN MENU ITEMS ||-----------------------//

export const admin = {
    id: 'admin',
    title: i18n.t('sidebar.administration', 'Administration'),
    type: 'group',
    children: [
        {
            id: 'notification-panel',
            title: i18n.t('sidebar.notificationPanel', 'System Notifications'),
            type: 'item',
            url: '/admin/notifications',
            icon: IconBell,
            breadcrumbs: false
        }
    ]
};
