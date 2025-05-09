// assets
import { IconUsers } from '@tabler/icons';

//-----------------------|| OPERATORS MENU ITEMS ||-----------------------//

const operators = {
  id: 'operators',
  title: 'Operators',
  type: 'group',
  children: [
    {
      id: 'operator-management',
      title: 'Spreader Operators',
      type: 'item',
      url: '/operators/management',
      icon: IconUsers,
      breadcrumbs: false
    }
  ]
};

export default operators;
