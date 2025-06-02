// assets
import { IconList, IconLayoutKanban } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| SPREADER MENU ITEMS ||-----------------------//

const spreader = {
  id: 'spreader',
  title: i18n.t('spreader.title'),
  type: 'group',
  children: [
    {
      id: 'spreader-view',
      title: i18n.t('spreader.myAssignments'),
      type: 'item',
      url: '/spreader/view',
      icon: IconLayoutKanban,
      breadcrumbs: false
    }
  ]
};

export default spreader;
