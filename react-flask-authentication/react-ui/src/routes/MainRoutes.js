import React, { lazy } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

// project imports
import MainLayout from './../layout/MainLayout';
import Loadable from '../ui-component/Loadable';
import AuthGuard from './../utils/route-guard/AuthGuard';
import RoleGuard from './../utils/route-guard/RoleGuard';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('../views/dashboard/Default')));

// planning routing
const KanbanBoard = Loadable(lazy(() => import('../views/planning/kanbanboard')));
const OrderPlanning = Loadable(lazy(() => import('../views/planning/orderplanning')));

// to do lists routing
const ItalianRatio = Loadable(lazy(() => import('../views/to-do-lists/italian_ratio')));

// tables routing
const Orders = Loadable(lazy(() => import('../views/tables/orders')));
const MarkerDB = Loadable(lazy(() => import('../views/tables/markerdb')));
const PadPrints = Loadable(lazy(() => import('../views/tables/padprints')));

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

// spreader routing
const SpreaderView = Loadable(lazy(() => import('../views/spreader/spreaderView')));

//-----------------------|| MAIN ROUTING ||-----------------------//

const MainRoutes = () => {
    const location = useLocation();

    return (
        <Route
            path={[
                '/dashboard/default',

                '/planning/kanbanboard',
                '/planning/orderplanning',

                '/to-do-lists/italian-ratio',

                '/tables/orders',
                '/tables/markerdb',

                '/tables/padprints/:brand',
                '/import-print-tools/imports',
                '/import-print-tools/print',

                '/utils/util-typography',
                '/utils/util-color',
                '/utils/util-shadow',
                '/icons/tabler-icons',
                '/icons/material-icons',

                '/sample-page',

                '/spreader/view'
            ]}
        >
            <MainLayout>
                <Switch location={location} key={location.pathname}>
                    <AuthGuard>
                        <Route path="/dashboard/default" component={DashboardDefault} />

                        <Route path="/planning/kanbanboard" component={KanbanBoard} />
                        <Route path="/planning/orderplanning" component={OrderPlanning} />

                        <Route path="/to-do-lists/italian-ratio" component={ItalianRatio} />

                        <Route path="/tables/orders" component={Orders} />
                        <Route path="/tables/markerdb" component={MarkerDB} />
                        <Route path="/tables/padprints/:brand" component={PadPrints}/>

                        <Route path="/import-print-tools/imports" component={Imports} />
                        <Route path="/import-print-tools/print" component={Print} />

                        <Route path="/utils/util-typography" component={UtilsTypography} />
                        <Route path="/utils/util-color" component={UtilsColor} />
                        <Route path="/utils/util-shadow" component={UtilsShadow} />
                        <Route path="/icons/tabler-icons" component={UtilsTablerIcons} />
                        <Route path="/icons/material-icons" component={UtilsMaterialIcons} />

                        <Route path="/sample-page" component={SamplePage} />

                        <Route path="/spreader/view">
                            <RoleGuard allowedRoles={['Spreader']}>
                                <SpreaderView />
                            </RoleGuard>
                        </Route>
                    </AuthGuard>
                </Switch>
            </MainLayout>
        </Route>
    );
};

export default MainRoutes;
