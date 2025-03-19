// assets
import { IconClipboardList, IconLayoutCollage, IconTemplate, IconBrandAppleArcade } from '@tabler/icons';

//-----------------------|| TABLES MENU ITEMS ||-----------------------//

const tables = {
  id: 'tables',
  title: 'Tables',
  type: 'group',
  children: [
    {
        id: 'orders',
        title: 'Orders',
        type: 'item',
        url: '/tables/orders',
        icon: IconClipboardList,
        breadcrumbs: false
    },
    {
      id: 'markerdb',           // Unique ID for your page
      title: 'Marker Database',         // Label in the sidebar
      type: 'item',                 // It's a single link
      url: '/tables/markerdb', // URL route (adjust as needed)
      icon: IconLayoutCollage,    // Choose your icon
      breadcrumbs: false
    },
    {
      id: 'orderplanning',           // Unique ID for your page
      title: 'Order Planning',         // Label in the sidebar
      type: 'item',                 // It's a single link
      url: '/tables/orderplanning', // URL route (adjust as needed)
      icon: IconTemplate,    // Choose your icon
      breadcrumbs: false
    },
    {
      id: 'padprints',
      title: 'Pad Prints',
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