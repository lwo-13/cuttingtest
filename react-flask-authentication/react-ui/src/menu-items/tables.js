// assets
import { IconClipboardList, IconLayoutCollage, IconBrandAppleArcade, IconSquareRoundedCheck } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| TABLES MENU ITEMS ||-----------------------//

const tables = {
  id: 'tables',
  title: i18n.t('sidebar.tables'),
  type: 'group',
  children: [
    {
        id: 'orders',
        title: i18n.t('sidebar.orders'),
        type: 'item',
        url: '/tables/orders',
        icon: IconClipboardList,
        breadcrumbs: false
    },
    {
      id: 'markerdb',           // Unique ID for your page
      title: i18n.t('sidebar.markerDatabase'),         // Label in the sidebar
      type: 'item',                 // It's a single link
      url: '/tables/markerdb', // URL route (adjust as needed)
      icon: IconLayoutCollage,    // Choose your icon
      breadcrumbs: false
    },
    {
      id: 'padprints',
      title: i18n.t('sidebar.padPrints'),
      type: 'collapse',
      icon: IconBrandAppleArcade,
      children: [
        {
          id: 'calzedonia-padprint',
          title: 'Calzedonia',
          type: 'item',
          url: '/tables/padprints/calzedonia',
          breadcrumbs: false
        },
        {
          id: 'falconeri-padprint',
          title: 'Falconeri',
          type: 'item',
          url: '/tables/padprints/falconeri',
          breadcrumbs: false
        },
        {
          id: 'intimissimi-padprint',
          title: 'Intimissimi',
          type: 'item',
          url: '/tables/padprints/intimissimi',
          breadcrumbs: false
        },
        {
          id: 'tezenis-padprint',
          title: 'Tezenis',
          type: 'item',
          url: '/tables/padprints/tezenis',
          breadcrumbs: false
        }
      ]
    }
  ]
};

export default tables;