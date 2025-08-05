// assets
import { IconClipboardList, IconRuler2, IconTool } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| SUBCONTRACTOR MENU ITEMS ||-----------------------//

const subcontractor = {
  id: 'subcontractor',
  title: i18n.t('subcontractor.menu', 'Subcontractor Menu'),
  type: 'group',
  children: [
    {
      id: 'subcontractor-view',
      title: i18n.t('subcontractor.orderMattressPlan', 'Order Mattress Plan'),
      type: 'item',
      url: '/subcontractor/view',
      icon: IconClipboardList,
      breadcrumbs: false
    },
    {
      id: 'subcontractor-marker-requests',
      title: i18n.t('subcontractor.markerRequests', 'Marker Requests'),
      type: 'item',
      url: '/to-do-lists/marker-requests',
      icon: IconRuler2,
      breadcrumbs: false
    },
    {
      id: 'subcontractor-width-change-requests',
      title: i18n.t('subcontractor.widthChangeRequests', 'Width Change Requests'),
      type: 'item',
      url: '/to-do-lists/subcontractor-width-change-approvals',
      icon: IconTool,
      breadcrumbs: false
    }
  ]
};

export default subcontractor;
