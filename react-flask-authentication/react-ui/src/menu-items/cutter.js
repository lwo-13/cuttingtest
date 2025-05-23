// assets
import { IconList, IconLayoutKanban } from '@tabler/icons';

//-----------------------|| CUTTER MENU ITEMS ||-----------------------//

const cutter = {
  id: 'cutter',
  title: 'Cutter',
  type: 'group',
  children: [
    {
      id: 'cutter-view',
      title: 'My Assignments',
      type: 'item',
      url: '/cutter/view',
      icon: IconLayoutKanban,
      breadcrumbs: false
    }
  ]
};

export default cutter;
