import React, { lazy } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

// project imports
import MainLayout from './../layout/MainLayout';
import Loadable from '../ui-component/Loadable';
import AuthGuard from './../utils/route-guard/AuthGuard';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('../views/dashboard/Default')));
const KanbanBoard = Loadable(lazy(() => import('../views/dashboard/kanbanboard')));

// tables routing
const Orders = Loadable(lazy(() => import('../views/tables/orders')));
const MarkerDB = Loadable(lazy(() => import('../views/tables/markerdb')));
const OrderPlanning = Loadable(lazy(() => import('../views/tables/orderplanning')));

// tools routing
const Imports = Loadable(lazy(() => import('../views/import-print-tools/imports')));
const Print = Loadable(lazy(() => import('../views/import-print-tools/print')));

// utilities routing
const UtilsTypography = Loadable(lazy(() => import('../views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('../views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('../views/utilities/Shadow')));
const UtilsMaterialIcons = Loadable(lazy(() => import('../views/utilities/MaterialIcons')));
const UtilsTablerIcons = Loadable(lazy(() => import('../views/utilities/TablerIcons')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('../views/sample-page')));

//-----------------------|| MAIN ROUTING ||-----------------------//

const MainRoutes = () => {
    const location = useLocation();

    return (
        <Route
            path={[
                '/dashboard/default',
                '/dashboard/kanbanboard',

                '/tables/orders',
                '/tables/markerdb',
                '/tables/orderplanning',

                '/import-print-tools/imports',
                '/import-print-tools/print',

                '/utils/util-typography',
                '/utils/util-color',
                '/utils/util-shadow',
                '/icons/tabler-icons',
                '/icons/material-icons',

                '/sample-page'
            ]}
        >
            <MainLayout>
                <Switch location={location} key={location.pathname}>
                    <AuthGuard>
                        <Route path="/dashboard/default" component={DashboardDefault} />
                        <Route path="/dashboard/kanbanboard" component={KanbanBoard} />

                        <Route path="/tables/orders" component={Orders} />
                        <Route path="/tables/markerdb" component={MarkerDB} />
                        <Route path="/tables/orderplanning" component={OrderPlanning} />

                        <Route path="/import-print-tools/imports" component={Imports} />
                        <Route path="/import-print-tools/print" component={Print} />

                        <Route path="/utils/util-typography" component={UtilsTypography} />
                        <Route path="/utils/util-color" component={UtilsColor} />
                        <Route path="/utils/util-shadow" component={UtilsShadow} />
                        <Route path="/icons/tabler-icons" component={UtilsTablerIcons} />
                        <Route path="/icons/material-icons" component={UtilsMaterialIcons} />

                        <Route path="/sample-page" component={SamplePage} />
                    </AuthGuard>
                </Switch>
            </MainLayout>
        </Route>
    );
};

export default MainRoutes;
