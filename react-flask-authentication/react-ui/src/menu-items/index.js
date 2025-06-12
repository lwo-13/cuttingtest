import { dashboard } from './dashboard';
import importPrintTools from './importPrintTools';
import tables from './tables';
import todo from './todo';
import planning from './planning';
import spreader from './spreader';
import cutter from './cutter';
import subcontractor from './subcontractor';
import operators from './operators';
import { utilities } from './utilities';
import { other } from './other';

//-----------------------|| MENU ITEMS ||-----------------------//

const menuItems = {
    items: [dashboard, planning, todo, tables, importPrintTools, spreader, cutter, subcontractor, operators]
};

export default menuItems;
