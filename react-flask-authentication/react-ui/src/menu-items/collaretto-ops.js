// assets
import { IconPlus, IconPrinter, IconTrash, IconListCheck } from '@tabler/icons';

// constant
const icons = { IconPlus, IconPrinter, IconTrash, IconListCheck };

// ==============================|| OPERATIONS MENU ITEMS ||============================== //

const operations = {
  id: 'operations',
  title: 'Operations',
  type: 'group',
  children: [
    {
      id: 'collaretto-operations',
      title: 'Collaretto',
      type: 'collapse',
      icon: icons.IconListCheck,
      children: [
        {
          id: 'collaretto-create',
          title: 'Create',
          type: 'item',
          url: '/collaretto-ops/create',
          icon: icons.IconPlus,
          breadcrumbs: false
        },
        {
          id: 'collaretto-reprint',
          title: 'Reprint',
          type: 'item',
          url: '/collaretto-ops/reprint',
          icon: icons.IconPrinter,
          breadcrumbs: false
        },
        {
          id: 'collaretto-delete',
          title: 'Delete',
          type: 'item',
          url: '/collaretto-ops/delete',
          icon: icons.IconTrash,
          breadcrumbs: false
        }
      ]
    }
  ]
};

export default operations;
