// assets
import { IconClipboardList, IconLayout, IconTemplate } from '@tabler/icons';

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
      icon: IconLayout,    // Choose your icon
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
  ]
};

export default tables;