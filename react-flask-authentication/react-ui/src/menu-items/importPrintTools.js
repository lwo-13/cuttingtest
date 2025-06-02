// assets
import { IconFileUpload, IconPrinter } from '@tabler/icons';
import i18n from '../i18n';

//-----------------------|| Import & Print Tools MENU ITEMS ||-----------------------//

const importPrintTools = {
  id: 'import-print-tools',
  title: i18n.t('sidebar.importPrintTools'),
  type: 'group',
  children: [
    {
      id: 'imports',           // Unique ID for your page
      title: i18n.t('sidebar.imports'),         // Label in the sidebar
      type: 'item',                 // It's a single link
      url: '/import-print-tools/imports', // URL route (adjust as needed)
      icon: IconFileUpload,    // Choose your icon
      breadcrumbs: false
    },
    {
        id: 'print',           // Unique ID for your page
        title: i18n.t('sidebar.print'),         // Label in the sidebar
        type: 'item',                 // It's a single link
        url: '/import-print-tools/print', // URL route (adjust as needed)
        icon: IconPrinter,    // Choose your icon
        breadcrumbs: false
    }
  ]
};

export default importPrintTools;
