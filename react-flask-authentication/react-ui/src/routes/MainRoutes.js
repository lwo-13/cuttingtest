import React, { lazy } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

// project imports
import MainLayout from './../layout/MainLayout';
import MinimalLayout from './../layout/MinimalLayout';
import HeaderOnlyLayout from './../layout/HeaderOnlyLayout';
import Loadable from '../ui-component/Loadable';
import AuthGuard from './../utils/route-guard/AuthGuard';
import RoleGuard from './../utils/route-guard/RoleGuard';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('../views/dashboard/Default')));
const KpiAllCuttingRooms = Loadable(lazy(() => import('../views/dashboard/KpiAllCuttingRooms')));
const KpiZalli = Loadable(lazy(() => import('../views/dashboard/KpiZalli')));
const ConsumptionAnalytics = Loadable(lazy(() => import('../views/dashboard/ConsumptionAnalytics')));
const OrderReport = Loadable(lazy(() => import('../views/dashboard/orderreport')));

// planning routing
const KanbanBoard = Loadable(lazy(() => import('../views/planning/kanbanboard')));
const OrderPlanning = Loadable(lazy(() => import('../views/planning/orderplanning')));

// to do lists routing
const ItalianRatio = Loadable(lazy(() => import('../views/to-do-lists/italian_ratio')));
const WidthValidation = Loadable(lazy(() => import('../views/to-do-lists/width_validation')));
const WidthChangeApprovals = Loadable(lazy(() => import('../views/to-do-lists/width_change_approvals')));
const SubcontractorWidthChangeApprovals = Loadable(lazy(() => import('../views/to-do-lists/subcontractor_width_change_approvals')));
const MarkerRequests = Loadable(lazy(() => import('../views/to-do-lists/marker_requests')));

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

// network diagnostics
const NetworkDiagnostics = Loadable(lazy(() => import('../components/NetworkDiagnostics')));

// spreader routing
const SpreaderView = Loadable(lazy(() => import('../views/operators_view/spreaderView')));

// cutter routing
const CutterView = Loadable(lazy(() => import('../views/operators_view/cutterView')));

// subcontractor routing
const SubcontractorView = Loadable(lazy(() => import('../views/subcontractor/subcontractorView')));

// logistic routing
const LogisticView = Loadable(lazy(() => import('../views/logistic/logisticView')));

// collaretto ops routing
const CollarettoOpsCreate = Loadable(lazy(() => import('../views/collaretto-ops/create')));
const CollarettoOpsReprint = Loadable(lazy(() => import('../views/collaretto-ops/reprint')));
const CollarettoOpsDelete = Loadable(lazy(() => import('../views/collaretto-ops/delete')));

// operators routing
const SpreaderOperatorManagement = Loadable(lazy(() => import('../views/operators/spreaderOperatorManagement')));
const CutterOperatorManagement = Loadable(lazy(() => import('../views/operators/cutterOperatorManagement')));

//-----------------------|| MAIN ROUTING ||-----------------------//

const MainRoutes = () => {
    const location = useLocation();

    return (
        <Switch>
            {/* Collaretto Ops routes for Logistic users */}
            <Route path="/collaretto-ops/create">
                <MainLayout>
                    <AuthGuard>
                        <RoleGuard allowedRoles={['Logistic']}>
                            <CollarettoOpsCreate />
                        </RoleGuard>
                    </AuthGuard>
                </MainLayout>
            </Route>

            <Route path="/collaretto-ops/reprint">
                <MainLayout>
                    <AuthGuard>
                        <RoleGuard allowedRoles={['Logistic']}>
                            <CollarettoOpsReprint />
                        </RoleGuard>
                    </AuthGuard>
                </MainLayout>
            </Route>

            <Route path="/collaretto-ops/delete">
                <MainLayout>
                    <AuthGuard>
                        <RoleGuard allowedRoles={['Logistic']}>
                            <CollarettoOpsDelete />
                        </RoleGuard>
                    </AuthGuard>
                </MainLayout>
            </Route>
            <Route
                path={[
                    '/dashboard/default',
                    '/dashboard/zalli',
                    '/dashboard/consumption-analytics',
                    '/dashboard/orderreport',

                    '/planning/kanbanboard',
                    '/planning/orderplanning',

                    '/to-do-lists/italian-ratio',
                    '/to-do-lists/width-validation',
                    '/to-do-lists/width-change-approvals',
                    '/to-do-lists/subcontractor-width-change-approvals',
                    '/to-do-lists/marker-requests',

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
                    '/network-diagnostics',

                    '/operators/spreader-management',
                    '/operators/cutter-management'
                ]}
            >
                <MainLayout>
                    <Switch location={location} key={location.pathname}>
                        <AuthGuard>
                            <Route path="/dashboard/default" component={KpiAllCuttingRooms} />
                            <Route path="/dashboard/zalli" component={KpiZalli} />
                            <Route path="/dashboard/consumption-analytics" component={ConsumptionAnalytics} />
                            <Route path="/dashboard/orderreport" component={OrderReport} />

                            <Route path="/planning/kanbanboard" component={KanbanBoard} />
                            <Route path="/planning/orderplanning" component={OrderPlanning} />

                            <Route path="/to-do-lists/italian-ratio" component={ItalianRatio} />
                            <Route path="/to-do-lists/width-validation" component={WidthValidation} />
                            <Route path="/to-do-lists/width-change-approvals" component={WidthChangeApprovals} />
                            <Route path="/to-do-lists/subcontractor-width-change-approvals" component={SubcontractorWidthChangeApprovals} />
                            <Route path="/to-do-lists/marker-requests" component={MarkerRequests} />

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
                            <Route path="/network-diagnostics" component={NetworkDiagnostics} />



                            <Route path="/operators/spreader-management">
                                <RoleGuard allowedRoles={['Administrator', 'Manager', 'Project Admin']}>
                                    <SpreaderOperatorManagement />
                                </RoleGuard>
                            </Route>

                            <Route path="/operators/cutter-management">
                                <RoleGuard allowedRoles={['Administrator', 'Manager', 'Project Admin']}>
                                    <CutterOperatorManagement />
                                </RoleGuard>
                            </Route>
                        </AuthGuard>
                    </Switch>
                </MainLayout>
            </Route>

            {/* Spreader route with HeaderOnlyLayout (header but no sidebar) */}
            <Route path="/spreader/view">
                <HeaderOnlyLayout>
                    <AuthGuard>
                        <RoleGuard allowedRoles={['Spreader']}>
                            <SpreaderView />
                        </RoleGuard>
                    </AuthGuard>
                </HeaderOnlyLayout>
            </Route>

            {/* Cutter route with HeaderOnlyLayout (header but no sidebar) */}
            <Route path="/cutter/view">
                <HeaderOnlyLayout>
                    <AuthGuard>
                        <RoleGuard allowedRoles={['Cutter']}>
                            <CutterView />
                        </RoleGuard>
                    </AuthGuard>
                </HeaderOnlyLayout>
            </Route>

            {/* Subcontractor route with MainLayout (full layout with sidebar) */}
            <Route path="/subcontractor/view">
                <MainLayout>
                    <AuthGuard>
                        <RoleGuard allowedRoles={['Subcontractor']}>
                            <SubcontractorView />
                        </RoleGuard>
                    </AuthGuard>
                </MainLayout>
            </Route>

            {/* Logistic route with MainLayout (full layout with sidebar) */}
            <Route path="/logistic/view">
                <MainLayout>
                    <AuthGuard>
                        <RoleGuard allowedRoles={['Logistic']}>
                            <LogisticView />
                        </RoleGuard>
                    </AuthGuard>
                </MainLayout>
            </Route>


        </Switch>
    );
};

export default MainRoutes;
