// assets
import { IconDashboard, IconDeviceAnalytics, IconListCheck, IconChartBar } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| DASHBOARD MENU ITEMS ||-----------------------//

export const dashboard = {
    id: 'dashboard',
    title: i18n.t('sidebar.dashboard'),
    type: 'group',
    children: [
        {
            id: 'default',
            title: i18n.t('sidebar.kpiDashboard'),
            type: 'item',
            url: '/dashboard/default',
            icon: IconDashboard,
            breadcrumbs: false
        },
        {
            id: 'consumption-analytics',
            title: i18n.t('sidebar.consumptionAnalytics'),
            type: 'item',
            url: '/dashboard/consumption-analytics',
            icon: IconChartBar,
            breadcrumbs: false
        },
        {
            id: 'orderreport',
            title: i18n.t('sidebar.orderReport', 'Order Report'),
            type: 'item',
            url: '/dashboard/orderreport',
            icon: IconListCheck,
            breadcrumbs: false
        }

    ]
};