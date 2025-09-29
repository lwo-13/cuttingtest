// assets
import { IconListCheck } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| LOGISTIC MENU ITEMS ||-----------------------//

const logistic = {
  id: 'logistic',
  title: '', // Empty title to hide the group header
  type: 'group',
  children: [
    {
      id: 'logistic-view',
      title: 'Collaretto Plan',
      type: 'item',
      url: '/logistic/view',
      icon: IconListCheck,
      breadcrumbs: false
    }
  ]
};

export default logistic;
