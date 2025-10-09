// assets
import { IconDashboard, IconDeviceAnalytics, IconListCheck, IconChartBar, IconClipboardList, IconClipboardCheck, IconBuilding, IconBuildingFactory } from '@tabler/icons';
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
            type: 'collapse',
            icon: IconDashboard,
            disabled: false, // Allow clicking to expand/collapse
            url: null, // No URL - prevents navigation
            children: [
                {
                    id: 'kpi-all-cutting-rooms',
                    title: 'All Cutting Rooms',
                    type: 'item',
                    url: '/dashboard/default',
                    icon: IconBuildingFactory,
                    breadcrumbs: false
                },
                {
                    id: 'kpi-zalli',
                    title: 'Zalli',
                    type: 'item',
                    url: '/dashboard/zalli',
                    icon: IconBuilding,
                    breadcrumbs: false
                }
            ]
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
            type: 'collapse',
            icon: IconListCheck,
            disabled: false, // Allow clicking to expand/collapse
            url: null, // No URL - prevents navigation
            children: [
                {
                    id: 'orderreport-open',
                    title: i18n.t('sidebar.openOrders', 'Open Orders'),
                    type: 'item',
                    url: '/dashboard/orderreport?type=open',
                    icon: IconClipboardList,
                    breadcrumbs: false
                },
                {
                    id: 'orderreport-closed',
                    title: i18n.t('sidebar.closedOrders', 'Closed Orders'),
                    type: 'item',
                    url: '/dashboard/orderreport?type=closed',
                    icon: IconClipboardCheck,
                    breadcrumbs: false
                }
            ]
        }

    ]
};