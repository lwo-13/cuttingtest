// assets
import { IconSettings, IconUsers } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| CONFIGURATION MENU ITEMS ||-----------------------//

const configuration = {
  id: 'configuration',
  title: 'Configuration',
  type: 'group',
  children: [
    {
      id: 'configuration-dashboard',
      title: 'Configuration',
      type: 'item',
      url: '/configuration',
      icon: IconSettings,
      breadcrumbs: false
    }
  ]
};

export default configuration;

