import React, { useState, useEffect } from 'react';
import { Box, Paper, Table, TableBody, TableContainer, Button, Tabs, Tab, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useSelector } from 'react-redux';
import { Print, Save } from '@mui/icons-material';
import axios from 'utils/axiosInstance';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

// Production center configuration
import { CUTTING_ROOMS, getCuttingRoomFromUsername } from 'utils/productionCenterConfig';

// project imports
import MainCard from 'ui-component/cards/MainCard';

// Order Components
import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';

// Mattress Components
import MattressGroupCardReadOnly from 'views/dashboard/OrderReport/MattressGroupCardReadOnly';
import SubcontractorPlannedQuantityBar from './components/SubcontractorPlannedQuantityBar';
import MattressTableHeaderWithSizes from './components/MattressTableHeaderWithSizes';
import MattressRowReadOnlyWithSizes from './components/MattressRowReadOnlyWithSizes';
import MattressActionRowReadOnly from 'views/dashboard/OrderReport/MattressActionRowReadOnly';

// Adhesive Components
import AdhesiveGroupCardReadOnly from 'views/dashboard/OrderReport/AdhesiveGroupCardReadOnly';
import AdhesiveTableHeaderWithSizes from './components/AdhesiveTableHeaderWithSizes';
import AdhesiveRowReadOnlyWithSizes from './components/AdhesiveRowReadOnlyWithSizes';
import AdhesiveActionRowReadOnly from 'views/dashboard/OrderReport/AdhesiveActionRowReadOnly';

// PadPrint Component
import PadPrintInfo from 'views/planning/OrderPlanning/components/PadPrintInfo';

// Style Comment Component (Read-only for subcontractors)
import StyleCommentCardReadOnly from './components/StyleCommentCardReadOnly';

// Hooks
import useSubcontractorOrderChange from './hooks/useSubcontractorOrderChange';
import usePadPrintInfo from 'views/planning/OrderPlanning/hooks/usePadPrintInfo';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';

// Print Utils
import { usePrintStyles, handlePrint, getAllDestinations, handleDestinationPrint } from 'views/planning/OrderPlanning/utils/printUtils';
import DestinationPrintDialog from 'views/planning/OrderPlanning/components/DestinationPrintDialog';

// Width Change Dialog
import SubcontractorWidthChangeDialog from './components/SubcontractorWidthChangeDialog';

// Dynamic import to handle potential module resolution issues

const SubcontractorView = () => {
    const { t } = useTranslation();
    const location = useLocation();

    // Track which page we're on (open or closed)
    const [pageType, setPageType] = useState('open');

    // State for orders and selection
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [selectedColorCode, setSelectedColorCode] = useState('');

    // State for destination selection (DELICIA cutting room only)
    const [selectedDestination, setSelectedDestination] = useState('');

    // State for editable actual layers
    const [editableActualLayers, setEditableActualLayers] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Order sizes
    const [orderSizes, setOrderSizes] = useState([]);

    // Tables
    const [tables, setTables] = useState([]);
    const [adhesiveTables, setAdhesiveTables] = useState([]);

    // Print functionality
    const [openDestinationPrintDialog, setOpenDestinationPrintDialog] = useState(false);
    const [availableDestinations, setAvailableDestinations] = useState([]);

    // Width change dialog state
    const [widthChangeDialog, setWidthChangeDialog] = useState({
        open: false,
        mattressData: null
    });

    // Hooks
    const { padPrintInfo, fetchPadPrintInfo, clearPadPrintInfo } = usePadPrintInfo();
    const { brand, fetchBrandForStyle, clearBrand } = useBrandInfo();

    // Italian ratios not needed for subcontractors

    // Sort sizes utility
    const sortSizes = (sizes) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        return sizes.sort((a, b) => {
            const indexA = sizeOrder.indexOf(a.size);
            const indexB = sizeOrder.indexOf(b.size);
            if (indexA === -1 && indexB === -1) return a.size.localeCompare(b.size);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    };

    // Planned quantities calculation
    const getTablePlannedQuantities = (table) => {
        const result = {};
        orderSizes.forEach(size => {
            result[size.size] = table.rows.reduce((sum, row) => {
                const pcsPerSize = parseFloat(row.piecesPerSize?.[size.size]) || 0;
                const layers = parseFloat(row.layers_a || row.layers) || 0;
                return sum + (pcsPerSize * layers);
            }, 0);
        });
        return result;
    };



    const getTablePlannedByBagno = (table) => {
        const bagnoMap = {};
        const bagnoOrder = []; // Track the order of bagno appearance

        // Safety check for invalid table
        if (!table || !table.rows) {
            console.warn('Invalid table passed to getTablePlannedByBagno:', table);
            return { bagnoMap, bagnoOrder };
        }

        table.rows.forEach(row => {
            const bagno = row.bagno || 'no bagno';

            // Initialize bagno entry if it doesn't exist and track order
            if (!bagnoMap[bagno]) {
                bagnoMap[bagno] = {};
                bagnoOrder.push(bagno); // Add to order list when first encountered
            }

            orderSizes.forEach(size => {
                if (!bagnoMap[bagno][size.size]) bagnoMap[bagno][size.size] = 0;
                const pcsPerSize = parseFloat(row.piecesPerSize?.[size.size]) || 0;
                const layers = parseFloat(row.layers_a || row.layers) || 0;
                bagnoMap[bagno][size.size] += pcsPerSize * layers;
            });
        });
        return { bagnoMap, bagnoOrder };
    };

    const getMetersByBagno = (table) => {
        const bagnoMeters = {};
        const bagnoOrder = []; // Track the order of bagno appearance

        table.rows.forEach(row => {
            const bagno = row.bagno || 'no bagno';
            const consumption = parseFloat(row.cons_actual || row.expectedConsumption) || 0;

            // Track order when first encountered
            if (!bagnoMeters.hasOwnProperty(bagno)) {
                bagnoOrder.push(bagno);
            }

            bagnoMeters[bagno] = (bagnoMeters[bagno] || 0) + consumption;
        });

        return { bagnoMeters, bagnoOrder };
    };

    const getWidthsByBagno = (table) => {
        const bagnoWidths = {};
        const bagnoOrder = []; // Track the order of bagno appearance

        // Safety check for invalid table
        if (!table || !table.rows) {
            return { bagnoWidths, bagnoOrder };
        }

        table.rows.forEach(row => {
            // Use "no bagno" for rows without a valid bagno
            const bagno = row.bagno || 'no bagno';
            const width = row.width ? parseFloat(row.width) : null;

            // Skip rows without valid width or piecesPerSize
            if (!width || !row.piecesPerSize || typeof row.piecesPerSize !== 'object') {
                return;
            }

            // Use actual layers if available, otherwise planned layers
            const layers = parseFloat(row.layers_a || row.layers) || 0;
            if (layers <= 0) {
                return;
            }

            // Get consumption for this row
            const consumption = parseFloat(row.cons_actual || row.expectedConsumption) || 0;

            // Track order when first encountered
            if (!bagnoWidths[bagno]) {
                bagnoWidths[bagno] = {};
                bagnoOrder.push(bagno);
            }

            // Initialize width entry if it doesn't exist
            if (!bagnoWidths[bagno][width]) {
                bagnoWidths[bagno][width] = {
                    sizeMap: {},
                    consumption: 0
                };
            }

            // Add consumption for this width
            bagnoWidths[bagno][width].consumption += consumption;

            // Process each size and add to the total for this width
            Object.entries(row.piecesPerSize).forEach(([size, pcs]) => {
                const pieces = parseInt(pcs) || 0;
                if (pieces <= 0) return; // Skip sizes with no pieces

                const total = pieces * layers;
                bagnoWidths[bagno][width].sizeMap[size] = (bagnoWidths[bagno][width].sizeMap[size] || 0) + total;
            });
        });

        return { bagnoWidths, bagnoOrder };
    };

    // Consumption calculations not needed for read-only subcontractor view

    // Print styles
    usePrintStyles();

    // Get current user info
    const account = useSelector((state) => state.account);
    const currentUser = account?.user;
    const username = currentUser?.username; // Username might be like "DELICIA2"

    // Use the shared utility function to extract cutting room from username

    const cuttingRoom = getCuttingRoomFromUsername(username);

    // Check if current cutting room is DELICIA (has multiple destinations)
    const isDeliciaCuttingRoom = cuttingRoom === CUTTING_ROOMS.DELICIA;

    // Get destinations that have actual quantities assigned (fabric type "01" only)
    const getDestinationsWithQuantities = () => {
        if (!isDeliciaCuttingRoom || !tables.length) return [];

        const destinationsWithQuantities = new Set();

        // Check each fabric type "01" table for quantities
        tables.filter(table => table.fabricType === "01").forEach(table => {
            if (table.destination && table.rows && table.rows.length > 0) {
                // Check if this table has any actual quantities
                const hasQuantities = table.rows.some(row => {
                    if (!row.piecesPerSize) return false;
                    const layers = parseFloat(row.layers_a || row.layers) || 0;
                    return Object.values(row.piecesPerSize).some(pcs => {
                        const pieces = parseFloat(pcs) || 0;
                        return pieces > 0 && layers > 0;
                    });
                });

                if (hasQuantities) {
                    destinationsWithQuantities.add(table.destination);
                }
            }
        });

        return Array.from(destinationsWithQuantities);
    };

    // Calculate planned quantities from fabric type "01" tables for order toolbar
    const getPlannedQuantitiesFromFabricType01 = () => {
        // For DELICIA cutting room, don't show quantities until destination is selected
        if (isDeliciaCuttingRoom && !selectedDestination) {
            return orderSizes.map(size => ({ size: size.size, qty: 0 }));
        }

        // Filter tables to only include fabric type "01"
        let fabricType01Tables = tables.filter(table => table.fabricType === "01");

        // For DELICIA cutting room, also filter by selected destination
        if (isDeliciaCuttingRoom && selectedDestination) {
            fabricType01Tables = fabricType01Tables.filter(table => table.destination === selectedDestination);
        }

        if (fabricType01Tables.length === 0) {
            // If no fabric type "01" tables, return empty quantities
            return orderSizes.map(size => ({ size: size.size, qty: 0 }));
        }

        // Calculate total planned quantities across all fabric type "01" tables
        const totalPlannedQuantities = {};
        orderSizes.forEach(size => {
            totalPlannedQuantities[size.size] = 0;
        });

        fabricType01Tables.forEach(table => {
            const tablePlanned = getTablePlannedQuantities(table);
            orderSizes.forEach(size => {
                totalPlannedQuantities[size.size] += tablePlanned[size.size] || 0;
            });
        });

        // Convert to the format expected by OrderQuantities component
        const result = orderSizes.map(size => ({
            size: size.size,
            qty: totalPlannedQuantities[size.size] || 0
        }));

        return result;
    };

    // Auto-select first destination or clear if no longer available
    useEffect(() => {
        if (isDeliciaCuttingRoom && tables.length > 0) {
            const availableDestinations = getDestinationsWithQuantities();

            if (availableDestinations.length > 0) {
                // If no destination is selected, auto-select the first one
                if (!selectedDestination) {
                    setSelectedDestination(availableDestinations[0]);
                }
                // If current destination is no longer available, switch to first available
                else if (!availableDestinations.includes(selectedDestination)) {
                    setSelectedDestination(availableDestinations[0]);
                }
            } else {
                // No destinations available, clear selection
                setSelectedDestination('');
            }
        }
    }, [tables, selectedDestination, isDeliciaCuttingRoom]);

    // Clear editable actual layers when order changes
    useEffect(() => {
        setEditableActualLayers({});
        setUnsavedChanges(false);
    }, [selectedOrder]);

    // Order Change Handler
    const { onOrderChange } = useSubcontractorOrderChange({
        setSelectedOrder,
        setOrderSizes,
        setOrderSizeNames: () => {}, // Not needed for subcontractor
        setSelectedStyle,
        setSelectedSeason,
        setSelectedColorCode,
        setSelectedProductionCenter: () => {}, // Not needed for subcontractor
        setSelectedCuttingRoom: () => {}, // Not needed for subcontractor
        setSelectedDestination: setSelectedDestination, // Clear destination when order changes
        setProductionCenterCombinations: () => {}, // Not needed for subcontractor
        setShowProductionCenterFilter: () => {}, // Not needed for subcontractor
        setFilteredCuttingRoom: () => {}, // Not needed for subcontractor
        setFilteredDestination: () => {}, // Not needed for subcontractor
        setProductionCenterLoading: () => {}, // Not needed for subcontractor
        productionCenterCombinations: [], // Not needed for subcontractor
        fetchPadPrintInfo,
        fetchBrandForStyle,
        setTables,
        setAdhesiveTables,
        setAlongTables: () => {}, // Not needed for subcontractor
        setWeftTables: () => {}, // Not needed for subcontractor
        setMarkerOptions: () => {}, // Not needed for subcontractor
        sortSizes,
        clearBrand,
        clearPadPrintInfo,
        cuttingRoom // Pass the mapped cutting room to filter mattresses
    });

    // Print handlers
    const handleEnhancedPrint = () => {
        const destinations = getAllDestinations(tables, adhesiveTables, [], [], []);

        if (destinations.length <= 1) {
            // Single or no destination - print normally
            handlePrint(tables, adhesiveTables, [], [], [], {}, () => {});
        } else {
            // Multiple destinations - show selection dialog
            setAvailableDestinations(destinations);
            setOpenDestinationPrintDialog(true);
        }
    };

    const handlePrintDestination = (selectedDestination) => {
        setOpenDestinationPrintDialog(false);
        handleDestinationPrint(selectedDestination, tables, adhesiveTables, [], [], [], {}, () => {});
    };

    const handlePrintAll = () => {
        setOpenDestinationPrintDialog(false);
        handlePrint(tables, adhesiveTables, [], [], [], {}, () => {});
    };

    // Handle individual mattress download (placeholder for now)
    const handleDownloadMattress = async (row) => {
        // TODO: Implement download functionality
        alert('Download functionality will be implemented soon');
    };

    // Handle individual mattress change - open width change dialog
    const handleChangeMattress = async (row) => {
        // Check if actual layers are already declared
        if (row.layers_a) {
            showSnackbar(t('subcontractor.cannotChangeWidthActualLayersDeclared', 'Cannot change width when actual layers are already declared'), 'warning');
            return;
        }

        // Find the table this row belongs to
        const parentTable = tables.find(table => table.rows.some(r => r.id === row.id)) ||
                           adhesiveTables.find(table => table.rows.some(r => r.id === row.id));

        if (!parentTable) {
            showSnackbar(t('subcontractor.errorFindingMattressTable', 'Error finding mattress table'), 'error');
            return;
        }

        // Prepare mattress data for the dialog
        const mattressData = {
            id: row.id,
            mattressName: row.mattressName,
            width: row.width,
            markerName: row.markerName,
            style: selectedStyle,
            orderCommessa: selectedOrder?.id,
            piecesPerSize: row.piecesPerSize || {},
            layers: row.layers,
            markerLength: row.markerLength,
            efficiency: row.efficiency
        };

        setWidthChangeDialog({
            open: true,
            mattressData: mattressData
        });
    };

    // Snackbar helper functions
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    // Handle actual layers change
    const handleActualLayersChange = (rowId, value) => {
        setEditableActualLayers(prev => ({
            ...prev,
            [rowId]: value
        }));
        setUnsavedChanges(true);
    };

    // Save actual layers changes
    const handleSaveActualLayers = async () => {
        try {
            setSaving(true);

            const changedRows = Object.entries(editableActualLayers).filter(([rowId, value]) => {
                // Find the original row to compare
                const originalRow = tables.flatMap(table => table.rows).find(row => row.id === rowId);
                return originalRow && value !== (originalRow.layers_a || '');
            });

            if (changedRows.length === 0) {
                showSnackbar(t('subcontractor.noChangesToSave', 'No changes to save'), 'info');
                setSaving(false);
                return;
            }

            // Prepare data for API
            const updates = changedRows.map(([rowId, actualLayers]) => ({
                row_id: rowId,
                layers_a: parseFloat(actualLayers) || 0
            }));

            const response = await axios.post('/mattress/save_actual_layers', {
                updates: updates
            });

            if (response.data.success) {
                // Clear unsaved changes
                setUnsavedChanges(false);
                setEditableActualLayers({});

                // Refresh the data
                if (selectedOrder) {
                    onOrderChange(selectedOrder);
                }

                showSnackbar(t('subcontractor.actualLayersSavedSuccessfully', 'Actual layers saved successfully!'), 'success');
            } else {
                showSnackbar(t('subcontractor.errorSavingActualLayers', 'Error saving actual layers: {{message}}', { message: response.data.message }), 'error');
            }
        } catch (error) {
            console.error('Error saving actual layers:', error);
            showSnackbar(t('subcontractor.errorSavingActualLayersTryAgain', 'Error saving actual layers. Please try again.'), 'error');
        } finally {
            setSaving(false);
        }
    };

    // Handle individual mattress print
    const handlePrintMattress = async (row) => {
        try {
            // Dynamic import to handle potential module resolution issues
            const { default: printMattressBG } = await import('../import-print-tools/Print/printBG');
            // Convert row data to the format expected by printMattressBG
            const mattressData = {
                id: row.id,
                mattress: row.mattressName,
                order_commessa: selectedOrder?.id || '',
                fabric_code: tables.find(table => table.rows.some(r => r.id === row.id))?.fabricCode || '',
                fabric_color: tables.find(table => table.rows.some(r => r.id === row.id))?.fabricColor || '',
                dye_lot: row.bagno || '',
                spreading_method: tables.find(table => table.rows.some(r => r.id === row.id))?.spreadingMethod || '',
                table_id: tables.find(table => table.rows.some(r => r.id === row.id))?.id || '',
                details: [{
                    layers: row.layers,
                    cons_planned: row.expectedConsumption,
                    allowance: tables.find(table => table.rows.some(r => r.id === row.id))?.allowance || 0
                }],
                markers: [{
                    marker_name: row.markerName,
                    marker_width: row.width,
                    marker_length: row.markerLength,
                    efficiency: row.efficiency,
                    size_quantities: row.piecesPerSize || {}
                }]
            };

            // Call the print function with the single mattress
            await printMattressBG([mattressData], () => {
                // Refresh callback - could trigger a data refresh if needed
            });
        } catch (error) {
            alert('Error printing mattress. Please try again.');
        }
    };

    const handleCloseDestinationPrintDialog = () => {
        setOpenDestinationPrintDialog(false);
    };

    // Width change dialog handlers
    const handleCloseWidthChangeDialog = () => {
        setWidthChangeDialog({
            open: false,
            mattressData: null
        });
    };

    const handleSubmitWidthChangeRequest = async (submissionData) => {
        try {
            // Parse mattress sizes to get size quantities (same as spreader)
            const parseMattressSizes = (sizesString) => {
                if (!sizesString) return {};
                const sizeQuantities = {};
                const sizeEntries = sizesString.split(';');
                sizeEntries.forEach(entry => {
                    const parts = entry.split(' - ');
                    if (parts.length === 2) {
                        const size = parts[0].trim();
                        const quantity = parseInt(parts[1].trim());
                        if (!isNaN(quantity)) {
                            sizeQuantities[size] = quantity;
                        }
                    }
                });
                return sizeQuantities;
            };

            const sizeQuantities = parseMattressSizes(submissionData.mattressSizes);

            const requestData = {
                mattress_id: submissionData.mattressId,
                requested_by: currentUser?.username || 'Unknown',
                operator: null, // Subcontractors don't have operators
                current_marker_name: widthChangeDialog.mattressData?.markerName || '',
                current_width: parseFloat(submissionData.currentWidth),
                requested_width: parseFloat(submissionData.newWidth),
                selected_marker_name: submissionData.selectedMarker || null,
                selected_marker_id: null, // Will be resolved by backend if marker name is provided
                request_type: submissionData.requestType,
                style: submissionData.style,
                order_commessa: submissionData.orderCommessa,
                size_quantities: sizeQuantities
            };

            const response = await axios.post('/width_change_requests/create', requestData);

            if (response.data.success) {
                showSnackbar(
                    t('subcontractor.widthChangeRequestSubmitted', 'Width change request submitted successfully. Awaiting approval.'),
                    'success'
                );

                // Refresh the data to show any status changes
                if (selectedOrder) {
                    onOrderChange(selectedOrder);
                }
            } else {
                showSnackbar(
                    t('subcontractor.errorSubmittingWidthChangeRequest', 'Error submitting width change request: {{message}}', {
                        message: response.data.message
                    }),
                    'error'
                );
            }
        } catch (error) {
            console.error('Error submitting width change request:', error);
            showSnackbar(
                t('subcontractor.errorSubmittingWidthChangeRequestTryAgain', 'Error submitting width change request. Please try again.'),
                'error'
            );
        }

        handleCloseWidthChangeDialog();
    };

    // Listen for URL parameter changes (when navigating via sidebar)
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const typeParam = urlParams.get('type');
        const newPageType = typeParam === 'closed' ? 'closed' : 'open';

        if (newPageType !== pageType) {
            setPageType(newPageType);

            // Clear all state when switching between order types
            setOrders([]); // Clear orders immediately to prevent showing old data
            setSelectedOrder(null);
            setSelectedStyle("");
            setSelectedSeason("");
            setSelectedColorCode("");
            setOrderSizes([]);
            setTables([]);
            setAdhesiveTables([]);
            setSelectedDestination('');
            setEditableActualLayers({});
            setUnsavedChanges(false);

            // Clear other related state
            clearPadPrintInfo();
            clearBrand();

            console.log(`🔄 Switched to ${newPageType} orders page - state cleared`);
        }
    }, [location.search, pageType, clearPadPrintInfo, clearBrand]);

    // Fetch orders assigned to this subcontractor's cutting room
    useEffect(() => {
        if (!cuttingRoom) {
            return;
        }

        const fetchOrders = async () => {
            try {
                // Get orders assigned to this cutting room via mattress production center
                const ordersRes = await axios.get(`/mattress/production_center/orders_by_cutting_room/${cuttingRoom}`);

                if (!ordersRes.data.success) {
                    return;
                }

                // Convert order IDs to order objects for the dropdown
                const assignedOrderIds = ordersRes.data.data || [];

                // If we're on the closed orders page, filter by status = 4
                if (pageType === 'closed') {
                    // Fetch order lines to get status information
                    const orderLinesRes = await axios.get('/orders/order_lines');
                    const allOrderLines = orderLinesRes.data.success ? orderLinesRes.data.data : [];

                    // First, create a set of assigned order IDs for quick lookup
                    const assignedOrderSet = new Set(assignedOrderIds.map(item => item.order_commessa));

                    // Get unique order IDs with status = 4 that are ALSO in assignedOrderIds
                    const closedOrderIds = new Set();
                    allOrderLines.forEach(line => {
                        if (line.status === 4 && assignedOrderSet.has(line.order_commessa)) {
                            closedOrderIds.add(line.order_commessa);
                        }
                    });

                    // Filter assigned orders to only include those with status = 4
                    const filteredOrderIds = assignedOrderIds.filter(item =>
                        closedOrderIds.has(item.order_commessa)
                    );

                    const ordersArray = filteredOrderIds.map(item => ({
                        id: item.order_commessa,
                        style: '', // Will be populated when order is selected
                        season: '', // Will be populated when order is selected
                        colorCode: '', // Will be populated when order is selected
                        sizes: [] // Will be populated when order is selected
                    }));

                    setOrders(ordersArray);
                } else {
                    // Open orders page - filter by status = 3
                    // Fetch order lines to get status information
                    const orderLinesRes = await axios.get('/orders/order_lines');
                    const allOrderLines = orderLinesRes.data.success ? orderLinesRes.data.data : [];

                    // First, create a set of assigned order IDs for quick lookup
                    const assignedOrderSet = new Set(assignedOrderIds.map(item => item.order_commessa));

                    // Get unique order IDs with status = 3 that are ALSO in assignedOrderIds
                    const openOrderIds = new Set();
                    allOrderLines.forEach(line => {
                        if (line.status === 3 && assignedOrderSet.has(line.order_commessa)) {
                            openOrderIds.add(line.order_commessa);
                        }
                    });

                    // Filter assigned orders to only include those with status = 3
                    const filteredOrderIds = assignedOrderIds.filter(item =>
                        openOrderIds.has(item.order_commessa)
                    );

                    const ordersArray = filteredOrderIds.map(item => ({
                        id: item.order_commessa,
                        style: '', // Will be populated when order is selected
                        season: '', // Will be populated when order is selected
                        colorCode: '', // Will be populated when order is selected
                        sizes: [] // Will be populated when order is selected
                    }));

                    setOrders(ordersArray);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                // Fallback to all mattress orders if the specific endpoint fails
                try {
                    const mattressRes = await axios.get('/mattress/order_ids');
                    if (mattressRes.data.success) {
                        const mattressOrderIds = mattressRes.data.data || [];
                        const ordersArray = mattressOrderIds.map(item => ({
                            id: item.order_commessa,
                            style: '',
                            season: '',
                            colorCode: '',
                            sizes: []
                        }));
                        setOrders(ordersArray);
                    }
                } catch (fallbackError) {
                    console.error('Fallback order fetch failed:', fallbackError);
                }
            }
        };

        fetchOrders();
    }, [cuttingRoom, pageType]);

    return (
        <>
            {/* Order Bar */}
            <MainCard
                title={t('subcontractor.orderMattressPlan', 'Order Mattress Plan')}
                sx={{ position: 'relative' }}
            >
                {/* Action Buttons */}
                {selectedOrder && (
                    <Box sx={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        zIndex: 1,
                        display: 'flex',
                        gap: 1
                    }}>
                        {/* Save Button */}
                        <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                            onClick={handleSaveActualLayers}
                            disabled={!unsavedChanges || saving}
                            sx={{
                                backgroundColor: unsavedChanges ? 'primary.main' : 'grey.400',
                                color: 'white',
                                height: '36px',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    backgroundColor: unsavedChanges ? 'primary.dark' : 'grey.500'
                                },
                                '&:disabled': {
                                    backgroundColor: 'grey.300',
                                    color: 'grey.500'
                                }
                            }}
                        >
                            {saving ? t('common.saving', 'Saving...') : t('subcontractor.saveActualLayers', 'Save Actual Layers')}
                        </Button>

                        {/* Print Button */}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleEnhancedPrint}
                            startIcon={<Print />}
                            sx={{
                                height: '36px',
                                fontSize: '0.875rem'
                            }}
                        >
                            {t('common.print', 'Print')}
                        </Button>
                    </Box>
                )}



                {/* Order Toolbar - Direct order selection without style filtering */}
                <OrderToolbar
                    styleOptions={[]} // No style filtering for subcontractors
                    selectedStyle={selectedStyle}
                    onStyleChange={() => {}} // No style change handler needed
                    orderOptions={orders} // Show all orders directly
                    selectedOrder={selectedOrder}
                    onOrderChange={onOrderChange}
                    selectedSeason={selectedSeason}
                    selectedBrand={brand}
                    selectedColorCode={selectedColorCode}
                    hideAuditInfo={true} // Hide audit information for subcontractors
                />

                {/* Order Quantities Section - Show planned quantities from fabric type "01" tables */}
                {/* For DELICIA cutting room, hide quantities until destination is selected */}
                {!isDeliciaCuttingRoom && (
                    <OrderQuantities orderSizes={getPlannedQuantitiesFromFabricType01()} italianRatios={{}} />
                )}
            </MainCard>

            {/* Pad Print and Style Comment Section - Side by Side */}
            {(selectedOrder || selectedStyle) && (
                <Box display="flex" gap={2} mt={2} alignItems="stretch">
                    {/* Pad Print Section - Left Half */}
                    <Box flex={1} display="flex">
                        {padPrintInfo && (
                            <PadPrintInfo padPrintInfo={padPrintInfo} />
                        )}
                    </Box>

                    {/* Style Comment Section - Right Half */}
                    <Box flex={1} display="flex">
                        {selectedStyle && (
                            <StyleCommentCardReadOnly
                                selectedStyle={selectedStyle}
                            />
                        )}
                    </Box>
                </Box>
            )}

            {/* Destination Selector - Only for DELICIA cutting room */}
            {isDeliciaCuttingRoom && selectedOrder && (() => {
                const availableDestinations = getDestinationsWithQuantities();

                // If no destinations have quantities, don't show the selector
                if (availableDestinations.length === 0) {
                    return null;
                }

                return (
                    <Box mt={2}>
                        <MainCard title="Destination">
                            {/* Tab-style destination selector */}
                            <Tabs
                                value={selectedDestination || false}
                                onChange={(event, newValue) => {
                                    setSelectedDestination(newValue);
                                }}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{ mb: 3 }}
                            >
                                {availableDestinations.map((destination) => (
                                    <Tab
                                        key={destination}
                                        label={destination}
                                        value={destination}
                                    />
                                ))}
                            </Tabs>

                            {/* Show order quantities after destination is selected */}
                            {selectedDestination && (
                                <Box mt={2}>
                                    <OrderQuantities orderSizes={getPlannedQuantitiesFromFabricType01()} italianRatios={{}} />
                                </Box>
                            )}
                        </MainCard>
                    </Box>
                );
            })()}

            {/* Mattress Tables Section */}
            {(() => {
                const filteredTables = tables.filter(table => {
                    // For DELICIA cutting room, filter by selected destination
                    if (isDeliciaCuttingRoom && selectedDestination) {
                        return table.destination === selectedDestination;
                    }
                    // For other cutting rooms, show all tables
                    return true;
                });

                if (isDeliciaCuttingRoom && selectedDestination) {
                    // Show filtered tables for selected destination
                }

                return filteredTables.length > 0 && filteredTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                {`Mattresses`}
                                <SubcontractorPlannedQuantityBar
                                    table={table}
                                    orderSizes={orderSizes}
                                    getTablePlannedQuantities={getTablePlannedQuantities}
                                    getTablePlannedByBagno={getTablePlannedByBagno}
                                    getMetersByBagno={getMetersByBagno}
                                    getWidthsByBagno={getWidthsByBagno}
                                />
                            </Box>
                        }
                    >
                    <MattressGroupCardReadOnly table={table} />

                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <MattressTableHeaderWithSizes orderSizes={orderSizes} />
                                    <TableBody>
                                        {(() => {
                                            // Group rows by bagno and sort by final part of mattress ID (001, 002, 003) within each group
                                            const sortedRows = [...table.rows].sort((a, b) => {
                                                const bagnoA = a.bagno || '';
                                                const bagnoB = b.bagno || '';

                                                // If bagnos are different, sort by the sequence number of the first mattress in each bagno
                                                if (bagnoA !== bagnoB) {
                                                    // Find the first mattress in each bagno group and compare their sequence numbers
                                                    const firstMattressA = table.rows.find(row => (row.bagno || '') === bagnoA);
                                                    const firstMattressB = table.rows.find(row => (row.bagno || '') === bagnoB);

                                                    const sequenceA = firstMattressA ? parseInt(firstMattressA.sequenceNumber) || 0 : 0;
                                                    const sequenceB = firstMattressB ? parseInt(firstMattressB.sequenceNumber) || 0 : 0;

                                                    return sequenceA - sequenceB;
                                                }

                                                // If same bagno, sort by sequence number (final part of mattress ID: 001, 002, 003)
                                                const sequenceA = parseInt(a.sequenceNumber) || 0;
                                                const sequenceB = parseInt(b.sequenceNumber) || 0;
                                                return sequenceA - sequenceB;
                                            });

                                            return sortedRows.map((row) => (
                                                <MattressRowReadOnlyWithSizes
                                                key={row.id}
                                                row={row}
                                                orderSizes={orderSizes}
                                                onPrintMattress={handlePrintMattress}
                                                onDownloadMattress={handleDownloadMattress}
                                                onChangeMattress={handleChangeMattress}
                                                onActualLayersChange={handleActualLayersChange}
                                                editableActualLayers={editableActualLayers}
                                                />
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <MattressActionRowReadOnly table={table} />
                        </Box>
                    </MainCard>
                    </React.Fragment>
                ));
            })()}

            {/* Adhesive Tables Section */}
            {(() => {
                const filteredAdhesiveTables = adhesiveTables.filter(table => {
                    // For DELICIA cutting room, filter by selected destination
                    if (isDeliciaCuttingRoom && selectedDestination) {
                        return table.destination === selectedDestination;
                    }
                    // For other cutting rooms, show all tables
                    return true;
                });

                if (isDeliciaCuttingRoom && selectedDestination) {
                    // Show filtered adhesive tables for selected destination
                }

                return filteredAdhesiveTables.length > 0 && filteredAdhesiveTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                {`Adhesives`}
                                <SubcontractorPlannedQuantityBar
                                    table={table}
                                    orderSizes={orderSizes}
                                    getTablePlannedQuantities={getTablePlannedQuantities}
                                    getTablePlannedByBagno={getTablePlannedByBagno}
                                    getMetersByBagno={getMetersByBagno}
                                    getWidthsByBagno={getWidthsByBagno}
                                />
                            </Box>
                        }
                    >
                    <AdhesiveGroupCardReadOnly table={table} />

                        <Box>
                            <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table>
                                    <AdhesiveTableHeaderWithSizes orderSizes={orderSizes} />
                                    <TableBody>
                                        {(() => {
                                            // Group rows by bagno and sort by final part of mattress ID (001, 002, 003) within each group
                                            const sortedRows = [...table.rows].sort((a, b) => {
                                                const bagnoA = a.bagno || '';
                                                const bagnoB = b.bagno || '';

                                                // If bagnos are different, sort by the sequence number of the first mattress in each bagno
                                                if (bagnoA !== bagnoB) {
                                                    // Find the first mattress in each bagno group and compare their sequence numbers
                                                    const firstMattressA = table.rows.find(row => (row.bagno || '') === bagnoA);
                                                    const firstMattressB = table.rows.find(row => (row.bagno || '') === bagnoB);

                                                    const sequenceA = firstMattressA ? parseInt(firstMattressA.sequenceNumber) || 0 : 0;
                                                    const sequenceB = firstMattressB ? parseInt(firstMattressB.sequenceNumber) || 0 : 0;

                                                    return sequenceA - sequenceB;
                                                }

                                                // If same bagno, sort by sequence number (final part of mattress ID: 001, 002, 003)
                                                const sequenceA = parseInt(a.sequenceNumber) || 0;
                                                const sequenceB = parseInt(b.sequenceNumber) || 0;
                                                return sequenceA - sequenceB;
                                            });

                                            return sortedRows.map((row) => (
                                                <AdhesiveRowReadOnlyWithSizes
                                                key={row.id}
                                                row={row}
                                                orderSizes={orderSizes}
                                                onPrintMattress={handlePrintMattress}
                                                onDownloadMattress={handleDownloadMattress}
                                                onChangeMattress={handleChangeMattress}
                                                onActualLayersChange={handleActualLayersChange}
                                                editableActualLayers={editableActualLayers}
                                                />
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <AdhesiveActionRowReadOnly table={table} />
                        </Box>
                    </MainCard>
                    </React.Fragment>
                ));
            })()}

            {/* Destination Print Dialog */}
            <DestinationPrintDialog
                open={openDestinationPrintDialog}
                onClose={handleCloseDestinationPrintDialog}
                destinations={availableDestinations}
                onPrintDestination={handlePrintDestination}
                onPrintAll={handlePrintAll}
            />

            {/* Width Change Dialog */}
            <SubcontractorWidthChangeDialog
                open={widthChangeDialog.open}
                onClose={handleCloseWidthChangeDialog}
                mattressData={widthChangeDialog.mattressData}
                onSubmit={handleSubmitWidthChangeRequest}
                currentUser={currentUser}
            />

            {/* Success/Error Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        padding: "12px 16px",
                        fontSize: "1.1rem",
                        lineHeight: "1.5",
                        borderRadius: "8px"
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default SubcontractorView;
