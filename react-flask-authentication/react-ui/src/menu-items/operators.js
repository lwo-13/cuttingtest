// assets
import { IconUsers } from '@tabler/icons';

//-----------------------|| OPERATORS MENU ITEMS ||-----------------------//

const operators = {
  id: 'operators',
  title: 'Operators',
  type: 'group',
  children: [
    {
      id: 'spreader-operator-management',
      title: 'Spreader Operators',
      type: 'item',
      url: '/operators/spreader-management',
      icon: IconUsers,
      breadcrumbs: false
    },
    {
      id: 'cutter-operator-management',
      title: 'Cutter Operators',
      type: 'item',
      url: '/operators/cutter-management',
      icon: IconUsers,
      breadcrumbs: false
    }
  ]
};

export default operators;
