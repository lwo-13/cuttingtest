// assets
import { IconLayoutKanban, IconTemplate  } from '@tabler/icons';

//-----------------------|| PLANNING MENU ITEMS ||-----------------------//

const planning = {
  id: 'planning',
  title: 'Planning',
  type: 'group',
  children: [
    {
        id: 'kanban',
        title: 'Board',
        type: 'item',
        url: '/planning/kanbanboard',
        icon: IconLayoutKanban,
        breadcrumbs: false
    },
    {
      id: 'orderplanning',
      title: 'Order Planning',
      type: 'item',
      url: '/planning/orderplanning',
      icon: IconTemplate,
      breadcrumbs: false
    }
  ]
};

export default planning;