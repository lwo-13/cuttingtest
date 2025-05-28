// assets
import { IconDashboard, IconDeviceAnalytics, IconListCheck } from '@tabler/icons';

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
            icon: IconDashboard,
            breadcrumbs: false
        },
        {
            id: 'orderreport',
            title: 'Order Report',
            type: 'item',
            url: '/dashboard/orderreport',
            icon: IconListCheck,
            breadcrumbs: false
        }

    ]
};