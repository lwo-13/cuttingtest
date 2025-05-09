// assets
import { IconList, IconLayoutKanban } from '@tabler/icons';

//-----------------------|| SPREADER MENU ITEMS ||-----------------------//

const spreader = {
  id: 'spreader',
  title: 'Spreader',
  type: 'group',
  children: [
    {
      id: 'spreader-view',
      title: 'My Assignments',
      type: 'item',
      url: '/spreader/view',
      icon: IconLayoutKanban,
      breadcrumbs: false
    }
  ]
};

export default spreader;
