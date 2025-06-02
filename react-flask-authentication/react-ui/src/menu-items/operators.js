// assets
import { IconUsers } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| OPERATORS MENU ITEMS ||-----------------------//

const operators = {
  id: 'operators',
  title: i18n.t('operators.title'),
  type: 'group',
  children: [
    {
      id: 'spreader-operator-management',
      title: i18n.t('operators.spreaderOperators'),
      type: 'item',
      url: '/operators/spreader-management',
      icon: IconUsers,
      breadcrumbs: false
    },
    {
      id: 'cutter-operator-management',
      title: i18n.t('operators.cutterOperators'),
      type: 'item',
      url: '/operators/cutter-management',
      icon: IconUsers,
      breadcrumbs: false
    }
  ]
};

export default operators;
