import React, { useState, useEffect } from 'react';
import { Box, Collapse, Table, TableBody, TableContainer, Paper, Typography } from '@mui/material';
import axios from 'utils/axiosInstance';

// UI Components
import MainCard from 'ui-component/cards/MainCard';

// Order Components
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';
import LogisticOrderToolbar from './components/LogisticOrderToolbar';

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

// Hooks
import useLogisticOrderChange from './hooks/useLogisticOrderChange';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';

const LogisticView = () => {
    // Order State
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderSizes, setOrderSizes] = useState([]);
    const [orderSizeNames, setOrderSizeNames] = useState([]);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [selectedColorCode, setSelectedColorCode] = useState('');

    // Production Center State (not used but needed for compatibility)
    const [selectedProductionCenter, setSelectedProductionCenter] = useState('');
    const [selectedCuttingRoom, setSelectedCuttingRoom] = useState('');
    const [selectedDestination, setSelectedDestination] = useState('');
    const [productionCenterCombinations, setProductionCenterCombinations] = useState([]);
    const [showProductionCenterFilter, setShowProductionCenterFilter] = useState(false);
    const [filteredCuttingRoom, setFilteredCuttingRoom] = useState('');
    const [filteredDestination, setFilteredDestination] = useState('');
    const [productionCenterLoading, setProductionCenterLoading] = useState(false);

    // Collaretto Tables State
    const [alongTables, setAlongTables] = useState([]);
    const [weftTables, setWeftTables] = useState([]);
    const [biasTables, setBiasTables] = useState([]);

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
        setShowProductionCenterFilter,
        setFilteredCuttingRoom,
        setFilteredDestination,
        setProductionCenterLoading,
        productionCenterCombinations,
        fetchBrandForStyle,
        setAlongTables,
        setWeftTables,
        setBiasTables,
        sortSizes,
        clearBrand
    });

    // Fetch orders assigned to PXE3 production center
    useEffect(() => {
        console.log("📊 Fetching orders for PXE3 production center...");

        // Get orders assigned to PXE3 production center via collaretto tables
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

    return (
        <>
            {/* Order Selection */}
            <MainCard title="PXE3 Collaretto Planning" sx={{ mb: 2 }}>
                {/* Debug: Show if selectedOrder exists */}
                {console.log("🔍 selectedOrder:", selectedOrder)}

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



            {/* Along Collaretto Tables */}
            {alongTables.map((table, index) => (
                <React.Fragment key={`along-${table.id}-${index}`}>
                    <MainCard
                        title="Collaretto Along the Grain"
                        sx={{ mb: 2 }}
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
            {weftTables.map((table, index) => (
                <React.Fragment key={`weft-${table.id}-${index}`}>
                    <MainCard
                        title="Collaretto Weft"
                        sx={{ mb: 2 }}
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
            {biasTables.map((table, index) => (
                <React.Fragment key={`bias-${table.id}-${index}`}>
                    <MainCard
                        title="Collaretto Bias"
                        sx={{ mb: 2 }}
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

            {/* Show message when no tables are available */}
            {selectedOrder && alongTables.length === 0 && weftTables.length === 0 && biasTables.length === 0 && (
                <MainCard sx={{ mb: 2 }}>
                    <Typography variant="body1" align="center" color="textSecondary">
                        No collaretto tables found for PXE3 production center in this order.
                    </Typography>
                </MainCard>
            )}
        </>
    );
};

export default LogisticView;
