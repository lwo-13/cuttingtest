// assets
import { IconDashboard, IconDeviceAnalytics, IconLayoutKanban } from '@tabler/icons';

// constant
const icons = {
    IconDashboard: IconDashboard,
    IconDeviceAnalytics
};

//-----------------------|| DASHBOARD MENU ITEMS ||-----------------------//

export const dashboard = {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    children: [
        {
            id: 'default',
            title: 'KPI Dashboard',
            type: 'item',
            url: '/dashboard/default',
            icon: icons['IconDashboard'],
            breadcrumbs: false
        },
        {
            id: 'kanban',
            title: 'Board',
            type: 'item',
            url: '/dashboard/kanbanboard',
            icon: IconLayoutKanban,
            breadcrumbs: false
        }
    ]
};