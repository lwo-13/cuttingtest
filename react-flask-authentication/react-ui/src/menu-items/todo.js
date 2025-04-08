// assets
import { IconZoomCheck, IconChartPie3 } from '@tabler/icons';

//-----------------------|| TO DO MENU ITEMS ||-----------------------//

const todo = {
  id: 'to-do-lists',
  title: 'To Do Lists',
  type: 'group',
  children: [
    {
      id: 'italian_ratio',
      title: 'Italian Ratios', 
      type: 'item',  
      url: '/to-do-lists/italian-ratio',
      icon: IconChartPie3, 
      breadcrumbs: false,
      badgeContent: 0
  }
  ]
};

export default todo;