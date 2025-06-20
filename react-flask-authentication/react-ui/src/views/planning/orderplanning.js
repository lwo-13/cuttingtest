import React, { useEffect, useState, useRef } from 'react';
import { Typography, Box, Table, TableBody, TableContainer, Paper, IconButton, Button, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Collapse } from '@mui/material';
import { AddCircleOutline, Calculate, Summarize } from '@mui/icons-material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons';

import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// Order Planning Components
import OrderActionBar from 'views/planning/OrderPlanning/components/OrderActionBar';
import OrderToolbar from 'views/planning/OrderPlanning/components/OrderToolbar';
import OrderQuantities from 'views/planning/OrderPlanning/components/OrderQuantities';



// Pad Print Components
import PadPrintInfo from 'views/planning/OrderPlanning/components/PadPrintInfo';
import PadPrintInfoManual from 'views/planning/OrderPlanning/components/PadPrintInfoManual';

// Production Center Components
import ProductionCenterTabs from 'views/planning/OrderPlanning/components/ProductionCenterTabs';

// Mattress Components
import MattressGroupCard from 'views/planning/OrderPlanning/components/MattressGroupCard';
import PlannedQuantityBar from 'views/planning/OrderPlanning/components/PlannedQuantityBar';
import MattressTableHeader from 'views/planning/OrderPlanning/components/MattressTableHeader';
import MattressRow from 'views/planning/OrderPlanning/components/MattressRow';
import MattressActionRow from 'views/planning/OrderPlanning/components/MattressActionRow';

// Adhesive Components
import AdhesiveGroupCard from 'views/planning/OrderPlanning/components/AdhesiveGroupCard';
import AdhesiveTableHeader from 'views/planning/OrderPlanning/components/AdhesiveTableHeader';
import AdhesiveRow from 'views/planning/OrderPlanning/components/AdhesiveRow';
import AdhesiveActionRow from 'views/planning/OrderPlanning/components/AdhesiveActionRow';

// Along Components
import AlongGroupCard from 'views/planning/OrderPlanning/components/AlongGroupCard';
import AlongRow from 'views/planning/OrderPlanning/components/AlongRow';
import AlongTableHeader from 'views/planning/OrderPlanning/components/AlongTableHeader';
import AlongActionRow from 'views/planning/OrderPlanning/components/AlongActionRow';

// Weft Components
import WeftGroupCard from 'views/planning/OrderPlanning/components/WeftGroupCard';
import WeftTableHeader from 'views/planning/OrderPlanning/components/WeftTableHeader';
import WeftRow from 'views/planning/OrderPlanning/components/WeftRow';
import WeftActionRow from 'views/planning/OrderPlanning/components/WeftActionRow';

// Bias Components
import BiasGroupCard from 'views/planning/OrderPlanning/components/BiasGroupCard';
import BiasTableHeader from 'views/planning/OrderPlanning/components/BiasTableHeader';
import BiasRow from 'views/planning/OrderPlanning/components/BiasRow';
import BiasActionRow from 'views/planning/OrderPlanning/components/BiasActionRow';

// Calculator Component
import MarkerCalculatorDialog from 'views/planning/OrderPlanning/components/MarkerCalculatorDialog';

// Summary Component
import MattressSummaryDialog from 'views/planning/OrderPlanning/components/MattressSummaryDialog';

// Comment Components
import CommentCard from 'views/planning/OrderPlanning/components/CommentCard';
import StyleCommentCard from 'views/planning/OrderPlanning/components/StyleCommentCard';

// Hooks
import useItalianRatios from 'views/planning/OrderPlanning/hooks/useItalianRatios';
import usePadPrintInfo from 'views/planning/OrderPlanning/hooks/usePadPrintInfo';
import useBrandInfo from 'views/planning/OrderPlanning/hooks/useBrandInfo';
import useMattressTables from 'views/planning/OrderPlanning/hooks/useMattressTables';
import useAdhesiveTables from 'views/planning/OrderPlanning/hooks/useAdhesiveTables';
import useAlongTables from 'views/planning/OrderPlanning/hooks/useAlongTables';
import useWeftTables from 'views/planning/OrderPlanning/hooks/useWeftTables';
import useBiasTables from 'views/planning/OrderPlanning/hooks/useBiasTables';
import useHandleSave from 'views/planning/OrderPlanning/hooks/useHandleSave';
import useHandleOrderChange from 'views/planning/OrderPlanning/hooks/useHandleOrderChange';
import useAvgConsumption from 'views/planning/OrderPlanning/hooks/useAvgConsumption';
import useProductionCenterTabs from 'views/planning/OrderPlanning/hooks/useProductionCenterTabs';
// import useUnsavedChanges from 'views/planning/OrderPlanning/hooks/useUnsavedChanges';

// Utils
import { getTablePlannedQuantities, getTablePlannedByBagno, getMetersByBagno } from 'views/planning/OrderPlanning/utils/plannedQuantities';
import { usePrintStyles, handlePrint, getAllDestinations, getDestinationsInTabOrder, handleDestinationPrint } from 'views/planning/OrderPlanning/utils/printUtils';
import { sortSizes } from 'views/planning/OrderPlanning/utils/sortSizes';

// Destination Print Dialog
import DestinationPrintDialog from 'views/planning/OrderPlanning/components/DestinationPrintDialog';

// Collaretto Consumption Info
import CollarettoConsumptionInfo from 'views/planning/OrderPlanning/components/CollarettoConsumptionInfo';

// Sample Fabric Types
const fabricTypeOptions = ["01", "02", "03", "04", "05", "06", "10", "13"];

// Spreading Options
const spreadingOptions = ["AUTOMATIC", "MANUAL"];

// Spreading Methods
const spreadingMethods = ["FACE UP", "FACE DOWN", "FACE TO FACE"];

const OrderPlanning = () => {
    const { t } = useTranslation();
    const history = useHistory();

    const [orderOptions, setOrderOptions] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [styleOptions, setStyleOptions] = useState([]);
    const [selectedStyle, setSelectedStyle] = useState("");
    const [selectedSeason, setSelectedSeason] = useState("");
    const [selectedColorCode, setSelectedColorCode] = useState("");
    const [orderSizes, setOrderSizes] = useState([]); // ✅ Stores full objects (for qty display)
    const [orderSizeNames, setOrderSizeNames] = useState([]); // ✅ Stores only size names (for table columns)
    const [markerOptions, setMarkerOptions] = useState([]);
    const [deletedMattresses, setDeletedMattresses] = useState([]);
    const [deletedAdhesive, setDeletedAdhesive] = useState([]);
    const [deletedAlong, setDeletedAlong] = useState([]);
    const [deletedWeft, setDeletedWeft] = useState([]);
    const [deletedBias, setDeletedBias] = useState([]);
    const [deletedTableIds, setDeletedTableIds] = useState([]); // Track deleted table IDs for production center cleanup
    const [deletedCombinations, setDeletedCombinations] = useState([]); // Track deleted production center combinations

    // Basic unsaved changes tracking (temporary fallback)
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Temporary fallback functions
    const clearAllChanges = () => setUnsavedChanges(false);
    const getChangeSummary = () => '';

    // Enhanced unsaved changes tracking (commented out temporarily)
    // const {
    //     unsavedChanges,
    //     changeDetails,
    //     markChange,
    //     clearAllChanges,
    //     getChangeSummary,
    //     setUnsavedChanges // Legacy compatibility
    // } = useUnsavedChanges();

    const [styleTouched, setStyleTouched] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [openError, setOpenError] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [openSuccess, setOpenSuccess] = useState(false);

    const [infoMessage, setInfoMessage] = useState("");
    const [openInfo, setOpenInfo] = useState(false);

    // State for unsaved changes dialog
    const [openUnsavedDialog, setOpenUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // State for discard confirmation dialog
    const [openDiscardDialog, setOpenDiscardDialog] = useState(false);

    // State for calculator dialog
    const [openCalculatorDialog, setOpenCalculatorDialog] = useState(false);

    // State for summary dialog
    const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
    const [selectedTableForSummary, setSelectedTableForSummary] = useState(null);

    // State for comment cards
    const [showCommentCard, setShowCommentCard] = useState(false);
    const [commentData, setCommentData] = useState({ comment_text: '', hasChanges: false, resetState: null });

    // State for card collapse/expand functionality
    const [collapsedCards, setCollapsedCards] = useState({
        mattress: {},  // { tableId: boolean }
        adhesive: {},  // { tableId: boolean }
        along: {},     // { tableId: boolean }
        weft: {},      // { tableId: boolean }
        bias: {}       // { tableId: boolean }
    });

    // Italian Ratio
    const italianRatios = useItalianRatios(selectedOrder);

    // Fetch Pad Print
    const { padPrintInfo, fetchPadPrintInfo, clearPadPrintInfo } = usePadPrintInfo();

    // Manual Pad Print
    const [manualPattern, setManualPattern] = useState('');
    const [manualColor, setManualColor] = useState('');

    // Fetch Brand
    const { brand, fetchBrandForStyle, clearBrand } = useBrandInfo();



    // Pin Order Planning Card
    const [isPinned, setIsPinned] = useState(false);

    // User
    const username = useSelector((state) => state.account?.user?.username) || "Unknown";

    // Mattress Tables
    const {
        tables,
        setTables,
        handleAddTable,
        handleRemoveTable,
        handleAddRow,
        handleBulkAddRows,
        handleRemoveRow,
        handleInputChange,
        updateExpectedConsumption
    } = useMattressTables({ orderSizeNames, setDeletedMattresses, setUnsavedChanges, setDeletedTableIds });

    // Adhesive Tables
    const {
        tables: adhesiveTables,
        setTables: setAdhesiveTables,
        handleAddTable: handleAddAdhesiveTable,
        handleRemoveTable: handleRemoveAdhesiveTable,
        handleAddRow: handleAddAdhesiveRow,
        handleRemoveRow: handleRemoveAdhesiveRow,
        handleInputChange: handleAdhesiveInputChange,
        updateExpectedConsumption: updateAdhesiveExpectedConsumption
    } = useAdhesiveTables({ orderSizeNames, setDeletedMattresses: setDeletedAdhesive, setUnsavedChanges, setDeletedTableIds });

    // Along Tables
    const {
        alongTables,
        setAlongTables,
        handleAddTable: handleAddAlong,
        handleRemoveTable: handleRemoveAlong,
        handleAddRow: handleAddRowAlong,
        handleRemoveRow: handleRemoveAlongRow,
        handleInputChange: handleAlongRowChange,
        handleExtraChange: handleAlongExtraChange
    } = useAlongTables({ setUnsavedChanges, setDeletedAlong, setDeletedTableIds });

    // Weft Tables
    const {
        weftTables,
        setWeftTables,
        handleAddWeft,
        handleRemoveWeft,
        handleAddRow: handleAddRowWeft,
        handleRemoveRow: handleRemoveWeftRow,
        handleInputChange: handleWeftRowChange,
        handleExtraChange: handleWeftExtraChange
    } = useWeftTables({ setUnsavedChanges, setDeletedWeft, setDeletedTableIds });

    // Bias Tables
    const {
        biasTables,
        setBiasTables,
        handleAddBias,
        handleRemoveBias,
        handleAddRow: handleAddRowBias,
        handleRemoveRow: handleRemoveBiasRow,
        handleInputChange: handleBiasRowChange,
    } = useBiasTables({ setUnsavedChanges, setDeletedBias, setDeletedTableIds });

    // Save
    const { saving, handleSave } = useHandleSave({
        tables,
        adhesiveTables,
        alongTables,
        weftTables,
        biasTables,
        padPrintInfo,
        manualPattern,
        manualColor,
        selectedOrder,
        selectedStyle,
        selectedColorCode,
        selectedSeason,
        username,
        brand,
        deletedMattresses,
        deletedAdhesive,
        deletedAlong,
        deletedWeft,
        deletedBias,
        setDeletedMattresses,
        setDeletedAdhesive,
        setDeletedAlong,
        setDeletedWeft,
        setDeletedBias,
        deletedTableIds,
        setDeletedTableIds,
        deletedCombinations,
        setDeletedCombinations,
        setErrorMessage,
        setOpenError,
        setSuccessMessage,
        setOpenSuccess,
        setUnsavedChanges,
        commentData
    });

    // Order Change
    const { onOrderChange } = useHandleOrderChange({
        setSelectedOrder,
        setOrderSizes,
        setOrderSizeNames,
        setSelectedStyle,
        setStyleTouched,
        setSelectedSeason,
        setSelectedColorCode,
        fetchPadPrintInfo,
        fetchBrandForStyle,
        setTables,
        setAdhesiveTables,
        setAlongTables,
        setWeftTables,
        setBiasTables,
        setMarkerOptions,
        setManualPattern,
        setManualColor,
        setUnsavedChanges,
        handleWeftRowChange,
        sortSizes,
        clearBrand,
        clearPadPrintInfo,
        styleTouched,
        setShowCommentCard,
        // Deletion tracking setters
        setDeletedMattresses,
        setDeletedAdhesive,
        setDeletedAlong,
        setDeletedWeft,
        setDeletedBias,
        setDeletedTableIds,
        setDeletedCombinations
    });

    // Print Styles
    usePrintStyles();

    // Average Consumption per table
    const avgConsumption = useAvgConsumption(tables, getTablePlannedQuantities);
    const avgAdhesiveConsumption = useAvgConsumption(adhesiveTables, getTablePlannedQuantities);

    // Production Center Tabs Management
    const {
        selectedCombination,
        selectedCombinationId,
        productionCenterOptions,
        handleCombinationChange,
        filteredTables,
        filteredAdhesiveTables,
        filteredAlongTables,
        filteredWeftTables,
        filteredBiasTables,
        assignCombinationToNewTable,
        updateTablesWithCombination,
        getCombinationSummary
    } = useProductionCenterTabs({
        selectedOrder,
        tables: tables || [],
        adhesiveTables: adhesiveTables || [],
        alongTables: alongTables || [],
        weftTables: weftTables || [],
        biasTables: biasTables || [],
        setUnsavedChanges
    });

    // Auto-assign production center combination to tables
    useEffect(() => {
        if (!selectedCombination || !assignCombinationToNewTable) return;

        // Check for tables and assign/update the selected combination
        const updateTablesWithCombination = (currentTables, setTablesFunction) => {
            if (!currentTables || currentTables.length === 0) return;

            const updatedTables = currentTables.map(table => {
                // Case 1: Table doesn't have production center data - assign the selected combination
                if (!table.productionCenter && !table.cuttingRoom && !table.destination) {
                    return assignCombinationToNewTable(table);
                }

                // Case 2: Table has production center data that matches the selected combination ID
                // This handles the case where a combination was edited and we need to update existing tables
                if (selectedCombination.combination_id &&
                    table.combinationId === selectedCombination.combination_id) {
                    return assignCombinationToNewTable(table);
                }

                return table;
            });

            // Only update if there are actual changes
            const hasChanges = updatedTables.some((table, index) =>
                table.productionCenter !== currentTables[index].productionCenter ||
                table.cuttingRoom !== currentTables[index].cuttingRoom ||
                table.destination !== currentTables[index].destination
            );

            if (hasChanges) {
                setTablesFunction(updatedTables);
                setUnsavedChanges(true);
            }
        };

        updateTablesWithCombination(tables, setTables);
        updateTablesWithCombination(adhesiveTables, setAdhesiveTables);
        updateTablesWithCombination(alongTables, setAlongTables);
        updateTablesWithCombination(weftTables, setWeftTables);
        updateTablesWithCombination(biasTables, setBiasTables);
    }, [selectedCombination, assignCombinationToNewTable, tables, adhesiveTables, alongTables, weftTables, biasTables]);

    // Destination Print Dialog State
    const [openDestinationPrintDialog, setOpenDestinationPrintDialog] = useState(false);
    const [availableDestinations, setAvailableDestinations] = useState([]);

    // Ref for ProductionCenterTabs to access switchToDestinationTab function
    const productionCenterTabsRef = useRef();

    // Enhanced Print Handler
    const handleEnhancedPrint = () => {
        // Try to get destinations in tab order first
        const combinations = productionCenterTabsRef.current?.getCombinations?.();
        let destinations;

        if (combinations && combinations.length > 0) {
            // Use tab order if combinations are available
            destinations = getDestinationsInTabOrder(combinations);
        } else {
            // Fallback to alphabetical order
            destinations = getAllDestinations(tables, adhesiveTables, alongTables, weftTables, biasTables);
        }

        if (destinations.length <= 1) {
            // Single or no destination - print normally
            handlePrint(tables, adhesiveTables, alongTables, weftTables, biasTables, collapsedCards, setCollapsedCards);
        } else {
            // Multiple destinations - show selection dialog
            setAvailableDestinations(destinations);
            setOpenDestinationPrintDialog(true);
        }
    };

    // Handle destination-specific printing
    const handlePrintDestination = (selectedDestination) => {
        setOpenDestinationPrintDialog(false);

        // Get the switchToDestinationTab function from ProductionCenterTabs
        const switchToDestinationTab = productionCenterTabsRef.current?.switchToDestinationTab;

        handleDestinationPrint(
            selectedDestination,
            tables,
            adhesiveTables,
            alongTables,
            weftTables,
            biasTables,
            collapsedCards,
            setCollapsedCards,
            switchToDestinationTab
        );
    };

    // Handle print all destinations
    const handlePrintAll = () => {
        setOpenDestinationPrintDialog(false);
        handlePrint(tables, adhesiveTables, alongTables, weftTables, biasTables, collapsedCards, setCollapsedCards);
    };

    // Close destination print dialog
    const handleCloseDestinationPrintDialog = () => {
        setOpenDestinationPrintDialog(false);
    };

    const handleCloseError = (_, reason) => {
        if (reason === 'clickaway') return;
        setOpenError(false);
    };

    const handleCloseSuccess = (_, reason) => {
        if (reason === "clickaway") return;
        setOpenSuccess(false);
    };

    const handleCloseInfo = (_, reason) => {
        if (reason === "clickaway") return;
        setOpenInfo(false);
    };

    // Handle closing the unsaved changes dialog
    const handleCloseUnsavedDialog = () => {
        setOpenUnsavedDialog(false);
        setPendingNavigation(null);
    };

    // Handle saving changes and then navigating
    const handleSaveAndNavigate = async () => {
        try {
            await handleSave();
            // Clear all change tracking after successful save
            clearAllChanges();

            // Show success message
            setSuccessMessage('Changes saved successfully! Continuing...');
            setOpenSuccess(true);

            // After successful save, proceed with navigation
            if (pendingNavigation && typeof pendingNavigation === 'function') {
                pendingNavigation();
            }
            setOpenUnsavedDialog(false);
            setPendingNavigation(null);
        } catch (error) {
            // Save failed, keep dialog open and show error
            console.error('Save failed:', error);
            setErrorMessage('Failed to save changes. Please try again.');
            setOpenError(true);
        }
    };

    // Handle discarding changes without navigation
    const handleDiscard = () => {
        setOpenDiscardDialog(true);
    };

    // Confirm discard action
    const handleConfirmDiscard = () => {
        // Clear all change tracking
        clearAllChanges();

        // Reload the original data from the server to discard all changes
        if (selectedOrder) {
            console.log('Discarding changes and reloading original data...');
            onOrderChange(selectedOrder);
        }

        // Show success message
        setInfoMessage('Changes discarded successfully. Data has been reverted to the last saved state.');
        setOpenInfo(true);

        setOpenDiscardDialog(false);
    };

    // Cancel discard action
    const handleCancelDiscard = () => {
        setOpenDiscardDialog(false);
    };

    // Handle discarding changes and navigating
    const handleDiscardAndNavigate = () => {
        // Clear all change tracking
        clearAllChanges();

        // Reload the original data from the server to discard all changes
        if (selectedOrder) {
            console.log('Discarding changes and reloading original data...');
            onOrderChange(selectedOrder);
        }

        // Proceed with navigation if there was a pending navigation
        if (pendingNavigation && typeof pendingNavigation === 'function') {
            pendingNavigation();
        }

        setOpenUnsavedDialog(false);
        setPendingNavigation(null);
    };



    // Handle calculator dialog
    const handleOpenCalculator = () => {
        setOpenCalculatorDialog(true);
    };

    const handleCloseCalculator = () => {
        setOpenCalculatorDialog(false);
    };

    // Handle summary dialog
    const handleOpenSummary = (table) => {
        setSelectedTableForSummary(table);
        setOpenSummaryDialog(true);
    };

    const handleCloseSummary = () => {
        setOpenSummaryDialog(false);
        setSelectedTableForSummary(null);
    };

    // Handle comment card
    const handleAddComment = () => {
        setShowCommentCard(true);
        setUnsavedChanges(true);
    };

    const handleRemoveComment = () => {
        setShowCommentCard(false);
        // Mark comment for deletion by setting empty text with changes flag
        setCommentData({
            comment_text: '',
            hasChanges: true,
            resetState: null,
            isDeleted: true  // Flag to indicate this comment should be deleted
        });
        setUnsavedChanges(true);
    };

    const handleCommentChange = (data) => {
        setCommentData(data);
    };



    // Handle card collapse/expand functionality
    const toggleCardCollapse = (cardType, tableId) => {
        setCollapsedCards(prev => ({
            ...prev,
            [cardType]: {
                ...prev[cardType],
                [tableId]: !prev[cardType][tableId]
            }
        }));
    };



    // Override history.block to show our custom dialog
    useEffect(() => {
        // This will be called when the user tries to navigate away
        const unblock = history.block((location) => {
            if (unsavedChanges) {
                // Store the navigation function to be called after user confirms
                setPendingNavigation(() => () => history.push(location.pathname));
                setOpenUnsavedDialog(true);
                return false; // Prevent immediate navigation
            }
            return true; // Allow navigation
        });

        return () => {
            // Clean up when component unmounts
            unblock();
        };
    }, [history, unsavedChanges]);

    // Handle page navigation warning when unsaved changes exist (browser close/refresh)
    useEffect(() => {
        // Function to handle beforeunload event
        const handleBeforeUnload = (event) => {
            if (unsavedChanges) {
                // Standard way to show a confirmation dialog before leaving the page
                const message = "You have unsaved changes. Save your work before leaving.";
                event.preventDefault();
                event.returnValue = message; // For older browsers
                return message; // For modern browsers
            }
        };

        // Add event listener when component mounts or unsavedChanges changes
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Clean up event listener when component unmounts or unsavedChanges changes
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [unsavedChanges]);

    // Auto-refresh functionality with unsaved changes protection
    useEffect(() => {
        let refreshInterval;

        const handleAutoRefresh = () => {
            if (unsavedChanges) {
                // Don't auto-refresh if there are unsaved changes
                console.log('Auto-refresh skipped due to unsaved changes');
                setInfoMessage('Auto-refresh skipped - you have unsaved changes. Save your work to enable auto-refresh.');
                setOpenInfo(true);
                return;
            }

            // Only refresh if we have a selected order
            if (selectedOrder) {
                console.log('Auto-refreshing order data...');
                onOrderChange(selectedOrder);
            }
        };

        // Set up auto-refresh every 5 minutes (300000 ms)
        refreshInterval = setInterval(handleAutoRefresh, 300000);

        // Clean up interval on unmount
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [unsavedChanges, selectedOrder, onOrderChange]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl+S or Cmd+S to save
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                if (unsavedChanges && !saving) {
                    handleSave();
                }
            }
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyDown);

        // Clean up event listener
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [unsavedChanges, saving, handleSave]);

    // Fetch order data from Flask API
    useEffect(() => {
        axios.get('/orders/order_lines')
            .then(response => {
                if (response.data.success) {
                    const ordersMap = new Map();

                    response.data.data.forEach(row => {
                        if (row.status === 3) {  // ✅ Only include status = 3
                            if (!ordersMap.has(row.order_commessa)) {
                                ordersMap.set(row.order_commessa, {
                                    id: row.order_commessa,  // ✅ Use only id
                                    style: row.style,  // ✅ Unique style per order
                                    season: row.season,  // ✅ Unique season per order
                                    colorCode: row.color_code,  // ✅ Unique color code per order
                                    sizes: []  // ✅ Initialize array for sizes
                                });
                            }

                            // Append sizes dynamically
                            ordersMap.get(row.order_commessa).sizes.push({
                                size: row.size,
                                qty: parseFloat(row.quantity.toString().replace(",", "")) || 0 // ✅ Convert quantity to number
                            });
                        }
                    });

                    const sortedOrders = Array.from(ordersMap.values()).map(order => ({
                        ...order,
                        sizes: sortSizes(order.sizes || [])
                    }));
                    setOrderOptions(sortedOrders);

                    const uniqueStyles = [
                        ...new Set(sortedOrders.map(order => order.style).filter(Boolean))
                      ];
                      setStyleOptions(uniqueStyles);
                } else {
                    console.error("Failed to fetch orders");
                }
            })
            .catch(error => console.error("Error fetching order data:", error));
    }, []);

    const filteredOrders = selectedStyle
        ? orderOptions.filter(order => order.style === selectedStyle)
        : orderOptions;

    // Manual marker refresh function
    const [refreshingMarkers, setRefreshingMarkers] = useState(false);

    const fetchMarkerData = async () => {
        if (!selectedOrder) return;

        setRefreshingMarkers(true);
        try {
            const response = await axios.get(`/markers/marker_headers_planning`, {
                params: {
                    style: selectedStyle,
                    sizes: orderSizeNames.join(',')
                }
            });

            if (response.data.success) {
                setMarkerOptions(response.data.data);
                console.log("Markers refreshed manually");
            } else {
                console.error("Failed to fetch markers");
            }
        } catch (error) {
            console.error("Error fetching marker data:", error);
        } finally {
            setRefreshingMarkers(false);
        }
    };

    // Fetch marker data from Flask API
    useEffect(() => {
        fetchMarkerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrder, selectedStyle, orderSizeNames]); // ✅ Runs when order, style, or size names change

    // Handle Style Change with unsaved changes protection
    const handleStyleChange = (newStyle, touched = false) => {
        if (touched && unsavedChanges) {
            // Store the pending style change
            setPendingNavigation(() => () => {
                onOrderChange(null); // Reset everything
                setTimeout(() => {
                    setSelectedStyle(newStyle);
                }, 0);
            });
            setOpenUnsavedDialog(true);
            return;
        }

        setStyleTouched(touched);

        if (touched) {
          onOrderChange(null); // ✅ This resets everything already
          setTimeout(() => {
            setSelectedStyle(newStyle);
          }, 0);
        } else {
          setSelectedStyle(newStyle);
        }
    };

    // Enhanced order change handler with unsaved changes protection
    const handleOrderChangeWithProtection = (newOrder) => {
        if (unsavedChanges && newOrder !== selectedOrder) {
            // Store the pending order change
            setPendingNavigation(() => () => onOrderChange(newOrder));
            setOpenUnsavedDialog(true);
            return;
        }

        onOrderChange(newOrder);
    };

    const isTableEditable = (table) => {
        return table.rows.every(row => row.isEditable !== false);
    };

    return (
        <>
            {/* Order Bar */}
            <Box
                sx={{
                    position: isPinned ? 'sticky' : 'relative',
                    top: isPinned ? 85 : 'auto',
                    zIndex: isPinned ? 1000 : 'auto',
                }}
            >
                <MainCard
                    title={
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {t('orderPlanning.orderDetails', 'Order Details')}
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* Collaretto Info */}
                                {selectedOrder && tables.length > 0 && tables[0].fabricCode && (
                                    <CollarettoConsumptionInfo
                                        style={selectedOrder.style}
                                        fabricCode={tables[0].fabricCode}
                                        plannedByBagno={getTablePlannedByBagno(tables[0]).bagnoMap}
                                    />
                                )}

                                {/* Order Actions Bar in Header */}
                                <OrderActionBar
                                    unsavedChanges={unsavedChanges}
                                    handleSave={handleSave}
                                    handlePrint={handleEnhancedPrint}
                                    isPinned={isPinned}
                                    setIsPinned={setIsPinned}
                                    saving={saving}
                                    handleDiscard={handleDiscard}
                                />
                            </Box>
                        </Box>
                    }
                >

                    {/* Order Toolbar */}
                    <OrderToolbar
                        styleOptions={styleOptions}
                        selectedStyle={selectedStyle}
                        onStyleChange={handleStyleChange}
                        orderOptions={orderOptions}
                        filteredOrders={filteredOrders}
                        selectedOrder={selectedOrder}
                        onOrderChange={handleOrderChangeWithProtection}
                        selectedSeason={selectedSeason}
                        selectedBrand={brand}
                        selectedColorCode={selectedColorCode}
                    />

                    {/* Order Quantities Section */}
                    <OrderQuantities orderSizes={orderSizes} italianRatios={italianRatios} />

                </MainCard>
            </Box>

            <Box mt={2} />

            {/* Pad Print Section */}
            {selectedOrder && (
                <>
                    {padPrintInfo ? (
                        <PadPrintInfo padPrintInfo={padPrintInfo} />
                    ) : (
                        <PadPrintInfoManual
                            brand={brand?.toLowerCase()}
                            pattern={manualPattern}
                            setPattern={setManualPattern}
                            color={manualColor}
                            setColor={setManualColor}
                        />
                    )}
                </>
            )}

            <Box mt={2} />

            {/* Production Center Configuration Section */}
            {selectedOrder && (
                <ProductionCenterTabs
                    ref={productionCenterTabsRef}
                    selectedOrder={selectedOrder}
                    onCombinationChange={handleCombinationChange}
                    selectedCombinationId={selectedCombinationId}
                    setUnsavedChanges={setUnsavedChanges}
                    productionCenterOptions={productionCenterOptions}
                    orderSizes={orderSizes}
                    italianRatios={italianRatios}
                    updateTablesWithCombination={updateTablesWithCombination}
                    tables={tables}
                    setTables={setTables}
                    adhesiveTables={adhesiveTables}
                    setAdhesiveTables={setAdhesiveTables}
                    alongTables={alongTables}
                    setAlongTables={setAlongTables}
                    weftTables={weftTables}
                    setWeftTables={setWeftTables}
                    biasTables={biasTables}
                    setBiasTables={setBiasTables}
                    // Deletion tracking functions
                    setDeletedMattresses={setDeletedMattresses}
                    setDeletedAdhesive={setDeletedAdhesive}
                    setDeletedAlong={setDeletedAlong}
                    setDeletedWeft={setDeletedWeft}
                    setDeletedBias={setDeletedBias}
                    setDeletedTableIds={setDeletedTableIds}
                    setDeletedCombinations={setDeletedCombinations}
                />
            )}

            <Box mt={2} />

            {/* Mattress Group Section */}
            {filteredTables.length > 0 && filteredTables.map((table, tableIndex) => (
                <React.Fragment key={table.id}>
                   {/* ✅ Add spacing before every table except the first one */}
                   {tableIndex > 0 && <Box mt={2} />}
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <IconButton
                                        size="small"
                                        onClick={() => toggleCardCollapse('mattress', table.id)}
                                        sx={{
                                            color: 'text.secondary',
                                            '&:hover': { backgroundColor: 'action.hover' }
                                        }}
                                        title={collapsedCards.mattress[table.id] ? "Expand" : "Collapse"}
                                    >
                                        {collapsedCards.mattress[table.id] ?
                                            <IconChevronDown stroke={1.5} size="1rem" /> :
                                            <IconChevronUp stroke={1.5} size="1rem" />
                                        }
                                    </IconButton>
                                    {t('orderPlanning.mattresses', 'Mattresses')}
                                    <IconButton
                                        size="small"
                                        onClick={handleOpenCalculator}
                                        sx={{
                                            color: 'primary.main',
                                            '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                                        }}
                                        title="Marker Calculator"
                                    >
                                        <Calculate fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpenSummary(table)}
                                        sx={{
                                            color: 'secondary.main',
                                            '&:hover': { backgroundColor: 'secondary.light', color: 'white' }
                                        }}
                                        title="Table Summary"
                                    >
                                        <Summarize fontSize="small" />
                                    </IconButton>
                                </Box>

                                {/* Table-Specific Planned Quantities - Hide if Empty */}
                                <PlannedQuantityBar
                                    table={table}
                                    orderSizes={orderSizes}
                                    getTablePlannedQuantities={getTablePlannedQuantities}
                                    getTablePlannedByBagno={getTablePlannedByBagno}
                                    getMetersByBagno={getMetersByBagno}
                                />
                            </Box>

                        }
                    >
                        <Collapse in={!collapsedCards.mattress[table.id]} timeout="auto" unmountOnExit>
                            <MattressGroupCard
                                table={table}
                                tableId={table.id}
                                tables={tables}
                                fabricTypeOptions={fabricTypeOptions}
                                spreadingMethods={spreadingMethods}
                                spreadingOptions={spreadingOptions}
                                isTableEditable={isTableEditable}
                                setTables={setTables}
                                setUnsavedChanges={setUnsavedChanges}
                                updateExpectedConsumption={updateExpectedConsumption}
                                onRefreshMarkers={fetchMarkerData}
                                refreshingMarkers={refreshingMarkers}
                                markerOptions={markerOptions}
                                onBulkAddRows={handleBulkAddRows}
                            />

                            {/* Table Section */}
                            <Box>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                    <Table>
                                        <MattressTableHeader orderSizes={orderSizes} />
                                        <TableBody>
                                            {table.rows.map((row) => (
                                                <MattressRow
                                                key={row.id}
                                                row={row}
                                                rowId={row.id}
                                                tableId={table.id}
                                                table={table}
                                                orderSizes={orderSizes}
                                                markerOptions={markerOptions}
                                                setTables={setTables}
                                                handleInputChange={handleInputChange}
                                                handleRemoveRow={handleRemoveRow}
                                                setUnsavedChanges={setUnsavedChanges}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Action Row: Avg Consumption + Buttons aligned horizontally */}
                                <MattressActionRow
                                    avgConsumption={avgConsumption[table.id]}
                                    tableId={table.id}
                                    isTableEditable={isTableEditable}
                                    table={table}
                                    handleAddRow={(tableId) => handleAddRow(tableId)}
                                    handleRemoveTable={handleRemoveTable}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Adhesive Group Section */}
            {filteredAdhesiveTables.length > 0 && filteredAdhesiveTables.map((table) => (
                <React.Fragment key={table.id}>
                   {/* ✅ Add spacing before the first table and between subsequent tables */}
                   <Box mt={2} />
                    <MainCard
                        key={table.id}
                        data-table-id={table.id}
                        title={
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <IconButton
                                        size="small"
                                        onClick={() => toggleCardCollapse('adhesive', table.id)}
                                        sx={{
                                            color: 'text.secondary',
                                            '&:hover': { backgroundColor: 'action.hover' }
                                        }}
                                        title={collapsedCards.adhesive[table.id] ? "Expand" : "Collapse"}
                                    >
                                        {collapsedCards.adhesive[table.id] ?
                                            <IconChevronDown stroke={1.5} size="1rem" /> :
                                            <IconChevronUp stroke={1.5} size="1rem" />
                                        }
                                    </IconButton>
                                    {t('orderPlanning.adhesives', 'Adhesives')}
                                    <IconButton
                                        size="small"
                                        onClick={handleOpenCalculator}
                                        sx={{
                                            color: 'primary.main',
                                            '&:hover': { backgroundColor: 'primary.light', color: 'white' }
                                        }}
                                        title="Marker Calculator"
                                    >
                                        <Calculate fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpenSummary(table)}
                                        sx={{
                                            color: 'secondary.main',
                                            '&:hover': { backgroundColor: 'secondary.light', color: 'white' }
                                        }}
                                        title="Table Summary"
                                    >
                                        <Summarize fontSize="small" />
                                    </IconButton>
                                </Box>

                                {/* Table-Specific Planned Quantities - Hide if Empty */}
                                <PlannedQuantityBar
                                    table={table}
                                    orderSizes={orderSizes}
                                    getTablePlannedQuantities={getTablePlannedQuantities}
                                    getTablePlannedByBagno={getTablePlannedByBagno}
                                    getMetersByBagno={getMetersByBagno}
                                />
                            </Box>

                        }
                    >
                        <Collapse in={!collapsedCards.adhesive[table.id]} timeout="auto" unmountOnExit>
                            <AdhesiveGroupCard
                                table={table}
                                tableId={table.id}
                                tables={adhesiveTables}
                                fabricTypeOptions={fabricTypeOptions}
                                spreadingMethods={spreadingMethods}
                                spreadingOptions={spreadingOptions}
                                isTableEditable={isTableEditable}
                                setTables={setAdhesiveTables}
                                setUnsavedChanges={setUnsavedChanges}
                                updateExpectedConsumption={updateAdhesiveExpectedConsumption}
                            />

                            {/* Table Section */}
                            <Box>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                    <Table>
                                        <AdhesiveTableHeader orderSizes={orderSizes} />
                                        <TableBody>
                                            {table.rows.map((row) => (
                                                <AdhesiveRow
                                                key={row.id}
                                                row={row}
                                                rowId={row.id}
                                                tableId={table.id}
                                                table={table}
                                                orderSizes={orderSizes}
                                                markerOptions={markerOptions}
                                                setTables={setAdhesiveTables}
                                                handleInputChange={handleAdhesiveInputChange}
                                                handleRemoveRow={handleRemoveAdhesiveRow}
                                                setUnsavedChanges={setUnsavedChanges}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Action Row: Avg Consumption + Buttons aligned horizontally */}
                                <AdhesiveActionRow
                                    avgConsumption={avgAdhesiveConsumption[table.id]}
                                    tableId={table.id}
                                    isTableEditable={isTableEditable}
                                    table={table}
                                    handleAddRow={(tableId) => handleAddAdhesiveRow(tableId)}
                                    handleRemoveTable={handleRemoveAdhesiveTable}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                    </React.Fragment>
            ))}

            {/* Along Tables Section */}
            {filteredAlongTables.length > 0 && filteredAlongTables.map((table) => (
                <React.Fragment key={table.id}>

                    <Box mt={2} />

                    <MainCard
                        data-table-id={table.id}
                        title={
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => toggleCardCollapse('along', table.id)}
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': { backgroundColor: 'action.hover' }
                                    }}
                                    title={collapsedCards.along[table.id] ? "Expand" : "Collapse"}
                                >
                                    {collapsedCards.along[table.id] ?
                                        <IconChevronDown stroke={1.5} size="1rem" /> :
                                        <IconChevronUp stroke={1.5} size="1rem" />
                                    }
                                </IconButton>
                                Collaretto Along the Grain
                            </Box>
                        }
                    >
                        <Collapse in={!collapsedCards.along[table.id]} timeout="auto" unmountOnExit>
                            <AlongGroupCard
                                table={table}
                                tables={alongTables}
                                fabricTypeOptions={fabricTypeOptions}
                                isTableEditable={isTableEditable}
                                setTables={setAlongTables}
                                setUnsavedChanges={setUnsavedChanges}
                                handleAlongExtraChange={handleAlongExtraChange}
                                mattressTables={tables}
                                orderSizes={orderSizes}
                                handleAddRowAlong={handleAddRowAlong}
                            />

                            {/* Table Section */}
                            <Box>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                    <Table>
                                        <AlongTableHeader />
                                        <TableBody>
                                            {table.rows.map((row) => (
                                                <AlongRow
                                                    key={row.id}
                                                    row={row}
                                                    rowId={row.id}
                                                    table={table}
                                                    tableId={table.id}
                                                    handleInputChange={handleAlongRowChange}
                                                    handleRemoveRow={handleRemoveAlongRow}
                                                    setUnsavedChanges={setUnsavedChanges}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Button Container */}
                               <AlongActionRow
                                    tableId={table.id}
                                    table={table}
                                    isTableEditable={isTableEditable}
                                    handleAddRowAlong={handleAddRowAlong}
                                    handleRemoveAlongTable={handleRemoveAlong}
                                    setUnsavedChanges={setUnsavedChanges}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Weft Tables Section */}
            {filteredWeftTables.length > 0 && filteredWeftTables.map((table) => (

                <React.Fragment key={table.id}>
                    <Box mt={2} />

                    <MainCard
                        data-table-id={table.id}
                        title={
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => toggleCardCollapse('weft', table.id)}
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': { backgroundColor: 'action.hover' }
                                    }}
                                    title={collapsedCards.weft[table.id] ? "Expand" : "Collapse"}
                                >
                                    {collapsedCards.weft[table.id] ?
                                        <IconChevronDown stroke={1.5} size="1rem" /> :
                                        <IconChevronUp stroke={1.5} size="1rem" />
                                    }
                                </IconButton>
                                Collaretto in Weft
                            </Box>
                        }
                    >
                        <Collapse in={!collapsedCards.weft[table.id]} timeout="auto" unmountOnExit>
                            <WeftGroupCard
                                table={table}
                                tables={weftTables}
                                fabricTypeOptions={fabricTypeOptions}
                                isTableEditable={isTableEditable}
                                setTables={setWeftTables}
                                setUnsavedChanges={setUnsavedChanges}
                                handleWeftExtraChange={handleWeftExtraChange}
                                mattressTables={tables}
                                orderSizes={orderSizes}
                                handleAddRowWeft={handleAddRowWeft}
                                />

                            {/* Table Section */}
                            <Box>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                        <Table>
                                            <WeftTableHeader />
                                            <TableBody>
                                            {table.rows.map((row) => (
                                                <WeftRow
                                                key={row.id}
                                                row={row}
                                                rowId={row.id}
                                                table={table}
                                                tableId={table.id}
                                                handleInputChange={handleWeftRowChange}
                                                handleRemoveRow={handleRemoveWeftRow}
                                                setUnsavedChanges={setUnsavedChanges}
                                                />
                                            ))}
                                            </TableBody>
                                        </Table>
                                </TableContainer>

                                {/* Button Container */}
                                <WeftActionRow
                                    tableId={table.id}
                                    table={table}
                                    isTableEditable={isTableEditable}
                                    handleAddRowWeft={handleAddRowWeft}
                                    handleRemoveWeft={handleRemoveWeft}
                                    setUnsavedChanges={setUnsavedChanges}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* BiasTables Section */}
            {filteredBiasTables.length > 0 && filteredBiasTables.map((table) => (

                <React.Fragment key={table.id}>
                    <Box mt={2} />

                    <MainCard
                        data-table-id={table.id}
                        title={
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => toggleCardCollapse('bias', table.id)}
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': { backgroundColor: 'action.hover' }
                                    }}
                                    title={collapsedCards.bias[table.id] ? "Expand" : "Collapse"}
                                >
                                    {collapsedCards.bias[table.id] ?
                                        <IconChevronDown stroke={1.5} size="1rem" /> :
                                        <IconChevronUp stroke={1.5} size="1rem" />
                                    }
                                </IconButton>
                                Collaretto in Bias
                            </Box>
                        }
                    >
                        <Collapse in={!collapsedCards.bias[table.id]} timeout="auto" unmountOnExit>
                            <BiasGroupCard
                                key={table.id}
                                table={table}
                                tables={biasTables}
                                fabricTypeOptions={fabricTypeOptions}
                                isTableEditable={isTableEditable}
                                setTables={setBiasTables}
                                setUnsavedChanges={setUnsavedChanges}
                                />

                            {/* Table Section */}
                            <Box>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                        <Table>
                                            <BiasTableHeader />
                                            <TableBody>
                                            {table.rows.map((row) => (
                                                <BiasRow
                                                key={row.id}
                                                row={row}
                                                rowId={row.id}
                                                table={table}
                                                tableId={table.id}
                                                handleInputChange={handleBiasRowChange}
                                                handleRemoveRow={handleRemoveBiasRow}
                                                setUnsavedChanges={setUnsavedChanges}
                                                />
                                            ))}
                                            </TableBody>
                                        </Table>
                                </TableContainer>

                                {/* Button Container */}
                                <BiasActionRow
                                    tableId={table.id}
                                    table={table}
                                    isTableEditable={isTableEditable}
                                    handleAddRowBias={handleAddRowBias}
                                    handleRemoveBias={handleRemoveBias}
                                    setUnsavedChanges={setUnsavedChanges}
                                />

                            </Box>
                        </Collapse>
                    </MainCard>
                </React.Fragment>
            ))}

            {/* Comment Card Section */}
            {selectedOrder && showCommentCard && (
                <Box mt={3}>
                    <CommentCard
                        selectedOrder={selectedOrder}
                        onRemove={handleRemoveComment}
                        setUnsavedChanges={setUnsavedChanges}
                        onCommentChange={handleCommentChange}
                    />
                </Box>
            )}

            {/* Style Comment Card Section - Always visible when style is selected */}
            {selectedStyle && (
                <Box mt={3}>
                    <StyleCommentCard
                        selectedStyle={selectedStyle}
                    />
                </Box>
            )}



            {selectedOrder && (
                <Box mt={2} display="flex" justifyContent="flex-start" gap={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddTable}
                    >
                        {t('orderPlanning.addMattress', 'Add Mattress')}
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddAdhesiveTable}
                    >
                        {t('orderPlanning.addAdhesive', 'Add Adhesive')}
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddAlong}
                    >
                        {t('orderPlanning.addCollarettoAlong', 'Add Collaretto Along Grain (Ordito)')}
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddWeft}
                    >
                        {t('orderPlanning.addCollarettoWeft', 'Add Collaretto Weft (Trama)')}
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddBias}
                    >
                        {t('orderPlanning.addCollarettoBias', 'Add Collaretto Bias (Sbieco)')}
                    </Button>

                    {!showCommentCard && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<AddCircleOutline />}
                            onClick={handleAddComment}
                        >
                            {t('orderPlanning.addComment', 'Add Comment')}
                        </Button>
                    )}


                </Box>
            )}

            {/* Error Snackbar */}
            <Snackbar
                open={openError}
                autoHideDuration={5000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    {errorMessage}
                </Alert>
            </Snackbar>

            {/* ✅ Success Message Snackbar */}
            <Snackbar
                open={openSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%', padding: "12px 16px", fontSize: "1.1rem", lineHeight: "1.5", borderRadius: "8px" }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Info Message Snackbar */}
            <Snackbar
                open={openInfo}
                autoHideDuration={8000}
                onClose={handleCloseInfo}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseInfo} severity="info" sx={{ width: '100%', padding: "12px 16px", fontSize: "1.0rem", lineHeight: "1.5", borderRadius: "8px" }}>
                    {infoMessage}
                </Alert>
            </Snackbar>

            {/* Unsaved Changes Dialog */}
            <Dialog
                open={openUnsavedDialog}
                onClose={handleCloseUnsavedDialog}
                aria-labelledby="unsaved-changes-dialog-title"
                aria-describedby="unsaved-changes-dialog-description"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="unsaved-changes-dialog-title" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                    ⚠️ {t('orderPlanning.unsavedChanges', 'Unsaved Changes')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="unsaved-changes-dialog-description" sx={{ fontSize: '1.1rem', mb: 2 }}>
                        {t('orderPlanning.unsavedChangesMessage', 'You have unsaved changes that will be lost if you continue.')}
                    </DialogContentText>
                    {getChangeSummary() && (
                        <DialogContentText sx={{ fontSize: '0.95rem', mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                            {t('orderPlanning.changesInclude', 'Changes include:')} {getChangeSummary()}
                        </DialogContentText>
                    )}
                    <DialogContentText sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {t('orderPlanning.unsavedChangesQuestion', 'What would you like to do?')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={handleCloseUnsavedDialog}
                        color="inherit"
                        variant="outlined"
                        sx={{ minWidth: 100 }}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleDiscardAndNavigate}
                        color="error"
                        variant="outlined"
                        sx={{ minWidth: 100 }}
                    >
                        {t('common.discard', 'Discard Changes')}
                    </Button>
                    <Button
                        onClick={handleSaveAndNavigate}
                        color="primary"
                        variant="contained"
                        disabled={saving}
                        sx={{ minWidth: 100 }}
                    >
                        {saving ? t('common.saving', 'Saving...') : t('common.saveAndContinue', 'Save & Continue')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Discard Changes Confirmation Dialog */}
            <Dialog
                open={openDiscardDialog}
                onClose={handleCancelDiscard}
                aria-labelledby="discard-dialog-title"
                aria-describedby="discard-dialog-description"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="discard-dialog-title" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                    ⚠️ {t('orderPlanning.confirmDiscard', 'Confirm Discard Changes')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="discard-dialog-description" sx={{ fontSize: '1.1rem', mb: 2 }}>
                        {t('orderPlanning.discardWarning', 'Are you sure you want to discard all your changes? This action cannot be undone.')}
                    </DialogContentText>
                    {getChangeSummary() && (
                        <DialogContentText sx={{ fontSize: '0.95rem', mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                            {t('orderPlanning.changesWillBeLost', 'The following changes will be lost:')} {getChangeSummary()}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={handleCancelDiscard}
                        color="primary"
                        variant="contained"
                        sx={{ minWidth: 100 }}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirmDiscard}
                        color="error"
                        variant="outlined"
                        sx={{ minWidth: 100 }}
                    >
                        {t('common.discardChanges', 'Discard Changes')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Marker Calculator Dialog */}
            {selectedOrder && (
                <MarkerCalculatorDialog
                    open={openCalculatorDialog}
                    onClose={handleCloseCalculator}
                    orderSizes={orderSizes}
                    orderSizeNames={orderSizeNames}
                    selectedStyle={selectedStyle}
                    tables={tables}
                    getTablePlannedQuantities={getTablePlannedQuantities}
                    selectedOrder={selectedOrder}
                />
            )}

            {/* Mattress Summary Dialog */}
            {selectedTableForSummary && (
                <MattressSummaryDialog
                    open={openSummaryDialog}
                    onClose={handleCloseSummary}
                    table={selectedTableForSummary}
                    fabricType={selectedTableForSummary.fabricType}
                />
            )}

            {/* Destination Print Dialog */}
            <DestinationPrintDialog
                open={openDestinationPrintDialog}
                onClose={handleCloseDestinationPrintDialog}
                destinations={availableDestinations}
                onPrintDestination={handlePrintDestination}
                onPrintAll={handlePrintAll}
            />
        </>
    );
};

export default OrderPlanning;
