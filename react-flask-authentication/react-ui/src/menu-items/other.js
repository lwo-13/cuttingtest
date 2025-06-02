// assets
import { IconBrandChrome, IconHelp, IconSitemap } from '@tabler/icons';
import i18n from '../i18n';

// constant
const icons = {
    IconBrandChrome: IconBrandChrome,
    IconHelp: IconHelp,
    IconSitemap: IconSitemap
};

//-----------------------|| SAMPLE PAGE & DOCUMENTATION MENU ITEMS ||-----------------------//

export const other = {
    id: 'sample-docs-roadmap',
    type: 'group',
    children: [
        {
            id: 'sample-page',
            title: i18n.t('menu.samplePage'),
            type: 'item',
            url: '/sample-page',
            icon: icons['IconBrandChrome'],
            breadcrumbs: false
        },
        {
            id: 'documentation',
            title: i18n.t('menu.documentation'),
            type: 'item',
            url: 'https://docs.appseed.us/products/react/flask-berry-dashboard',
            icon: icons['IconHelp'],
            external: true,
            target: true
        }
    ]
};
