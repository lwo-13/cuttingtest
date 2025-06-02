// assets
import { IconList, IconLayoutKanban } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| CUTTER MENU ITEMS ||-----------------------//

const cutter = {
  id: 'cutter',
  title: i18n.t('cutter.title'),
  type: 'group',
  children: [
    {
      id: 'cutter-view',
      title: i18n.t('cutter.myAssignments'),
      type: 'item',
      url: '/cutter/view',
      icon: IconLayoutKanban,
      breadcrumbs: false
    }
  ]
};

export default cutter;
