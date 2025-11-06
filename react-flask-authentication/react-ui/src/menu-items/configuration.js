// assets
import { IconSettings } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| CONFIGURATION MENU ITEMS ||-----------------------//

const configuration = {
  id: 'configuration',
  title: 'Configuration',
  type: 'group',
  children: [
    {
      id: 'production-center-config',
      title: 'Production Centers',
      type: 'item',
      url: '/configuration/production-centers',
      icon: IconSettings,
      breadcrumbs: false
    }
  ]
};

export default configuration;

