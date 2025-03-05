// assets
import { IconFileUpload, IconPrinter } from '@tabler/icons';

//-----------------------|| Import & Print Tools MENU ITEMS ||-----------------------//

const importPrintTools = {
  id: 'import-print-tools',
  title: 'Import & Print Tools',
  type: 'group',
  children: [
    {
      id: 'imports',           // Unique ID for your page
      title: 'Imports',         // Label in the sidebar
      type: 'item',                 // It's a single link
      url: '/import-print-tools/imports', // URL route (adjust as needed)
      icon: IconFileUpload,    // Choose your icon
      breadcrumbs: false
    },
    {
        id: 'print',           // Unique ID for your page
        title: 'Print',         // Label in the sidebar
        type: 'item',                 // It's a single link
        url: '/import-print-tools/print', // URL route (adjust as needed)
        icon: IconPrinter,    // Choose your icon
        breadcrumbs: false
    }
  ]
};

export default importPrintTools;
