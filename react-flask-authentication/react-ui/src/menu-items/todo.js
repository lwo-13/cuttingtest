// assets
import { IconZoomCheck, IconChartPie3 } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| TO DO MENU ITEMS ||-----------------------//

const todo = {
  id: 'to-do-lists',
  title: i18n.t('sidebar.todoLists', 'To Do Lists'),
  type: 'group',
  children: [
    {
      id: 'italian_ratio',
      title: i18n.t('sidebar.italianRatios', 'Italian Ratios'),
      type: 'item',
      url: '/to-do-lists/italian-ratio',
      icon: IconChartPie3,
      breadcrumbs: false,
      badgeContent: 0
  }
  ]
};

export default todo;