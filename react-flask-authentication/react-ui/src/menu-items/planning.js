// assets
import { IconLayoutKanban, IconTemplate  } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| PLANNING MENU ITEMS ||-----------------------//

const planning = {
  id: 'planning',
  title: i18n.t('sidebar.planning'),
  type: 'group',
  children: [
    {
        id: 'kanban',
        title: i18n.t('sidebar.board'),
        type: 'item',
        url: '/planning/kanbanboard',
        icon: IconLayoutKanban,
        breadcrumbs: false
    },
    {
      id: 'orderplanning',
      title: i18n.t('sidebar.orderPlanning'),
      type: 'item',
      url: '/planning/orderplanning',
      icon: IconTemplate,
      breadcrumbs: false
    }
  ]
};

export default planning;