// assets
import { IconClipboardList } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| SUBCONTRACTOR MENU ITEMS ||-----------------------//

const subcontractor = {
  id: 'subcontractor',
  title: '', // Empty title to hide the group header
  type: 'group',
  children: [
    {
      id: 'subcontractor-view',
      title: 'Order Mattress Plan',
      type: 'item',
      url: '/subcontractor/view',
      icon: IconClipboardList,
      breadcrumbs: false
    }
  ]
};

export default subcontractor;
