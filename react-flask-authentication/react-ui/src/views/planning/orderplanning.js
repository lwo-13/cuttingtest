import React, { useEffect, useState, useRef } from 'react';
import { Box, Table, TableBody, TableContainer, Paper, IconButton, Button, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Collapse, CircularProgress, Backdrop, Typography, Select, MenuItem } from '@mui/material';
import { AddCircleOutline, Calculate, Summarize } from '@mui/icons-material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons';

import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

import { useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
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
import { getTablePlannedQuantities, getTablePlannedByBagno, getMetersByBagno, getWidthsByBagno } from 'views/planning/OrderPlanning/utils/plannedQuantities';
import { usePrintStyles, handlePrint, getAllDestinations, getDestinationsInTabOrder, handleDestinationPrint } from 'views/planning/OrderPlanning/utils/printUtils';
import { sortSizes } from 'views/planning/OrderPlanning/utils/sortSizes';
import { getCombinationKey } from 'utils/productionCenterConfig';

// Destination Print Dialog
import DestinationPrintDialog from 'views/planning/OrderPlanning/components/DestinationPrintDialog';

// Collaretto Helper Shortcut
import CollarettoHelperShortcut from 'views/planning/OrderPlanning/components/CollarettoHelperButton';

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
    const location = useLocation();

    const [orderOptions, setOrderOptions] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderLoading, setOrderLoading] = useState(false); // Add loading state for order changes
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
    const [styleCommentData, setStyleCommentData] = useState(null); // Track style comment data for main save

    // Basic unsaved changes tracking (temporary fallback)
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Debug wrapper for setUnsavedChanges to track when it's being set to false
    const originalSetUnsavedChanges = setUnsavedChanges;
    const debugSetUnsavedChanges = (value) => {
        if (value === false) {
            console.log('⚠️ setUnsavedChanges(false) called from:', new Error().stack);
        } else {
            console.log('✅ setUnsavedChanges(true) called');
        }
        originalSetUnsavedChanges(value);
    };

    // Audit refetch function state - use useRef to avoid re-renders
    const auditRefetchFunctionRef = useRef(null);

    // Temporary fallback functions
    const clearAllChanges = () => {
        setUnsavedChanges(false);
        // Reset style comment data to ensure it doesn't trigger unsaved changes
        setStyleCommentData(null);
    };
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

    // State for comment cards - now stores comments per combination
    const [showCommentCard, setShowCommentCard] = useState(false);
    const [commentData, setCommentData] = useState({}); // { combination_id: { comment_text: '', hasChanges: false, resetState: null } }
    const [combinationComments, setCombinationComments] = useState({}); // Track which combinations have comments

    // State for card collapse/expand functionality
    const [collapsedCards, setCollapsedCards] = useState({
        mattress: {},  // { tableId: boolean }
        adhesive: {},  // { tableId: boolean }
        along: {},     // { tableId: boolean }
        weft: {},      // { tableId: boolean }
        bias: {}       // { tableId: boolean }
    });

    // Ref for ProductionCenterTabs to access combinations (must be declared before useHandleSave)
    const productionCenterTabsRef = useRef();

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
    } = useMattressTables({
        orderSizeNames,
        setDeletedMattresses,
        setUnsavedChanges: (value) => {
            console.log('🔍 useMattressTables calling setUnsavedChanges with:', value);
            setUnsavedChanges(value);
        },
        setDeletedTableIds
    });

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
        handleExtraChange: handleBiasExtraChange
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
        setUnsavedChanges: (value) => {
            console.log('🔍 useHandleSave calling setUnsavedChanges with:', value);
            setUnsavedChanges(value);
        },
        commentData,
        auditRefetchFunctionRef,
        styleCommentData,
        productionCenterTabsRef
    });

    // Order Change
    const { onOrderChange } = useHandleOrderChange({
        selectedOrder, // Pass current selectedOrder for debugging
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
        setOrderLoading, // Add loading state setter
        setCombinationComments,
        setCommentData,
        // Deletion tracking setters
        setDeletedMattresses,
        setDeletedAdhesive,
        setDeletedAlong,
        setDeletedWeft,
        setDeletedBias,
        setDeletedTableIds,
        setDeletedCombinations,
        styleCommentData
    });

    // Print Styles
    usePrintStyles();

    // Average Consumption per table
    const avgConsumption = useAvgConsumption(tables, getTablePlannedQuantities);
    const avgAdhesiveConsumption = useAvgConsumption(adhesiveTables, getTablePlannedQuantities);

    // Frontend-only state for visual Parts per production center combination
    const [combinationParts, setCombinationParts] = useState({});

    const getActivePartForCombination = (combinationId) => {
        if (!combinationId) {
            return 1;
        }

        const entry = combinationParts[combinationId];
        if (!entry || entry.active === undefined || entry.active === null) {
            return 1;
        }

        const parsed = parseInt(entry.active, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    };

    const handleChangeCombinationPart = (combinationId, value) => {
        if (!combinationId) {
            return;
        }

        const safeValue = parseInt(value, 10);
        const nextPart = Number.isFinite(safeValue) && safeValue > 0 ? safeValue : 1;

        setCombinationParts((prev) => {
            const currentEntry = prev[combinationId] || {};

            if (currentEntry.active === nextPart) {
                return prev;
            }

            return {
                ...prev,
                [combinationId]: {
                    ...currentEntry,
                    active: nextPart
                }
            };
        });
    };

    const getMaxPartIndexForCombination = (combination) => {
        if (!combination || !combination.combination_id) {
            return 1;
        }

        const {
            combination_id,
            production_center,
            cutting_room,
            destination
        } = combination;

        const activePart = getActivePartForCombination(combination_id);
        let maxFromTables = 1;

        const allTables = [
            ...(tables || []),
            ...(adhesiveTables || []),
            ...(alongTables || []),
            ...(weftTables || []),
            ...(biasTables || [])
        ];

        allTables.forEach((table) => {
            if (
                table.productionCenter === production_center &&
                table.cuttingRoom === cutting_room &&
                table.destination === destination
            ) {
                let partIndex = 1;

                if (table.partIndex !== undefined && table.partIndex !== null) {
                    const parsed = parseInt(table.partIndex, 10);
                    partIndex = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
                }

                if (partIndex > maxFromTables) {
                    maxFromTables = partIndex;
                }
            }
        });

        return Math.max(1, activePart || 1, maxFromTables);
    };

    const handleDeleteCombinationPart = (combination) => {
        if (!combination || !combination.combination_id) {
            return;
        }

        const {
            combination_id,
            production_center,
            cutting_room,
            destination
        } = combination;

        const activePart = getActivePartForCombination(combination_id);

        // Do not allow deleting Part 1  there must always be at least one Part.
        if (!activePart || activePart <= 1) {
            setErrorMessage('Cannot delete Part 1. At least one Part must remain for each production center.');
            setOpenError(true);
            return;
        }

        const allTables = [
            ...(tables || []),
            ...(adhesiveTables || []),
            ...(alongTables || []),
            ...(weftTables || []),
            ...(biasTables || [])
        ];

        const hasTablesInPart = allTables.some((table) => {
            if (
                table.productionCenter !== production_center ||
                table.cuttingRoom !== cutting_room ||
                table.destination !== destination
            ) {
                return false;
            }

            let partIndex = 1;

            if (table.partIndex !== undefined && table.partIndex !== null) {
                const parsed = parseInt(table.partIndex, 10);
                partIndex = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
            }

            return partIndex === activePart;
        });

        if (hasTablesInPart) {
            setErrorMessage(`Cannot delete Part ${activePart} because it contains tables. Delete or move the tables first.`);
            setOpenError(true);
            return;
        }

        // Safe to delete  just move the active Part pointer back one step.
        setCombinationParts((prev) => {
            const currentEntry = prev[combination_id] || {};

            if (!currentEntry || currentEntry.active === undefined || currentEntry.active === null) {
                return prev;
            }

            const nextActive = Math.max(1, activePart - 1);

            return {
                ...prev,
                [combination_id]: {
                    ...currentEntry,
                    active: nextActive
                }
            };
        });
    };

    useEffect(() => {
        // Reset Parts when switching orders to avoid leaking state between orders
        setCombinationParts({});
    }, [selectedOrder]);

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
        updateTablesWithCombination
    } = useProductionCenterTabs({
        selectedOrder,
        tables: tables || [],
        adhesiveTables: adhesiveTables || [],
        alongTables: alongTables || [],
        weftTables: weftTables || [],
        biasTables: biasTables || [],
        setUnsavedChanges: (value) => {
            console.log('🔍 useProductionCenterTabs calling setUnsavedChanges with:', value);
            setUnsavedChanges(value);
        },
        getActivePartForCombination
    });

    // Helper function to get last 6 digits of order ID (same as in useHandleSave)
    const getOrderSuffix = (orderId) => {
        const orderStr = String(orderId);
        return orderStr.length > 6 ? orderStr.slice(-6) : orderStr;
    };



    // Helper to safely get Part index (frontend-only, defaults to 1)
    const getSafePartIndex = (tbl) => {
        if (!tbl || tbl.partIndex === undefined || tbl.partIndex === null) return 1;
        const parsed = parseInt(tbl.partIndex, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    };



    // Wrapper function for handleBulkAddRows that generates mattress names
    const handleBulkAddRowsWithNames = (tableId, bulkAddData) => {
        // Find the table to get production center information
        const table = tables.find(t => t.id === tableId);

        if (!table || !selectedOrder) {
            // Fallback to original function if we can't generate names
            return handleBulkAddRows(tableId, bulkAddData);
        }

        // Generate mattress names using the same logic as useHandleSave
        const itemTypeCode = table.spreading === "MANUAL" ? "MS" : "AS";
        const combinationKey = getCombinationKey(table.cuttingRoom, table.destination);
        const orderSuffix = getOrderSuffix(selectedOrder.id);

        // Calculate how many rows will be created
        const { layerPackageNr } = bulkAddData;

        // Enhanced sequence number calculation that considers existing mattress names
        const getNextSequenceNumber = (rows, itemTypeCode, fabricType, combinationKey, orderSuffix) => {
            // Build the expected name pattern for this table
            const namePattern = combinationKey
                ? `${combinationKey}-${orderSuffix}-${itemTypeCode}-${fabricType}-`
                : `${orderSuffix}-${itemTypeCode}-${fabricType}-`;

            // Extract sequence numbers from both sequenceNumber field and existing mattress names
            const sequencesFromField = rows
                .map(row => parseInt(row.sequenceNumber))
                .filter(n => !isNaN(n));

            const sequencesFromNames = rows
                .filter(row => row.mattressName && row.mattressName.startsWith(namePattern))
                .map(row => {
                    // Extract the sequence number from the end of the mattress name
                    const match = row.mattressName.match(/-(\d{3})$/);
                    return match ? parseInt(match[1]) : null;
                })
                .filter(n => n !== null);

            // Combine both sources and find the maximum
            const allSequences = [...sequencesFromField, ...sequencesFromNames];
            return allSequences.length > 0 ? Math.max(...allSequences) + 1 : 1;
        };

        const startingSequence = getNextSequenceNumber(table.rows, itemTypeCode, table.fabricType, combinationKey, orderSuffix);

        // Generate mattress names for each row that will be created
        const mattressNames = [];

        for (let i = 0; i < layerPackageNr; i++) {
            const sequenceNumber = startingSequence + i;
            const mattressName = combinationKey
                ? `${combinationKey}-${orderSuffix}-${itemTypeCode}-${table.fabricType}-${String(sequenceNumber).padStart(3, '0')}`
                : `${orderSuffix}-${itemTypeCode}-${table.fabricType}-${String(sequenceNumber).padStart(3, '0')}`;
            mattressNames.push(mattressName);
        }

        // Add the mattress names to the bulk add data
        const enhancedBulkAddData = {
            ...bulkAddData,
            mattressNames
        };

        // Call the original function with enhanced data
        return handleBulkAddRows(tableId, enhancedBulkAddData);
    };

    // Auto-assign production center combination to tables
    useEffect(() => {
        if (!selectedCombination || !assignCombinationToNewTable) return;

        // Don't run during order loading to prevent interference
        if (orderLoading) {
            return;
        }

        // Check for tables and assign/update the selected combination and Part index
        const updateTablesWithCombination = (currentTables, setTablesFunction) => {
            if (!currentTables || currentTables.length === 0) return;

            const updatedTables = currentTables.map((table) => {
                const hasNoProductionCenter =
                    !table.productionCenter && !table.cuttingRoom && !table.destination;

                // Tables that are already tied to this combination via production center fields
                const matchesSelectedCombination =
                    table.productionCenter === selectedCombination.production_center &&
                    table.cuttingRoom === selectedCombination.cutting_room &&
                    table.destination === selectedCombination.destination;

                // Tables that explicitly reference this combination by ID (if present)
                const matchesCombinationId =
                    selectedCombination.combination_id &&
                    table.combinationId === selectedCombination.combination_id;

                if (hasNoProductionCenter || matchesSelectedCombination || matchesCombinationId) {
                    return assignCombinationToNewTable(table);
                }

                return table;
            });

            // Only update if there are actual persistent changes (production center or combination link)
            const hasChanges = updatedTables.some((updatedTable, index) => {
                const originalTable = currentTables[index];

                return (
                    updatedTable.productionCenter !== originalTable.productionCenter ||
                    updatedTable.cuttingRoom !== originalTable.cuttingRoom ||
                    updatedTable.destination !== originalTable.destination ||
                    updatedTable.combinationId !== originalTable.combinationId
                );
            });

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
    }, [selectedCombination, assignCombinationToNewTable, tables, adhesiveTables, alongTables, weftTables, biasTables, setTables, setAdhesiveTables, setAlongTables, setWeftTables, setBiasTables, orderLoading]);

    // Destination Print Dialog State
    const [openDestinationPrintDialog, setOpenDestinationPrintDialog] = useState(false);
    const [availableDestinations, setAvailableDestinations] = useState([]);

    // Ref for ProductionCenterTabs to access switchToDestinationTab function (declared earlier)

    // Enhanced Print Handler (Part-aware)
    const handleEnhancedPrint = () => {
        // Try to get destinations in tab order first
        const combinations = productionCenterTabsRef.current?.getCombinations?.();
        let destinations;

        if (combinations && combinations.length > 0) {
            // Use tab order if combinations are available, but only keep destinations
            // that actually have tables in the currently active Part
            const destinationsInTabOrder = getDestinationsInTabOrder(combinations);
            destinations = destinationsInTabOrder.filter((destination) =>
                filteredTables.some((t) => t.destination === destination) ||
                filteredAdhesiveTables.some((t) => t.destination === destination) ||
                filteredAlongTables.some((t) => t.destination === destination) ||
                filteredWeftTables.some((t) => t.destination === destination) ||
                filteredBiasTables.some((t) => t.destination === destination)
            );
        } else {
            // Fallback to alphabetical order, based only on the current Part's tables
            destinations = getAllDestinations(
                filteredTables,
                filteredAdhesiveTables,
                filteredAlongTables,
                filteredWeftTables,
                filteredBiasTables
            );
        }

        if (destinations.length <= 1) {
            // Single or no destination - print the currently active Part
            handlePrint(
                filteredTables,
                filteredAdhesiveTables,
                filteredAlongTables,
                filteredWeftTables,
                filteredBiasTables,
                collapsedCards,
                setCollapsedCards
            );
        } else {
            // Multiple destinations - show selection dialog
            setAvailableDestinations(destinations);
            setOpenDestinationPrintDialog(true);
        }
    };

    // Handle destination-specific printing (Part-aware)
    const handlePrintDestination = (selectedDestination) => {
        setOpenDestinationPrintDialog(false);

        // Get the switchToDestinationTab function from ProductionCenterTabs
        const switchToDestinationTab = productionCenterTabsRef.current?.switchToDestinationTab;

        handleDestinationPrint(
            selectedDestination,
            filteredTables,
            filteredAdhesiveTables,
            filteredAlongTables,
            filteredWeftTables,
            filteredBiasTables,
            collapsedCards,
            setCollapsedCards,
            switchToDestinationTab
        );
    };

    // Handle print all destinations (Part-aware)
    const handlePrintAll = () => {
        setOpenDestinationPrintDialog(false);
        handlePrint(
            filteredTables,
            filteredAdhesiveTables,
            filteredAlongTables,
            filteredWeftTables,
            filteredBiasTables,
            collapsedCards,
            setCollapsedCards
        );
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
                const navigationFunction = pendingNavigation();
                if (typeof navigationFunction === 'function') {
                    navigationFunction();
                }
            }
            setOpenUnsavedDialog(false);
            setPendingNavigation(null);
        } catch (error) {
            // Save failed, keep dialog open and show error
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

        // Reset to empty state (like when no order is selected)
        onOrderChange(null);

        // Show success message
        setInfoMessage('Changes discarded successfully. Data has been reset to empty state.');
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

        // Close the dialog first
        setOpenUnsavedDialog(false);

        // Clear pending navigation first
        const navFunction = pendingNavigation;
        setPendingNavigation(null);

        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
            if (navFunction && typeof navFunction === 'function') {
                const navigationFunction = navFunction();
                if (typeof navigationFunction === 'function') {
                    navigationFunction();
                }
            }
        }, 100);
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
        const combinationId = selectedCombination?.combination_id;
        if (combinationId) {
            // Mark comment for deletion by setting empty text with changes flag
            setCommentData(prev => ({
                ...prev,
                [combinationId]: {
                    comment_text: '',
                    combination_id: combinationId,
                    hasChanges: true,
                    resetState: null,
                    isDeleted: true  // Flag to indicate this comment should be deleted
                }
            }));

            // Also clear the combinationComments flag so the card disappears
            setCombinationComments(prev => ({
                ...prev,
                [combinationId]: false
            }));
        }
        setUnsavedChanges(true);
    };

    const handleCommentChange = (data) => {
        const combinationId = selectedCombination?.combination_id;
        if (combinationId) {
            setCommentData(prev => ({
                ...prev,
                [combinationId]: data
            }));
        }
    };

    const handleCommentExists = (exists) => {
        if (exists && selectedCombination?.combination_id) {
            setCombinationComments(prev => ({
                ...prev,
                [selectedCombination.combination_id]: true
            }));
            setShowCommentCard(true);
        }
    };

    // Check for existing comments when combination changes
    const checkExistingComment = async (combination) => {
        if (!selectedOrder?.id || !combination?.combination_id) return;

        try {
            const url = `/orders/comments/get/${selectedOrder.id}/${combination.combination_id}`;
            const response = await axios.get(url);

            if (response.data.success && response.data.data?.comment_text?.trim()) {
                setCombinationComments(prev => ({
                    ...prev,
                    [combination.combination_id]: true
                }));
            }
        } catch (error) {
            console.error('Error checking existing comment:', error);
        }
    };

    // Check if current combination should show comment card
    const shouldShowCommentCard = showCommentCard ||
        (selectedCombination?.combination_id && combinationComments[selectedCombination.combination_id]);

    // Check for existing comments when combination changes
    useEffect(() => {
        if (selectedCombination?.combination_id) {
            checkExistingComment(selectedCombination);
        }
    }, [selectedCombination?.combination_id, selectedOrder?.id]);

    // Reset showCommentCard when switching combinations (but keep it if combination has existing comment)
    useEffect(() => {
        if (selectedCombination?.combination_id) {
            const hasExistingComment = combinationComments[selectedCombination.combination_id];
            if (!hasExistingComment) {
                setShowCommentCard(false);
            }
        }
    }, [selectedCombination?.combination_id, combinationComments]);

    // Track style comment changes and update unsaved changes state
    useEffect(() => {
        if (styleCommentData?.hasUnsavedChanges) {
            console.log('✅ Style comment has unsaved changes, setting unsavedChanges to true');
            setUnsavedChanges(true);
        }
    }, [styleCommentData?.hasUnsavedChanges]);



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
                setInfoMessage('Auto-refresh skipped - you have unsaved changes. Save your work to enable auto-refresh.');
                setOpenInfo(true);
                return;
            }

            // Only refresh if we have a selected order
            if (selectedOrder) {
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

    // Automatic collaretto synchronization with mattress table changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const handleMattressLayersChanged = (event) => {
            const { bagno, newLayers, tableId } = event.detail;

            if (!bagno || bagno === 'Unknown' || !newLayers || newLayers <= 0) {
                return;
            }

            // ✅ Get configuration from the specific mattress table that changed
            const changedTable = tables.find(t => t.id === tableId);
            if (!changedTable) return;

            const mattressDestination = changedTable.destination;
            const mattressProductionCenter = changedTable.productionCenter;
            const mattressCuttingRoom = changedTable.cuttingRoom;
            const mattressFabricCode = changedTable.fabricCode;
            const mattressFabricColor = changedTable.fabricColor;
            const mattressPartIndex = getSafePartIndex(changedTable);

            // ✅ Calculate total pieces for this bagno ONLY from mattress tables with matching configuration AND Part
            let totalPiecesForBagno = 0;
            let piecesPerSizeForBagno = {};

            tables.forEach(table => {
                // ✅ Only include mattress tables with exact matching configuration and Part
                const hasMatchingConfig = table.destination === mattressDestination &&
                                        table.productionCenter === mattressProductionCenter &&
                                        table.cuttingRoom === mattressCuttingRoom &&
                                        table.fabricCode === mattressFabricCode &&
                                        table.fabricColor === mattressFabricColor &&
                                        getSafePartIndex(table) === mattressPartIndex;

                if (hasMatchingConfig) {
                    table.rows.forEach(row => {
                        if (row.bagno === bagno && row.layers && row.piecesPerSize) {
                            const layers = parseInt(row.layers) || 0;
                            Object.entries(row.piecesPerSize).forEach(([size, pieces]) => {
                                const pcs = parseInt(pieces) || 0;
                                const totalForSize = pcs * layers;
                                piecesPerSizeForBagno[size] = (piecesPerSizeForBagno[size] || 0) + totalForSize;
                                totalPiecesForBagno += totalForSize;
                            });
                        }
                    });
                }
            });

            if (totalPiecesForBagno === 0) {
                // Don't return early - we still want to update collaretto tables to show 0 pieces
            }

            // Check if there are any collaretto tables that will actually be updated
            let hasMatchingCollarettoTables = false;

            // Check weft tables
            const hasMatchingWeftTables = weftTables.some(table => {
                const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);
                const hasMatchingConfig = table.destination === mattressDestination &&
                                       table.productionCenter === mattressProductionCenter &&
                                       table.cuttingRoom === mattressCuttingRoom &&
                                       table.fabricCode === mattressFabricCode &&
                                       table.fabricColor === mattressFabricColor &&
                                       getSafePartIndex(table) === mattressPartIndex;
                return hasMatchingBagno && hasMatchingConfig;
            });

            // Check bias tables
            const hasMatchingBiasTables = biasTables.some(table => {
                const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);
                const hasMatchingConfig = table.destination === mattressDestination &&
                                       table.productionCenter === mattressProductionCenter &&
                                       table.cuttingRoom === mattressCuttingRoom &&
                                       table.fabricCode === mattressFabricCode &&
                                       table.fabricColor === mattressFabricColor &&
                                       getSafePartIndex(table) === mattressPartIndex;
                return hasMatchingBagno && hasMatchingConfig;
            });

            // Check along tables
            const hasMatchingAlongTables = alongTables.some(table => {
                const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);
                const hasMatchingConfig = table.destination === mattressDestination &&
                                       table.productionCenter === mattressProductionCenter &&
                                       table.cuttingRoom === mattressCuttingRoom &&
                                       table.fabricCode === mattressFabricCode &&
                                       table.fabricColor === mattressFabricColor &&
                                       getSafePartIndex(table) === mattressPartIndex;
                return hasMatchingBagno && hasMatchingConfig;
            });

            hasMatchingCollarettoTables = hasMatchingWeftTables || hasMatchingBiasTables || hasMatchingAlongTables;

            // Only show notification if there are actually matching collaretto tables to update
            if (hasMatchingCollarettoTables) {
                setInfoMessage(`🔄 Automatically updating collaretto pieces for bagno ${bagno}`);
                setOpenInfo(true);

                // Auto-close the notification after 2 seconds
                setTimeout(() => {
                    setOpenInfo(false);
                }, 2000);
            }

            // Update weft tables that match both bagno AND configuration AND fabric AND Part
            setWeftTables(prevTables => {
                return prevTables.map(table => {
                    const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);
                    const hasMatchingConfig = table.destination === mattressDestination &&
                                           table.productionCenter === mattressProductionCenter &&
                                           table.cuttingRoom === mattressCuttingRoom &&
                                           table.fabricCode === mattressFabricCode &&
                                           table.fabricColor === mattressFabricColor &&
                                           getSafePartIndex(table) === mattressPartIndex;

                    if (!hasMatchingBagno || !hasMatchingConfig) return table;

                    return {
                        ...table,
                        rows: table.rows.map(row => {
                            if (row.bagno === bagno) {
                                // Calculate size-aware pieces for this specific collaretto row
                                let rowSpecificPieces = 0;
                                const rowSizes = row.sizes || 'ALL';

                                if (rowSizes === 'ALL') {
                                    // Use all pieces if row is for all sizes
                                    rowSpecificPieces = totalPiecesForBagno;
                                } else {
                                    // Calculate pieces only for the sizes this row is configured for
                                    const targetSizes = rowSizes.split('-').map(s => s.trim()).filter(s => s);
                                    rowSpecificPieces = targetSizes.reduce((sum, size) => {
                                        return sum + (piecesPerSizeForBagno[size] || 0);
                                    }, 0);
                                }

                                // ✅ Recalculate consumption and meters when pieces change
                                const updatedRow = { ...row, pieces: rowSpecificPieces.toString() };

                                // Recalculate rolls, panels, and consumption
                                const rewoundWidth = parseFloat(updatedRow.rewoundWidth);
                                const collWidthMM = parseFloat(updatedRow.collarettoWidth);
                                const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                const collWidthM = collWidthMM / 1000;

                                updatedRow.rolls = !isNaN(rewoundWidth) && !isNaN(collWidthM) && !isNaN(scrap)
                                    ? Math.floor(rewoundWidth / collWidthM) - scrap
                                    : "";

                                const pieces = parseFloat(updatedRow.pieces);
                                const rolls = parseFloat(updatedRow.rolls);
                                const extra = parseFloat(table.weftExtra) || 0;
                                const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

                                const panelsCalculation = (pieces * (1 + extra / 100)) / (rolls * pcsSeam);
                                if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
                                    const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
                                    updatedRow.panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
                                } else {
                                    updatedRow.panels = "";
                                }

                                const panels = parseFloat(updatedRow.panels);
                                updatedRow.consumption = !isNaN(panels) && !isNaN(rewoundWidth)
                                    ? (panels * rewoundWidth).toFixed(2)
                                    : "";

                                return updatedRow;
                            }
                            return row;
                        })
                    };
                });
            });

            // Update bias tables that match both bagno AND configuration AND fabric AND Part
            setBiasTables(prevTables => {
                return prevTables.map(table => {
                    const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);
                    const hasMatchingConfig = table.destination === mattressDestination &&
                                           table.productionCenter === mattressProductionCenter &&
                                           table.cuttingRoom === mattressCuttingRoom &&
                                           table.fabricCode === mattressFabricCode &&
                                           table.fabricColor === mattressFabricColor &&
                                           getSafePartIndex(table) === mattressPartIndex;

                    if (!hasMatchingBagno || !hasMatchingConfig) return table;

                    return {
                        ...table,
                        rows: table.rows.map(row => {
                            if (row.bagno === bagno) {
                                // Calculate size-aware pieces for this specific collaretto row
                                let rowSpecificPieces = 0;
                                const rowSizes = row.sizes || 'ALL';

                                if (rowSizes === 'ALL') {
                                    // Use all pieces if row is for all sizes
                                    rowSpecificPieces = totalPiecesForBagno;
                                } else {
                                    // Calculate pieces only for the sizes this row is configured for
                                    const targetSizes = rowSizes.split('-').map(s => s.trim()).filter(s => s);
                                    rowSpecificPieces = targetSizes.reduce((sum, size) => {
                                        return sum + (piecesPerSizeForBagno[size] || 0);
                                    }, 0);
                                }

                                // ✅ Recalculate consumption and meters when pieces change
                                const updatedRow = { ...row, pieces: rowSpecificPieces.toString() };

                                // Recalculate rolls, panels, and consumption
                                const panelLength = parseFloat(updatedRow.panelLength);
                                const collWidthMM = parseFloat(updatedRow.collarettoWidth);
                                const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                const collWidthM = collWidthMM / 1000;

                                updatedRow.rolls = !isNaN(panelLength) && !isNaN(collWidthM) && !isNaN(scrap)
                                    ? Math.floor(panelLength / collWidthM) - scrap
                                    : "";

                                const pieces = parseFloat(updatedRow.pieces);
                                const rolls = parseFloat(updatedRow.rolls);
                                const extra = parseFloat(table.biasExtra) || 0;
                                const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

                                const panelsCalculation = (pieces * (1 + extra / 100)) / (rolls * pcsSeam);
                                if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
                                    const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
                                    updatedRow.panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
                                } else {
                                    updatedRow.panels = "";
                                }

                                const panels = parseFloat(updatedRow.panels);
                                updatedRow.consumption = !isNaN(panels) && !isNaN(panelLength)
                                    ? (panels * panelLength).toFixed(2)
                                    : "";

                                return updatedRow;
                            }
                            return row;
                        })
                    };
                });
            });

            // Update along tables that match both bagno AND configuration AND fabric AND Part
            setAlongTables(prevTables => {
                return prevTables.map(table => {
                    const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);
                    const hasMatchingConfig = table.destination === mattressDestination &&
                                           table.productionCenter === mattressProductionCenter &&
                                           table.cuttingRoom === mattressCuttingRoom &&
                                           table.fabricCode === mattressFabricCode &&
                                           table.fabricColor === mattressFabricColor &&
                                           getSafePartIndex(table) === mattressPartIndex;

                    if (!hasMatchingBagno || !hasMatchingConfig) return table;

                    return {
                        ...table,
                        rows: table.rows.map(row => {
                            if (row.bagno === bagno) {
                                // Calculate size-aware pieces for this specific collaretto row
                                let rowSpecificPieces = 0;
                                const rowSizes = row.sizes || 'ALL';

                                if (rowSizes === 'ALL') {
                                    // Use all pieces if row is for all sizes
                                    rowSpecificPieces = totalPiecesForBagno;
                                } else {
                                    // Calculate pieces only for the sizes this row is configured for
                                    const targetSizes = rowSizes.split('-').map(s => s.trim()).filter(s => s);
                                    rowSpecificPieces = targetSizes.reduce((sum, size) => {
                                        return sum + (piecesPerSizeForBagno[size] || 0);
                                    }, 0);
                                }

                                // ✅ Recalculate consumption and meters when pieces change
                                const updatedRow = { ...row, pieces: rowSpecificPieces.toString() };

                                // Recalculate rolls, metersCollaretto, and consumption
                                const pieces = parseFloat(updatedRow.pieces) || 0;
                                const width = parseFloat(updatedRow.usableWidth) || 0;
                                const collWidth = (parseFloat(updatedRow.collarettoWidth) || 1) / 10;
                                const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                const theoCons = parseFloat(updatedRow.theoreticalConsumption) || 0;
                                const extra = 1 + (parseFloat(table.alongExtra) / 100 || 0);

                                updatedRow.rolls = collWidth > 0 ? Math.floor(width / collWidth) - scrap : 0;
                                updatedRow.metersCollaretto = (pieces * theoCons * extra).toFixed(2);
                                updatedRow.consumption = updatedRow.rolls > 0
                                    ? (updatedRow.metersCollaretto / updatedRow.rolls).toFixed(2)
                                    : "0";

                                return updatedRow;
                            }
                            return row;
                        })
                    };
                });
            });

            // Mark as unsaved changes
            setUnsavedChanges(true);
        };

        const handleMattressPiecesChanged = (event) => {
            const { bagno, tableId } = event.detail;

            if (!bagno || bagno === 'Unknown') {
                return;
            }

            // Don't show notification for pieces being reset to 0 (old bagno cleanup)
            // Only mattressLayersChanged should show notifications for new bagno updates

            // ✅ Get configuration from the specific mattress table that changed (if provided)
            let mattressDestination = null;
            let mattressProductionCenter = null;
            let mattressCuttingRoom = null;
            let mattressFabricCode = null;
            let mattressFabricColor = null;
            let mattressPartIndex = 1;

            if (tableId) {
                // ✅ Use the specific table that triggered the event
                const changedTable = tables.find(t => t.id === tableId);
                if (changedTable) {
                    mattressDestination = changedTable.destination;
                    mattressProductionCenter = changedTable.productionCenter;
                    mattressCuttingRoom = changedTable.cuttingRoom;
                    mattressFabricCode = changedTable.fabricCode;
                    mattressFabricColor = changedTable.fabricColor;
                    mattressPartIndex = getSafePartIndex(changedTable);
                }
            } else {
                // ✅ Fallback: find from any mattress table with this bagno (for backward compatibility)
                tables.forEach(table => {
                    table.rows.forEach(row => {
                        if (row.bagno === bagno && !mattressDestination) {
                            mattressDestination = table.destination;
                            mattressProductionCenter = table.productionCenter;
                            mattressCuttingRoom = table.cuttingRoom;
                            mattressFabricCode = table.fabricCode;
                            mattressFabricColor = table.fabricColor;
                            mattressPartIndex = getSafePartIndex(table);
                        }
                    });
                });
            }

            // ✅ Calculate total pieces for this bagno ONLY from mattress tables with matching configuration AND Part
            let totalPiecesForBagno = 0;
            let piecesPerSizeForBagno = {};

            tables.forEach(table => {
                // ✅ Only include mattress tables with exact matching configuration and Part
                const hasMatchingConfig = table.destination === mattressDestination &&
                                        table.productionCenter === mattressProductionCenter &&
                                        table.cuttingRoom === mattressCuttingRoom &&
                                        table.fabricCode === mattressFabricCode &&
                                        table.fabricColor === mattressFabricColor &&
                                        getSafePartIndex(table) === mattressPartIndex;

                if (hasMatchingConfig) {
                    table.rows.forEach(row => {
                        if (row.bagno === bagno && row.layers && row.piecesPerSize) {
                            const layers = parseInt(row.layers) || 0;
                            Object.entries(row.piecesPerSize).forEach(([size, pieces]) => {
                                const pcs = parseInt(pieces) || 0;
                                const totalForSize = pcs * layers;
                                piecesPerSizeForBagno[size] = (piecesPerSizeForBagno[size] || 0) + totalForSize;
                                totalPiecesForBagno += totalForSize;
                            });
                        }
                    });
                }
            });

            if (totalPiecesForBagno === 0) {
                // Don't return here - we still want to update collaretto to show 0 pieces
            }

            // If not found in mattress tables, get from collaretto tables that have this bagno
            if (!mattressDestination) {
                const allCollarettoTables = [...weftTables, ...biasTables, ...alongTables];
                for (const table of allCollarettoTables) {
                    const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);
                    if (hasMatchingBagno) {
                        mattressDestination = table.destination;
                        mattressProductionCenter = table.productionCenter;
                        mattressCuttingRoom = table.cuttingRoom;
                        mattressFabricCode = table.fabricCode;
                        mattressFabricColor = table.fabricColor;
                        break;
                    }
                }
            }

            // Update weft tables with the new piece quantities and recalculate consumption
            const updateWeftTables = (prevTables) => {
                return prevTables.map(table => {
                    const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);

                    if (!hasMatchingBagno) return table;

                    // If totalPiecesForBagno is 0 (no mattress tables have this bagno),
                    // update ALL collaretto rows with this bagno to 0, regardless of configuration
                    if (totalPiecesForBagno === 0) {
                        return {
                            ...table,
                            rows: table.rows.map(row => {
                                if (row.bagno === bagno) {
                                    const updatedRow = { ...row, pieces: "0" };
                                    // Recalculate with 0 pieces
                                    const rewoundWidth = parseFloat(updatedRow.rewoundWidth);
                                    const collWidthMM = parseFloat(updatedRow.collarettoWidth);
                                    const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                    const collWidthM = collWidthMM / 1000;

                                    updatedRow.rolls = !isNaN(rewoundWidth) && !isNaN(collWidthM) && !isNaN(scrap)
                                        ? Math.floor(rewoundWidth / collWidthM) - scrap
                                        : "";

                                    const pieces = 0;
                                    const rolls = parseFloat(updatedRow.rolls);
                                    const extra = parseFloat(table.weftExtra) || 0;
                                    const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

                                    const panelsCalculation = (pieces * (1 + extra / 100)) / (rolls * pcsSeam);
                                    if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
                                        const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
                                        updatedRow.panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
                                    } else {
                                        updatedRow.panels = "";
                                    }

                                    const panels = parseFloat(updatedRow.panels);
                                    updatedRow.consumption = !isNaN(panels) && !isNaN(rewoundWidth)
                                        ? (panels * rewoundWidth).toFixed(2)
                                        : "";

                                    return updatedRow;
                                }
                                return row;
                            })
                        };
                    }

                    // If we have pieces, check for matching configuration
                    const hasMatchingConfig = table.destination === mattressDestination &&
                                           table.productionCenter === mattressProductionCenter &&
                                           table.cuttingRoom === mattressCuttingRoom &&
                                           table.fabricCode === mattressFabricCode &&
                                           table.fabricColor === mattressFabricColor &&
                                               getSafePartIndex(table) === mattressPartIndex;

                    if (!hasMatchingConfig) return table;

                    return {
                        ...table,
                        rows: table.rows.map(row => {
                            if (row.bagno === bagno) {
                                // ✅ Calculate size-aware pieces for this specific collaretto row
                                let rowSpecificPieces = 0;
                                const rowSizes = row.sizes || 'ALL';

                                if (rowSizes === 'ALL') {
                                    // Use all pieces if row is for all sizes
                                    rowSpecificPieces = totalPiecesForBagno;
                                } else {
                                    // Calculate pieces only for the sizes this row is configured for
                                    const targetSizes = rowSizes.split('-').map(s => s.trim()).filter(s => s);

                                    rowSpecificPieces = targetSizes.reduce((sum, size) => {
                                        const piecesForSize = piecesPerSizeForBagno[size] || 0;
                                        return sum + piecesForSize;
                                    }, 0);
                                }

                                // ✅ Recalculate consumption and meters when pieces change
                                const updatedRow = { ...row, pieces: rowSpecificPieces.toString() };

                                // Recalculate rolls, panels, and consumption
                                const rewoundWidth = parseFloat(updatedRow.rewoundWidth);
                                const collWidthMM = parseFloat(updatedRow.collarettoWidth);
                                const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                const collWidthM = collWidthMM / 1000;

                                updatedRow.rolls = !isNaN(rewoundWidth) && !isNaN(collWidthM) && !isNaN(scrap)
                                    ? Math.floor(rewoundWidth / collWidthM) - scrap
                                    : "";

                                const pieces = parseFloat(updatedRow.pieces);
                                const rolls = parseFloat(updatedRow.rolls);
                                const extra = parseFloat(table.weftExtra) || 0;
                                const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

                                const panelsCalculation = (pieces * (1 + extra / 100)) / (rolls * pcsSeam);
                                if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
                                    const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
                                    updatedRow.panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
                                } else {
                                    updatedRow.panels = "";
                                }

                                const panels = parseFloat(updatedRow.panels);
                                updatedRow.consumption = !isNaN(panels) && !isNaN(rewoundWidth)
                                    ? (panels * rewoundWidth).toFixed(2)
                                    : "";

                                return updatedRow;
                            }
                            return row;
                        })
                    };
                });
            };

            // Update bias tables with the new piece quantities and recalculate consumption
            const updateBiasTables = (prevTables) => {
                return prevTables.map(table => {
                    const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);

                    if (!hasMatchingBagno) return table;

                    // If totalPiecesForBagno is 0, update rows with 0 pieces
                    if (totalPiecesForBagno === 0) {
                        return {
                            ...table,
                            rows: table.rows.map(row => {
                                if (row.bagno === bagno) {
                                    const updatedRow = { ...row, pieces: "0" };
                                    // Recalculate with 0 pieces
                                    const panelLength = parseFloat(updatedRow.panelLength);
                                    const collWidthMM = parseFloat(updatedRow.collarettoWidth);
                                    const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                    const collWidthM = collWidthMM / 1000;

                                    updatedRow.rolls = !isNaN(panelLength) && !isNaN(collWidthM) && !isNaN(scrap)
                                        ? Math.floor(panelLength / collWidthM) - scrap
                                        : "";

                                    updatedRow.panels = "";
                                    updatedRow.consumption = "";

                                    return updatedRow;
                                }
                                return row;
                            })
                        };
                    }

                    // If we have pieces, check for matching configuration
                    const hasMatchingConfig = table.destination === mattressDestination &&
                                           table.productionCenter === mattressProductionCenter &&
                                           table.cuttingRoom === mattressCuttingRoom &&
                                           table.fabricCode === mattressFabricCode &&
                                           table.fabricColor === mattressFabricColor &&
                                           getSafePartIndex(table) === mattressPartIndex;

                    if (!hasMatchingConfig) return table;

                    return {
                        ...table,
                        rows: table.rows.map(row => {
                            if (row.bagno === bagno) {
                                // Calculate size-aware pieces
                                let rowSpecificPieces = 0;
                                const rowSizes = row.sizes || 'ALL';

                                if (rowSizes === 'ALL') {
                                    rowSpecificPieces = totalPiecesForBagno;
                                } else {
                                    const targetSizes = rowSizes.split('-').map(s => s.trim()).filter(s => s);
                                    rowSpecificPieces = targetSizes.reduce((sum, size) => {
                                        return sum + (piecesPerSizeForBagno[size] || 0);
                                    }, 0);
                                }

                                // ✅ Recalculate consumption and meters when pieces change
                                const updatedRow = { ...row, pieces: rowSpecificPieces.toString() };

                                // Recalculate rolls, panels, and consumption (bias uses panelLength)
                                const panelLength = parseFloat(updatedRow.panelLength);
                                const collWidthMM = parseFloat(updatedRow.collarettoWidth);
                                const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                const collWidthM = collWidthMM / 1000;

                                updatedRow.rolls = !isNaN(panelLength) && !isNaN(collWidthM) && !isNaN(scrap)
                                    ? Math.floor(panelLength / collWidthM) - scrap
                                    : "";

                                const pieces = parseFloat(updatedRow.pieces);
                                const rolls = parseFloat(updatedRow.rolls);
                                const extra = parseFloat(table.biasExtra) || 0;
                                const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

                                const panelsCalculation = (pieces * (1 + extra / 100)) / (rolls * pcsSeam);
                                if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
                                    const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
                                    updatedRow.panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
                                } else {
                                    updatedRow.panels = "";
                                }

                                const panels = parseFloat(updatedRow.panels);
                                updatedRow.consumption = !isNaN(panels) && !isNaN(panelLength)
                                    ? (panels * panelLength).toFixed(2)
                                    : "";

                                return updatedRow;
                            }
                            return row;
                        })
                    };
                });
            };

            // Update along tables with the new piece quantities and recalculate consumption
            const updateAlongTables = (prevTables) => {
                return prevTables.map(table => {
                    const hasMatchingBagno = table.rows.some(row => row.bagno === bagno);

                    if (!hasMatchingBagno) return table;

                    // If totalPiecesForBagno is 0, update rows with 0 pieces
                    if (totalPiecesForBagno === 0) {
                        return {
                            ...table,
                            rows: table.rows.map(row => {
                                if (row.bagno === bagno) {
                                    const updatedRow = { ...row, pieces: "0" };
                                    // Recalculate with 0 pieces
                                    updatedRow.metersCollaretto = "0.00";
                                    updatedRow.consumption = "0";
                                    return updatedRow;
                                }
                                return row;
                            })
                        };
                    }

                    // If we have pieces, check for matching configuration
                    const hasMatchingConfig = table.destination === mattressDestination &&
                                           table.productionCenter === mattressProductionCenter &&
                                           table.cuttingRoom === mattressCuttingRoom &&
                                           table.fabricCode === mattressFabricCode &&
                                           table.fabricColor === mattressFabricColor &&
                                           getSafePartIndex(table) === mattressPartIndex;

                    if (!hasMatchingConfig) return table;

                    return {
                        ...table,
                        rows: table.rows.map(row => {
                            if (row.bagno === bagno) {
                                // Calculate size-aware pieces
                                let rowSpecificPieces = 0;
                                const rowSizes = row.sizes || 'ALL';

                                if (rowSizes === 'ALL') {
                                    rowSpecificPieces = totalPiecesForBagno;
                                } else {
                                    const targetSizes = rowSizes.split('-').map(s => s.trim()).filter(s => s);
                                    rowSpecificPieces = targetSizes.reduce((sum, size) => {
                                        return sum + (piecesPerSizeForBagno[size] || 0);
                                    }, 0);
                                }

                                // ✅ Recalculate consumption and meters when pieces change
                                const updatedRow = { ...row, pieces: rowSpecificPieces.toString() };

                                // Recalculate rolls, metersCollaretto, and consumption (along has different formula)
                                const pieces = parseFloat(updatedRow.pieces) || 0;
                                const width = parseFloat(updatedRow.usableWidth) || 0;
                                const collWidth = (parseFloat(updatedRow.collarettoWidth) || 1) / 10;
                                const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                const theoCons = parseFloat(updatedRow.theoreticalConsumption) || 0;
                                const extra = 1 + (parseFloat(table.alongExtra) / 100 || 0);

                                updatedRow.rolls = collWidth > 0 ? Math.floor(width / collWidth) - scrap : 0;
                                updatedRow.metersCollaretto = (pieces * theoCons * extra).toFixed(2);
                                updatedRow.consumption = updatedRow.rolls > 0
                                    ? (updatedRow.metersCollaretto / updatedRow.rolls).toFixed(2)
                                    : "0";

                                return updatedRow;
                            }
                            return row;
                        })
                    };
                });
            };

            setWeftTables(updateWeftTables);
            setBiasTables(updateBiasTables);
            setAlongTables(updateAlongTables);

            // Mark as unsaved changes
            setUnsavedChanges(true);
        };

        const handleCollarettoBagnoChanged = (event) => {
            const { bagno, tableId, rowId, tableType } = event.detail;

            if (!bagno || bagno === 'Unknown') {
                return;
            }



            // Get the configuration from the collaretto table that triggered this event
            let collarettoDestination = null;
            let collarettoProductionCenter = null;
            let collarettoCuttingRoom = null;
            let collarettoFabricCode = null;
            let collarettoFabricColor = null;
            let collarettoPartIndex = 1;

            if (tableType === 'weft') {
                const weftTable = weftTables.find(t => t.id === tableId);
                collarettoDestination = weftTable?.destination;
                collarettoProductionCenter = weftTable?.productionCenter;
                collarettoCuttingRoom = weftTable?.cuttingRoom;
                collarettoFabricCode = weftTable?.fabricCode;
                collarettoFabricColor = weftTable?.fabricColor;
                if (weftTable) {
                    collarettoPartIndex = getSafePartIndex(weftTable);
                }
            } else if (tableType === 'bias') {
                const biasTable = biasTables.find(t => t.id === tableId);
                collarettoDestination = biasTable?.destination;
                collarettoProductionCenter = biasTable?.productionCenter;
                collarettoCuttingRoom = biasTable?.cuttingRoom;
                collarettoFabricCode = biasTable?.fabricCode;
                collarettoFabricColor = biasTable?.fabricColor;
                if (biasTable) {
                    collarettoPartIndex = getSafePartIndex(biasTable);
                }
            } else if (tableType === 'along') {
                const alongTable = alongTables.find(t => t.id === tableId);
                collarettoDestination = alongTable?.destination;
                collarettoProductionCenter = alongTable?.productionCenter;
                collarettoCuttingRoom = alongTable?.cuttingRoom;
                collarettoFabricCode = alongTable?.fabricCode;
                collarettoFabricColor = alongTable?.fabricColor;
                if (alongTable) {
                    collarettoPartIndex = getSafePartIndex(alongTable);
                }
            }



            // Get the sizes information from the collaretto row to determine which sizes to include
            let collarettoRowSizes = 'ALL';
            let targetSizes = [];

            // Find the specific collaretto row to get its sizes configuration
            const collarettoTables = tableType === 'weft' ? weftTables :
                                   tableType === 'bias' ? biasTables : alongTables;

            const targetTable = collarettoTables.find(t => t.id === tableId);
            const targetRow = targetTable?.rows.find(r => r.id === rowId);

            if (targetRow && targetRow.sizes) {
                collarettoRowSizes = targetRow.sizes;
                if (collarettoRowSizes !== 'ALL') {
                    targetSizes = collarettoRowSizes.split('-').map(s => s.trim()).filter(s => s);
                }
            }



            // Calculate total pieces for this bagno from mattress tables with matching configuration
            let totalPiecesForBagno = 0;
            let piecesPerSizeForBagno = {};

            tables.forEach(table => {
                // Only consider mattress tables with matching configuration, fabric code/color AND Part
                const hasMatchingConfig = table.destination === collarettoDestination &&
                                        table.productionCenter === collarettoProductionCenter &&
                                        table.cuttingRoom === collarettoCuttingRoom &&
                                        table.fabricCode === collarettoFabricCode &&
                                        table.fabricColor === collarettoFabricColor &&
                                        getSafePartIndex(table) === collarettoPartIndex;



                if (hasMatchingConfig) {
                    table.rows.forEach(row => {
                        if (row.bagno === bagno && row.layers && row.piecesPerSize) {
                            const layers = parseInt(row.layers) || 0;

                            Object.entries(row.piecesPerSize).forEach(([size, pieces]) => {
                                // ✅ Size-aware filtering: only include pieces for target sizes
                                const shouldIncludeSize = collarettoRowSizes === 'ALL' || targetSizes.includes(size);

                                if (shouldIncludeSize) {
                                    const pcs = parseInt(pieces) || 0;
                                    const totalForSize = pcs * layers;
                                    piecesPerSizeForBagno[size] = (piecesPerSizeForBagno[size] || 0) + totalForSize;
                                    totalPiecesForBagno += totalForSize;
                                }
                            });
                        }
                    });
                }
            });

            if (totalPiecesForBagno === 0) {
                // Show notification that no pieces were found
                setInfoMessage(`⚠️ No pieces found for bagno ${bagno} in MATTRESS section for fabric ${collarettoFabricCode} ${collarettoFabricColor}`);
                setOpenInfo(true);
                setTimeout(() => setOpenInfo(false), 3000);
                return;
            }

            // Show success notification with size information
            const sizeInfo = collarettoRowSizes === 'ALL' ? 'all sizes' : `sizes: ${targetSizes.join(', ')}`;
            setInfoMessage(`✅ Auto-fetched ${totalPiecesForBagno} pieces for bagno ${bagno} (${sizeInfo}) from ${collarettoDestination}`);
            setOpenInfo(true);
            setTimeout(() => setOpenInfo(false), 3000);

            // Update the specific collaretto table and row with recalculation
            // Update the appropriate table type
            if (tableType === 'weft') {
                setWeftTables(prevTables => {
                    return prevTables.map(table => {
                        if (table.id !== tableId) return table;

                        return {
                            ...table,
                            rows: table.rows.map(row => {
                                if (row.id === rowId) {
                                    // ✅ Recalculate consumption and meters when pieces change
                                    const updatedRow = { ...row, pieces: totalPiecesForBagno.toString() };

                                    // Recalculate rolls, panels, and consumption
                                    const rewoundWidth = parseFloat(updatedRow.rewoundWidth);
                                    const collWidthMM = parseFloat(updatedRow.collarettoWidth);
                                    const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                    const collWidthM = collWidthMM / 1000;

                                    updatedRow.rolls = !isNaN(rewoundWidth) && !isNaN(collWidthM) && !isNaN(scrap)
                                        ? Math.floor(rewoundWidth / collWidthM) - scrap
                                        : "";

                                    const pieces = parseFloat(updatedRow.pieces);
                                    const rolls = parseFloat(updatedRow.rolls);
                                    const extra = parseFloat(table.weftExtra) || 0;
                                    const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

                                    const panelsCalculation = (pieces * (1 + extra / 100)) / (rolls * pcsSeam);
                                    if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
                                        const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
                                        updatedRow.panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
                                    } else {
                                        updatedRow.panels = "";
                                    }

                                    const panels = parseFloat(updatedRow.panels);
                                    updatedRow.consumption = !isNaN(panels) && !isNaN(rewoundWidth)
                                        ? (panels * rewoundWidth).toFixed(2)
                                        : "";

                                    return updatedRow;
                                }
                                return row;
                            })
                        };
                    });
                });
            } else if (tableType === 'bias') {
                setBiasTables(prevTables => {
                    return prevTables.map(table => {
                        if (table.id !== tableId) return table;

                        return {
                            ...table,
                            rows: table.rows.map(row => {
                                if (row.id === rowId) {
                                    // ✅ Recalculate consumption and meters when pieces change
                                    const updatedRow = { ...row, pieces: totalPiecesForBagno.toString() };

                                    // Recalculate rolls, panels, and consumption (bias uses panelLength)
                                    const panelLength = parseFloat(updatedRow.panelLength);
                                    const collWidthMM = parseFloat(updatedRow.collarettoWidth);
                                    const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                    const collWidthM = collWidthMM / 1000;

                                    updatedRow.rolls = !isNaN(panelLength) && !isNaN(collWidthM) && !isNaN(scrap)
                                        ? Math.floor(panelLength / collWidthM) - scrap
                                        : "";

                                    const pieces = parseFloat(updatedRow.pieces);
                                    const rolls = parseFloat(updatedRow.rolls);
                                    const extra = parseFloat(table.biasExtra) || 0;
                                    const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

                                    const panelsCalculation = (pieces * (1 + extra / 100)) / (rolls * pcsSeam);
                                    if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
                                        const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
                                        updatedRow.panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
                                    } else {
                                        updatedRow.panels = "";
                                    }

                                    const panels = parseFloat(updatedRow.panels);
                                    updatedRow.consumption = !isNaN(panels) && !isNaN(panelLength)
                                        ? (panels * panelLength).toFixed(2)
                                        : "";

                                    return updatedRow;
                                }
                                return row;
                            })
                        };
                    });
                });
            } else if (tableType === 'along') {
                setAlongTables(prevTables => {
                    return prevTables.map(table => {
                        if (table.id !== tableId) return table;

                        return {
                            ...table,
                            rows: table.rows.map(row => {
                                if (row.id === rowId) {
                                    // ✅ Recalculate consumption and meters when pieces change
                                    const updatedRow = { ...row, pieces: totalPiecesForBagno.toString() };

                                    // Recalculate rolls, metersCollaretto, and consumption (along has different formula)
                                    const pieces = parseFloat(updatedRow.pieces) || 0;
                                    const width = parseFloat(updatedRow.usableWidth) || 0;
                                    const collWidth = (parseFloat(updatedRow.collarettoWidth) || 1) / 10;
                                    const scrap = parseFloat(updatedRow.scrapRoll) || 0;
                                    const theoCons = parseFloat(updatedRow.theoreticalConsumption) || 0;
                                    const extra = 1 + (parseFloat(table.alongExtra) / 100 || 0);

                                    updatedRow.rolls = collWidth > 0 ? Math.floor(width / collWidth) - scrap : 0;
                                    updatedRow.metersCollaretto = (pieces * theoCons * extra).toFixed(2);
                                    updatedRow.consumption = updatedRow.rolls > 0
                                        ? (updatedRow.metersCollaretto / updatedRow.rolls).toFixed(2)
                                        : "0";

                                    return updatedRow;
                                }
                                return row;
                            })
                        };
                    });
                });
            }

            // Mark as unsaved changes
            setUnsavedChanges(true);
        };

        // Add event listeners
        window.addEventListener('mattressLayersChanged', handleMattressLayersChanged);
        window.addEventListener('mattressPiecesChanged', handleMattressPiecesChanged);
        window.addEventListener('collarettoBagnoChanged', handleCollarettoBagnoChanged);

        // Clean up event listeners on unmount
        return () => {
            window.removeEventListener('mattressLayersChanged', handleMattressLayersChanged);
            window.removeEventListener('mattressPiecesChanged', handleMattressPiecesChanged);
            window.removeEventListener('collarettoBagnoChanged', handleCollarettoBagnoChanged);
        };
    }, [tables, alongTables, weftTables, biasTables, setWeftTables, setBiasTables, setAlongTables, setUnsavedChanges, setInfoMessage, setOpenInfo]);

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

    // Fetch order data from Flask API with WIP detection
    useEffect(() => {
        Promise.all([
            axios.get('/orders/order_lines'),
            axios.get('/mattress/order_ids')  // Get orders that have mattresses (WIP detection)
        ])
            .then(([ordersRes, mattressRes]) => {
                if (!ordersRes.data.success || !mattressRes.data.success) {
                    console.error("Failed to fetch order or mattress data");
                    return;
                }

                // Create set of order IDs that have mattresses (WIP orders)
                const wipOrderIds = new Set(
                    (mattressRes.data.data || []).map(item => item.order_commessa)
                );

                const ordersMap = new Map();

                ordersRes.data.data.forEach(row => {
                    if (row.status === 3) {  // ✅ Only include status = 3
                        if (!ordersMap.has(row.order_commessa)) {
                            ordersMap.set(row.order_commessa, {
                                id: row.order_commessa,  // ✅ Use only id
                                style: row.style,  // ✅ Unique style per order
                                season: row.season,  // ✅ Unique season per order
                                colorCode: row.color_code,  // ✅ Unique color code per order
                                sizes: [],  // ✅ Initialize array for sizes
                                isWIP: wipOrderIds.has(row.order_commessa)  // ✅ Add WIP flag
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

                // Check for order query parameter in URL and auto-select
                const searchParams = new URLSearchParams(location.search);
                const orderParam = searchParams.get('order');
                if (orderParam && sortedOrders.length > 0) {
                    const matchedOrder = sortedOrders.find(order => order.id === orderParam);
                    if (matchedOrder) {
                        // Auto-select the order from URL parameter
                        onOrderChange(matchedOrder);
                        // Clear the URL parameter after selection
                        history.replace('/planning/orderplanning');
                    }
                }
            })
            .catch((error) => {
                console.error("Error fetching order data:", error);
            });
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
                    sizes: orderSizeNames.join(','),
                    order_commessa: selectedOrder.order_commessa  // ✅ Pass order commessa to get previously selected markers
                }
            });

            if (response.data.success) {
                setMarkerOptions(response.data.data);
            } else {
                // Failed to fetch markers
            }
        } catch (error) {
            // Error fetching marker data
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
        // Compare orders by ID instead of object reference to handle same style order switches
        const isSameOrder = newOrder?.id === selectedOrder?.id;

        if (unsavedChanges && !isSameOrder) {
            // Store the pending order change
            setPendingNavigation(() => () => handleOrderChangeWithNullReset(newOrder));
            setOpenUnsavedDialog(true);
            return;
        }

        handleOrderChangeWithNullReset(newOrder);
    };

    // Helper function to force order to null first, then load new order
    const handleOrderChangeWithNullReset = (newOrder) => {
        if (!newOrder) {
            // If newOrder is null, just call onOrderChange directly
            onOrderChange(newOrder);
            return;
        }

        if (selectedOrder && selectedOrder.id !== newOrder.id) {
            // First, set order to null to trigger cleanup
            onOrderChange(null);

            // Then, after a brief delay, load the new order
            setTimeout(() => {
                onOrderChange(newOrder);
            }, 50); // Small delay to ensure null state is processed
        } else {
            // Same order or no previous order, load directly
            onOrderChange(newOrder);
        }
    };

    const isTableEditable = (table) => {
        return table.rows.every(row => row.isEditable !== false);
    };

    return (
        <>
            {/* Loading Overlay for Order Changes */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)' // More opaque white screen
                }}
                open={orderLoading}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress color="primary" />
                    <Box sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                        Loading order data...
                    </Box>
                </Box>
            </Backdrop>

            {/* Loading Overlay for Save Operations */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: 9999, // Very high z-index to ensure it's on top
                    backgroundColor: 'rgba(255, 255, 255, 0.95)' // Same opaque white screen as order loading
                }}
                open={saving}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress color="primary" />
                    <Box sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                        Saving changes...
                    </Box>
                </Box>
            </Backdrop>



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
                                {/* Collaretto Helper Shortcut */}
                                <CollarettoHelperShortcut tables={tables} />

                                {/* Collaretto Consumption Info - Multiple fabric+grain combinations */}
                                {selectedOrder && tables.length > 0 && (() => {
                                    // Get all unique fabric codes from tables
                                    const uniqueFabricCodes = [...new Set(tables
                                        .filter(table => table.fabricCode)
                                        .map(table => table.fabricCode)
                                    )];

                                    // For each fabric code, we'll let the component handle multiple grain directions
                                    // The API will return all records for that fabric, and the component will group them
                                    return uniqueFabricCodes.map(fabricCode => (
                                        <CollarettoConsumptionInfo
                                            key={`collaretto-${fabricCode}`}
                                            style={selectedOrder.style}
                                            fabricCode={fabricCode}
                                        />
                                    ));
                                })()}

                                {/* Order Actions Bar in Header */}
                                <OrderActionBar
                                    unsavedChanges={unsavedChanges}
                                    handleSave={handleSave}
                                    isPinned={isPinned}
                                    setIsPinned={setIsPinned}
                                    saving={saving}
                                    handleDiscard={handleDiscard}
                                    handlePrint={handleEnhancedPrint}
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
                        onAuditRefetchReady={(refetchFn) => { auditRefetchFunctionRef.current = refetchFn; }}
                    />

                    {/* Order Quantities Section */}
                    <OrderQuantities orderSizes={orderSizes} italianRatios={italianRatios} selectedOrder={selectedOrder} />

                </MainCard>
            </Box>

            <Box mt={2} />

            {/* Pad Print and Style Comment Section - Side by Side */}
            {(selectedOrder || selectedStyle) && (
                <Box display="flex" gap={2} mt={2} alignItems="stretch">
                    {/* Pad Print Section - Left Half */}
                    <Box flex={1} display="flex">
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
                    </Box>

                    {/* Style Comment Section - Right Half */}
                    <Box flex={1} display="flex">
                        {selectedStyle && selectedOrder && (
                            <StyleCommentCard
                                selectedStyle={selectedStyle}
                                onDataChange={setStyleCommentData}
                            />
                        )}
                    </Box>
                </Box>
            )}

            {/* Production Center Comment Card Section - Moved up to be with comments */}
            {selectedOrder && selectedCombination && shouldShowCommentCard && (
                <Box mt={2}>
                    <CommentCard
                        selectedOrder={selectedOrder}
                        selectedCombination={selectedCombination}
                        onRemove={handleRemoveComment}
                        setUnsavedChanges={setUnsavedChanges}
                        onCommentChange={handleCommentChange}
                        onCommentExists={handleCommentExists}
                    />
                </Box>
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
                    // Visual Parts per combination (frontend-only)
                    getActivePartForCombination={getActivePartForCombination}
                    handleChangeCombinationPart={handleChangeCombinationPart}
                    getMaxPartIndexForCombination={getMaxPartIndexForCombination}
                    handleDeleteCombinationPart={handleDeleteCombinationPart}
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
                                    getWidthsByBagno={getWidthsByBagno}
                                    alongTables={filteredAlongTables}
                                    weftTables={filteredWeftTables}
                                    biasTables={filteredBiasTables}
                                    adhesiveTables={filteredAdhesiveTables}
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
                                onBulkAddRows={handleBulkAddRowsWithNames}
                                selectedOrder={selectedOrder}
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
                                    getWidthsByBagno={getWidthsByBagno}
                                    alongTables={filteredAlongTables}
                                    weftTables={filteredWeftTables}
                                    biasTables={filteredBiasTables}
                                    adhesiveTables={filteredAdhesiveTables}
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
                                onRefreshMarkers={fetchMarkerData}
                                refreshingMarkers={refreshingMarkers}
                                markerOptions={markerOptions}
                                selectedOrder={selectedOrder}
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
                                {t('orderPlanning.collarettoAlongGrain', 'Collaretto Along the Grain')}
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
                                selectedOrder={selectedOrder}
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
                                                    orderSizes={orderSizes}
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
                                {t('orderPlanning.collarettoWeft', 'Collaretto in Weft')}
                            </Box>
                        }
                    >
                        <Collapse in={!collapsedCards.weft[table.id]} timeout="auto" unmountOnExit>
                            <WeftGroupCard
                                table={table}
                                tables={weftTables}
                                fabricTypeOptions={fabricTypeOptions}
                                spreadingOptions={spreadingOptions}
                                isTableEditable={isTableEditable}
                                setTables={setWeftTables}
                                setUnsavedChanges={setUnsavedChanges}
                                handleWeftExtraChange={handleWeftExtraChange}
                                mattressTables={tables}
                                orderSizes={orderSizes}
                                handleAddRowWeft={handleAddRowWeft}
                                selectedOrder={selectedOrder}
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
                                                orderSizes={orderSizes}
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
                                {t('orderPlanning.collarettoBias', 'Collaretto in Bias')}
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
                                handleBiasExtraChange={handleBiasExtraChange}
                                selectedOrder={selectedOrder}
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
                                                orderSizes={orderSizes}
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


            {selectedOrder && selectedCombinationId && (
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

                    {!shouldShowCommentCard && (
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

            {selectedOrder && !selectedCombinationId && (
                <Box mt={2} p={2}>
                    <Typography variant="body1" color="text.disabled" sx={{ fontWeight: 'normal' }}>
                        {t('orderPlanning.selectProductionCenterFirst', 'Please select or create a production center configuration first before adding tables.')}
                    </Typography>
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
                    selectedCombinationId={selectedCombination?.combination_id}
                    combinationQuantity={0} // TODO: Implement state management for combination quantity
                />
            )}

            {/* Mattress Summary Dialog */}
            {selectedTableForSummary && (
                <MattressSummaryDialog
                    open={openSummaryDialog}
                    onClose={handleCloseSummary}
                    table={selectedTableForSummary}
                    fabricType={selectedTableForSummary.fabricType}
                    orderNumber={selectedOrder?.id}
                    style={selectedStyle}
                    productionCenter={selectedTableForSummary.productionCenter}
                    cuttingRoom={selectedTableForSummary.cuttingRoom}
                    destination={selectedTableForSummary.destination}
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
