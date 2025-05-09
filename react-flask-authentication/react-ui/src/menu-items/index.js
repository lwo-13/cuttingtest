import { dashboard } from './dashboard';
import importPrintTools from './importPrintTools';
import tables from './tables';
import todo from './todo';
import planning from './planning';
import spreader from './spreader';
import operators from './operators';
import { utilities } from './utilities';
import { other } from './other';

//-----------------------|| MENU ITEMS ||-----------------------//

const menuItems = {
    items: [dashboard, planning, todo, tables, importPrintTools, spreader, operators]
};

export default menuItems;
