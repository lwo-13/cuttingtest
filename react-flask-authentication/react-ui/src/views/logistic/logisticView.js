import React, { useState, useEffect } from 'react';
import { Box, Table, TableBody, TableContainer, Paper, Typography, CircularProgress, Grid, TableHead, TableRow, TableCell, Divider, Button } from '@mui/material';
import axios from 'utils/axiosInstance';
import { useTranslation } from 'react-i18next';
import { Print } from '@mui/icons-material';

// UI Components
import MainCard from 'ui-component/cards/MainCard';

// Order Components
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';
import LogisticOrderToolbar from './components/LogisticOrderToolbar';
import ProductionCenterTabs from 'views/dashboard/OrderReport/ProductionCenterTabs';

// Collaretto Read-Only Components
import AlongGroupCardReadOnly from 'views/dashboard/OrderReport/AlongGroupCardReadOnly';
import AlongTableHeaderReadOnly from 'views/dashboard/OrderReport/AlongTableHeaderReadOnly';
import AlongRowReadOnly from 'views/dashboard/OrderReport/AlongRowReadOnly';
import AlongActionRowReadOnly from 'views/dashboard/OrderReport/AlongActionRowReadOnly';

import WeftGroupCardReadOnly from 'views/dashboard/OrderReport/WeftGroupCardReadOnly';
import WeftTableHeaderReadOnly from 'views/dashboard/OrderReport/WeftTableHeaderReadOnly';
import WeftRowReadOnly from 'views/dashboard/OrderReport/WeftRowReadOnly';
import WeftActionRowReadOnly from 'views/dashboard/OrderReport/WeftActionRowReadOnly';

import BiasGroupCardReadOnly from 'views/dashboard/OrderReport/BiasGroupCardReadOnly';
import BiasTableHeaderReadOnly from 'views/dashboard/OrderReport/BiasTableHeaderReadOnly';
import BiasRowReadOnly from 'views/dashboard/OrderReport/BiasRowReadOnly';
import BiasActionRowReadOnly from 'views/dashboard/OrderReport/BiasActionRowReadOnly';

// Comments & Summary Components
import OrderCommentCardReadOnly from 'views/dashboard/OrderReport/components/OrderCommentCardReadOnly';
import StyleCommentCardReadOnly from 'views/subcontractor/components/StyleCommentCardReadOnly';
import { getTablePlannedByBagno, getMetersByBagno } from 'views/dashboard/OrderReport/plannedQuantities';

// Hooks
import useLogisticOrderChange from './hooks/useLogisticOrderChange';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';

// Print utilities
import { useLogisticPrintStyles, handleLogisticPrint } from './utils/printUtils';

const LogisticView = () => {
    const { t } = useTranslation();

    // Initialize print styles
    useLogisticPrintStyles();

    // Order State
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderSizes, setOrderSizes] = useState([]);
    const [orderSizeNames, setOrderSizeNames] = useState([]);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [selectedColorCode, setSelectedColorCode] = useState('');

    // Production Center State
    const [selectedProductionCenter, setSelectedProductionCenter] = useState('');
    const [selectedCuttingRoom, setSelectedCuttingRoom] = useState('');
    const [selectedDestination, setSelectedDestination] = useState('');
    const [productionCenterCombinations, setProductionCenterCombinations] = useState([]);
    const [selectedCombination, setSelectedCombination] = useState(null);
    const [showProductionCenterTabs, setShowProductionCenterTabs] = useState(false);
    const [productionCenterLoading, setProductionCenterLoading] = useState(false);
    const [filteredCuttingRoom, setFilteredCuttingRoom] = useState('');
    const [filteredDestination, setFilteredDestination] = useState('');

    // Collaretto Tables State
    const [alongTables, setAlongTables] = useState([]);
    const [weftTables, setWeftTables] = useState([]);
    const [biasTables, setBiasTables] = useState([]);
    const [collarettoLoading, setCollarettoLoading] = useState(false);

    // Mattress Tables State
    const [mattressTables, setMattressTables] = useState([]);
    const [adhesiveTables, setAdhesiveTables] = useState([]);
    const [mattressLoading, setMattressLoading] = useState(false);

    // Hooks
    const { brand, fetchBrandForStyle, clearBrand } = useBrandInfo();

    // Utility function to sort sizes
    const sortSizes = (sizes) => {
        return sizes.sort((a, b) => {
            const sizeA = a.size;
            const sizeB = b.size;

            // Handle numeric sizes
            if (!isNaN(sizeA) && !isNaN(sizeB)) {
                return parseInt(sizeA) - parseInt(sizeB);
            }

            // Handle letter sizes
            const letterOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
            const indexA = letterOrder.indexOf(sizeA);
            const indexB = letterOrder.indexOf(sizeB);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }

            // Default alphabetical sort
            return sizeA.localeCompare(sizeB);
        });
    };

    // Filter tables based on selected production center combination (like Order Report)
    const getFilteredTables = (allTables, selectedCombination) => {
        console.log("🔍 Filtering tables:", {
            totalTables: allTables.length,
            selectedCombination,
            tables: allTables.map(t => ({ id: t.id, pc: t.productionCenter, cr: t.cuttingRoom, dest: t.destination }))
        });

        if (!selectedCombination) {
            console.log("✅ No combination selected, showing all", allTables.length, "tables");
            return allTables; // Show all if no combination selected
        }

        const filtered = allTables.filter(table => {
            // Show tables that match the selected combination
            const matchesSelectedCombination = (
                table.productionCenter === selectedCombination.production_center &&
                table.cuttingRoom === selectedCombination.cutting_room &&
                table.destination === selectedCombination.destination
            );

            // Show tables that don't have production center data yet
            const hasNoProductionCenter = (
                !table.productionCenter &&
                !table.cuttingRoom &&
                !table.destination
            );

            const shouldShow = matchesSelectedCombination || hasNoProductionCenter;
            console.log(`🔍 Table ${table.id}: matches=${matchesSelectedCombination}, noPC=${hasNoProductionCenter}, show=${shouldShow}`);

            return shouldShow;
        });

        console.log("✅ Filtered to", filtered.length, "tables");
        return filtered;
    };

    // Production Center Configuration Handler (for tabs)
    const handleCombinationChange = (combination) => {
        if (!combination) return;

        console.log('🔄 Production center combination changed:', combination);
        setSelectedCombination(combination);

        // Update production center display info
        setSelectedProductionCenter(combination.production_center || '');
        setSelectedCuttingRoom(combination.cutting_room);
        setSelectedDestination(combination.destination);
    };

    // Order Change Handler
    const { onOrderChange } = useLogisticOrderChange({
        setSelectedOrder,
        setOrderSizes,
        setOrderSizeNames,
        setSelectedStyle,
        setSelectedSeason,
        setSelectedColorCode,
        setSelectedProductionCenter,
        setSelectedCuttingRoom,
        setSelectedDestination,
        setProductionCenterCombinations,
        setSelectedCombination,
        setShowProductionCenterTabs,
        setFilteredCuttingRoom,
        setFilteredDestination,
        setProductionCenterLoading,
        productionCenterCombinations,
        fetchBrandForStyle,
        setAlongTables,
        setWeftTables,
        setBiasTables,
        setCollarettoLoading,
        setMattressTables,
        setAdhesiveTables,
        setMattressLoading,
        sortSizes,
        clearBrand
    });

    // Fetch orders assigned to PXE3 production center
    useEffect(() => {
        console.log("📊 Fetching orders for PXE3 production center...");

        // Get orders assigned to PXE3 production center (collaretto + mattress tables)
        axios.get('/collaretto/logistic/orders_by_production_center/PXE3')
            .then(ordersRes => {
                console.log("📊 Orders for PXE3 response:", ordersRes.data);

                if (!ordersRes.data.success) {
                    console.error("Failed to fetch orders for PXE3");
                    return;
                }

                const orderIds = ordersRes.data.data || [];
                const ordersArray = orderIds.map(item => ({
                    id: item.order_commessa,
                    style: '',
                    season: '',
                    colorCode: '',
                    sizes: []
                }));

                setOrders(ordersArray);
                console.log("📊 Logistic orders loaded:", ordersArray.length);
            })
            .catch(error => {
                console.error("Error fetching orders for PXE3:", error);
                setOrders([]);
            });
    }, []);

    // Helper function to render bagno summary tables
    const renderBagnoSummaryTables = (table) => {
        const { bagnoMap: plannedByBagno, bagnoOrder } = getTablePlannedByBagno(table);
        const { bagnoMeters: metersByBagno } = getMetersByBagno(table);

        // Calculate actual quantities by bagno
        const actualByBagno = {};
        const actualBagnoOrder = [];

        if (table.rows) {
            table.rows.forEach(row => {
                const bagno = row.bagno || 'Unknown';

                if (!actualByBagno[bagno]) {
                    actualByBagno[bagno] = {};
                    actualBagnoOrder.push(bagno);

                    orderSizes.forEach(sizeObj => {
                        actualByBagno[bagno][sizeObj.size] = 0;
                    });
                }

                if (row.piecesPerSize) {
                    Object.entries(row.piecesPerSize).forEach(([size, quantity]) => {
                        const numQuantity = parseInt(quantity) || 0;
                        const actualLayers = parseFloat(row.layers_a) || 0;
                        const actualPieces = numQuantity * actualLayers;

                        if (actualByBagno[bagno].hasOwnProperty(size)) {
                            actualByBagno[bagno][size] += actualPieces;
                        }
                    });
                }
            });
        }

        const uniqueSizes = orderSizes.map(s => s.size);

        // Render Planned Quantities Table
        const renderPlannedTable = () => {
            const totalPerSize = {};

            if (plannedByBagno && typeof plannedByBagno === 'object') {
                Object.values(plannedByBagno).forEach(sizeMap => {
                    if (sizeMap && typeof sizeMap === 'object') {
                        Object.entries(sizeMap).forEach(([size, qty]) => {
                            totalPerSize[size] = (totalPerSize[size] || 0) + qty;
                        });
                    }
                });
            }

            const totalMeters = (metersByBagno && typeof metersByBagno === 'object')
                ? Object.values(metersByBagno).reduce((sum, val) => sum + val, 0)
                : 0;

            return (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Table size="small" sx={{ width: 'auto' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>
                                {uniqueSizes.map(size => (
                                    <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
                                ))}
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Pcs</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cons [m]</TableCell>
                            </TableRow>
                        </TableHead>
                    <TableBody>
                        {bagnoOrder.map(bagno => {
                            const sizeMap = plannedByBagno[bagno] || {};
                            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);
                            const consumption = metersByBagno[bagno] || 0;

                            return (
                                <TableRow key={bagno}>
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{bagno}</TableCell>
                                    {uniqueSizes.map(size => (
                                        <TableCell key={size} align="center">{sizeMap[size] || 0}</TableCell>
                                    ))}
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{total}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{consumption.toFixed(0)}</TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            {uniqueSizes.map(size => {
                                const orderedQty = orderSizes.find(s => s.size === size)?.qty || 0;
                                const percentage = orderedQty > 0 ? ((totalPerSize[size] || 0) / orderedQty * 100).toFixed(1) : '0.0';
                                return (
                                    <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>
                                        {totalPerSize[size] || 0} ({percentage}%)
                                    </TableCell>
                                );
                            })}
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {Object.values(totalPerSize).reduce((sum, qty) => sum + qty, 0)}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{totalMeters.toFixed(0)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                </Box>
            );
        };

        // Render Actual Quantities Table
        const renderActualTable = () => {
            const totalPerSize = {};

            if (actualByBagno && typeof actualByBagno === 'object') {
                Object.values(actualByBagno).forEach(sizeMap => {
                    if (sizeMap && typeof sizeMap === 'object') {
                        Object.entries(sizeMap).forEach(([size, qty]) => {
                            totalPerSize[size] = (totalPerSize[size] || 0) + qty;
                        });
                    }
                });
            }

            const totalActualMeters = table.rows
                ? table.rows.reduce((sum, row) => sum + (parseFloat(row.cons_actual) || 0), 0)
                : 0;

            return (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Table size="small" sx={{ width: 'auto' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Bagno</TableCell>
                                {uniqueSizes.map(size => (
                                    <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>{size}</TableCell>
                                ))}
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Pcs</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cons [m]</TableCell>
                            </TableRow>
                        </TableHead>
                    <TableBody>
                        {actualBagnoOrder.map(bagno => {
                            const sizeMap = actualByBagno[bagno] || {};
                            const total = Object.values(sizeMap).reduce((sum, qty) => sum + qty, 0);
                            const consumption = table.rows
                                .filter(row => (row.bagno || 'Unknown') === bagno)
                                .reduce((sum, row) => sum + (parseFloat(row.cons_actual) || 0), 0);

                            return (
                                <TableRow key={bagno}>
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{bagno}</TableCell>
                                    {uniqueSizes.map(size => (
                                        <TableCell key={size} align="center">{sizeMap[size] || 0}</TableCell>
                                    ))}
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{total}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 500 }}>{consumption.toFixed(0)}</TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            {uniqueSizes.map(size => (
                                <TableCell key={size} align="center" sx={{ fontWeight: 'bold' }}>
                                    {totalPerSize[size] || 0} (0.0%)
                                </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {Object.values(totalPerSize).reduce((sum, qty) => sum + qty, 0)} (0.0%)
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{totalActualMeters.toFixed(0)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                </Box>
            );
        };

        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {t('logistic.plannedQuantities', 'Planned Quantities')}
                    </Typography>
                </Box>
                {renderPlannedTable()}

                <Box mt={3}>
                    <Divider />
                </Box>

                <Box mt={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {t('logistic.actualQuantities', 'Actual Quantities')}
                        </Typography>
                    </Box>
                    {renderActualTable()}
                </Box>
            </Box>
        );
    };

    // Handle print
    const handlePrint = () => {
        handleLogisticPrint(
            mattressTables,
            adhesiveTables,
            alongTables,
            weftTables,
            biasTables
        );
    };

    return (
        <>
            {/* Order Selection */}
            <MainCard
                title="Order Details"
                sx={{ mb: 2 }}
                secondary={
                    selectedOrder && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handlePrint}
                            startIcon={<Print />}
                            className="print-hidden"
                            sx={{
                                fontSize: '0.875rem',
                                py: 0.75,
                                px: 2,
                                minHeight: '36px'
                            }}
                        >
                            {t('common.print', 'Печат')}
                        </Button>
                    )
                }
            >

                {/* Order Toolbar - Direct order selection */}
                <LogisticOrderToolbar
                    orderOptions={orders} // Show all PXE3 orders directly
                    selectedOrder={selectedOrder}
                    onOrderChange={onOrderChange}
                    selectedStyle={selectedStyle}
                    selectedSeason={selectedSeason}
                    selectedBrand={brand}
                    selectedColorCode={selectedColorCode}
                />

                {/* Order Quantities Section */}
                <OrderQuantities orderSizes={orderSizes} italianRatios={{}} />
            </MainCard>

            {/* Comments Section - Side by Side Layout */}
            {(selectedOrder || selectedStyle) && (
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                        {/* Order Comment - Left Side */}
                        <Grid item xs={12} md={6}>
                            {selectedOrder && selectedCombination && (
                                <OrderCommentCardReadOnly
                                    selectedOrder={selectedOrder}
                                    selectedCombination={selectedCombination}
                                />
                            )}
                        </Grid>

                        {/* Style Comment - Right Side */}
                        <Grid item xs={12} md={6}>
                            {selectedStyle && (
                                <StyleCommentCardReadOnly selectedStyle={selectedStyle} />
                            )}
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Production Center Configuration */}
            {selectedOrder && showProductionCenterTabs && (
                <Box sx={{ mb: 2 }}>
                    <ProductionCenterTabs
                        combinations={productionCenterCombinations}
                        selectedCombination={selectedCombination}
                        onCombinationChange={handleCombinationChange}
                        loading={productionCenterLoading}
                    />
                </Box>
            )}

            {/* Along Collaretto Tables */}
            {getFilteredTables(alongTables, selectedCombination).map((table, index) => (
                <React.Fragment key={`along-${table.id}-${index}`}>
                    <MainCard
                        title="Collaretto Along the Grain"
                        sx={{ mb: 2 }}
                        data-table-id={table.id}
                    >
                        <AlongGroupCardReadOnly table={table} />

                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <AlongTableHeaderReadOnly />
                                    <TableBody>
                                        {table.rows.map((row) => (
                                            <AlongRowReadOnly
                                                key={row.id}
                                                row={row}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <AlongActionRowReadOnly table={table} />
                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Weft Collaretto Tables */}
            {getFilteredTables(weftTables, selectedCombination).map((table, index) => (
                <React.Fragment key={`weft-${table.id}-${index}`}>
                    <MainCard
                        title="Collaretto Weft"
                        sx={{ mb: 2 }}
                        data-table-id={table.id}
                    >
                        <WeftGroupCardReadOnly table={table} />

                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <WeftTableHeaderReadOnly />
                                    <TableBody>
                                        {table.rows.map((row) => (
                                            <WeftRowReadOnly
                                                key={row.id}
                                                row={row}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <WeftActionRowReadOnly table={table} />
                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Bias Collaretto Tables */}
            {getFilteredTables(biasTables, selectedCombination).map((table, index) => (
                <React.Fragment key={`bias-${table.id}-${index}`}>
                    <MainCard
                        title="Collaretto Bias"
                        sx={{ mb: 2 }}
                        data-table-id={table.id}
                    >
                        <BiasGroupCardReadOnly table={table} />

                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <BiasTableHeaderReadOnly />
                                    <TableBody>
                                        {table.rows.map((row) => (
                                            <BiasRowReadOnly
                                                key={row.id}
                                                row={row}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <BiasActionRowReadOnly table={table} />
                        </Box>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Mattress Summary Tables */}
            {getFilteredTables(mattressTables, selectedCombination).map((table, index) => (
                <React.Fragment key={`mattress-${table.id}-${index}`}>
                    <MainCard
                        sx={{ mb: 2 }}
                        title={t('logistic.mattresses', 'Mattresses')}
                        data-table-id={table.id}
                    >
                        {renderBagnoSummaryTables(table)}
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Adhesive Summary Tables */}
            {getFilteredTables(adhesiveTables, selectedCombination).map((table, index) => (
                <React.Fragment key={`adhesive-${table.id}-${index}`}>
                    <MainCard
                        sx={{ mb: 2 }}
                        title={t('logistic.adhesives', 'Adhesives')}
                        data-table-id={table.id}
                    >
                        {renderBagnoSummaryTables(table)}
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Show loading indicators while fetching data */}
            {selectedOrder && collarettoLoading && (
                <MainCard sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                        <CircularProgress size={24} sx={{ mr: 2 }} />
                        <Typography variant="body1" color="textSecondary">
                            Loading collaretto data...
                        </Typography>
                    </Box>
                </MainCard>
            )}

            {selectedOrder && mattressLoading && (
                <MainCard sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                        <CircularProgress size={24} sx={{ mr: 2 }} />
                        <Typography variant="body1" color="textSecondary">
                            Loading mattress data...
                        </Typography>
                    </Box>
                </MainCard>
            )}
        </>
    );
};

export default LogisticView;
