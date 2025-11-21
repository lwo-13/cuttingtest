import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, Checkbox, FormControlLabel, FormGroup, Paper, Tooltip, IconButton, CircularProgress, Typography, TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent, Card, CardContent, Chip, Grid, Collapse } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MainCard from '../../ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';

const Coverage = () => {
    // Filter states
    const [showCheckedOnly, setShowCheckedOnly] = useState(false);
    const [selectedZones, setSelectedZones] = useState({
        Z1: true,
        Z2: true,
        Z3: true
    });
    const [filterText, setFilterText] = useState('');

    // Data state
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [availableTimestamps, setAvailableTimestamps] = useState([]);
    const [selectedTimestamp, setSelectedTimestamp] = useState('current');

    // Summary dialog state
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);

    // Fetch available timestamps on mount
    useEffect(() => {
        const fetchTimestamps = async () => {
            try {
                const response = await axios.get('/dashboard/coverage/timestamps');
                if (response.data.success) {
                    setAvailableTimestamps(response.data.timestamps);
                }
            } catch (error) {
                console.error('Error fetching timestamps:', error);
            }
        };

        fetchTimestamps();
    }, []);

    // Fetch data from API when selected timestamp changes
    useEffect(() => {
        const fetchCoverageData = async () => {
            try {
                setLoading(true);
                const url = selectedTimestamp === 'current'
                    ? '/dashboard/coverage'
                    : `/dashboard/coverage?timestamp=${encodeURIComponent(selectedTimestamp)}`;

                const response = await axios.get(url);
                if (response.data.success) {
                    setRows(response.data.data);
                    setLastUpdated(response.data.last_updated);
                } else {
                    console.error('Failed to fetch coverage data:', response.data.message);
                    console.error('Error details:', response.data.details);
                }
            } catch (error) {
                console.error('Error fetching coverage data:', error);
                if (error.response && error.response.data) {
                    console.error('Server error message:', error.response.data.message);
                    console.error('Server error details:', error.response.data.details);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCoverageData();
    }, [selectedTimestamp]);

    // Filter and sort rows based on selected filters
    const filteredRows = useMemo(() => {
        let filtered = rows.filter(row => {
            // Filter by check status
            if (showCheckedOnly && !row.check) {
                return false;
            }

            // Filter by zone
            const zone = row.sector.substring(0, 2); // Extract Z1, Z2, or Z3
            if (!selectedZones[zone]) {
                return false;
            }

            // Filter by text (search in multiple fields)
            if (filterText) {
                const searchText = filterText.toLowerCase();
                const searchableFields = [
                    row.sector,
                    row.line,
                    row.order,
                    row.article
                ].map(field => (field || '').toString().toLowerCase());

                const matchesSearch = searchableFields.some(field => field.includes(searchText));
                if (!matchesSearch) {
                    return false;
                }
            }

            return true;
        });

        // Filter out rows where bundle is finished and coverage is 0.0
        filtered = filtered.filter(row => {
            const bundleStatus = row.bundle_status;
            const isFinished = bundleStatus && bundleStatus.toLowerCase() === 'finished';
            const coverage = row.coverage || 0;

            // Exclude if finished and coverage is 0
            if (isFinished && coverage === 0) {
                return false;
            }

            return true;
        });

        // Sort by sector first, then by line, then by cut_pcs (descending)
        return filtered.sort((a, b) => {
            // First compare by sector
            if (a.sector < b.sector) return -1;
            if (a.sector > b.sector) return 1;

            // If sectors are equal, compare by line
            if (a.line < b.line) return -1;
            if (a.line > b.line) return 1;

            // If sectors and lines are equal, compare by cut_pcs (descending)
            const cutPcsA = a.cut_pcs || 0;
            const cutPcsB = b.cut_pcs || 0;
            if (cutPcsB > cutPcsA) return 1;
            if (cutPcsB < cutPcsA) return -1;

            return 0;
        });
    }, [rows, showCheckedOnly, selectedZones, filterText]);

    // Calculate summary statistics - analyze each unique line (sector + line combination)
    const summary = useMemo(() => {
        // Get all unique line combinations (sector + line)
        const uniqueLines = {};

        filteredRows.forEach(row => {
            // Skip rows where bundle is finished and coverage is 0.0
            const bundleStatus = row.bundle_status;
            const isFinished = bundleStatus && bundleStatus.toLowerCase() === 'finished';
            const coverage = row.coverage || 0;

            if (isFinished && coverage === 0) {
                return; // Skip this row
            }

            const lineKey = `${row.sector}|${row.line}`;
            if (!uniqueLines[lineKey]) {
                uniqueLines[lineKey] = {
                    sector: row.sector,
                    line: row.line,
                    allRows: [],
                    activeRows: []
                };
            }
            uniqueLines[lineKey].allRows.push(row);
            if (row.check) {
                uniqueLines[lineKey].activeRows.push(row);
            }
        });

        // Analyze each line
        const lineAnalysis = Object.values(uniqueLines).map(lineData => {
            const { sector, line, allRows, activeRows } = lineData;

            // ERROR: No active rows for this line
            if (activeRows.length === 0) {
                return {
                    sector,
                    line,
                    status: 'error',
                    message: 'No active coverage',
                    coverage: null,
                    totalRows: allRows.length,
                    activeCount: 0
                };
            }

            // Calculate total coverage for this line (sum of all active rows)
            const totalCoverage = activeRows.reduce((sum, row) => {
                return sum + (row.coverage || 0);
            }, 0);

            // CRITICAL: Coverage below 1.5 days
            if (totalCoverage < 1.5) {
                return {
                    sector,
                    line,
                    status: 'critical',
                    message: 'Low coverage',
                    coverage: totalCoverage,
                    totalRows: allRows.length,
                    activeCount: activeRows.length,
                    orders: activeRows.map(r => ({ order: r.order, article: r.article, coverage: r.coverage }))
                };
            }

            // OK: Adequate coverage
            return {
                sector,
                line,
                status: 'ok',
                message: 'Adequate coverage',
                coverage: totalCoverage,
                totalRows: allRows.length,
                activeCount: activeRows.length
            };
        });

        // Sort by status (error first, then critical, then ok) and by coverage
        const sortedAnalysis = lineAnalysis.sort((a, b) => {
            // Status priority: error > critical > ok
            const statusPriority = { error: 0, critical: 1, ok: 2 };
            if (statusPriority[a.status] !== statusPriority[b.status]) {
                return statusPriority[a.status] - statusPriority[b.status];
            }
            // Within same status, sort by coverage (nulls last)
            if (a.coverage === null) return 1;
            if (b.coverage === null) return -1;
            return a.coverage - b.coverage;
        });

        // Get error and critical lines
        const errorLines = sortedAnalysis.filter(l => l.status === 'error');
        const criticalLines = sortedAnalysis.filter(l => l.status === 'critical');
        const problemLines = [...errorLines, ...criticalLines];

        // Find orders that appear in multiple lines (check ALL rows, not just critical)
        const orderOccurrences = {};

        // Group all rows by line to get all orders per line
        const lineOrders = {};
        rows.forEach(row => {
            if (row.order) {
                const lineKey = `${row.sector}|${row.line}`;
                if (!lineOrders[lineKey]) {
                    lineOrders[lineKey] = {
                        line: row.line,
                        orders: new Set()
                    };
                }
                lineOrders[lineKey].orders.add(row.order);
            }
        });

        // Build order occurrences across all lines
        Object.values(lineOrders).forEach(lineData => {
            lineData.orders.forEach(order => {
                if (!orderOccurrences[order]) {
                    orderOccurrences[order] = [];
                }
                orderOccurrences[order].push(lineData.line);
            });
        });

        // Filter to only orders that appear in multiple lines
        const sharedOrders = Object.entries(orderOccurrences)
            .filter(([order, lines]) => lines.length > 1)
            .reduce((acc, [order, lines]) => {
                acc[order] = lines;
                return acc;
            }, {});

        return {
            allLines: sortedAnalysis,
            errorLines,
            criticalLines,
            problemLines,
            errorCount: errorLines.length,
            criticalCount: criticalLines.length,
            totalProblemCount: errorLines.length + criticalLines.length,
            sharedOrders // Orders that appear in multiple lines (across ALL rows)
        };
    }, [filteredRows, rows]);

    const handleZoneToggle = (zone) => {
        setSelectedZones(prev => ({
            ...prev,
            [zone]: !prev[zone]
        }));
    };

    // Helper function to format date to DD Mon
    const formatDate = (dateString) => {
        if (!dateString) return '';

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Try to parse as ISO date format (YYYY-MM-DD) from database
        if (dateString.includes('-')) {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                const day = date.getDate();
                const monthIndex = date.getMonth();
                return `${day} ${monthNames[monthIndex]}`;
            }
        }

        // Fallback: Try MM/DD/YYYY format
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const monthIndex = parseInt(parts[0]) - 1;
            const day = parts[1];
            return `${day} ${monthNames[monthIndex]}`;
        }

        return dateString;
    };

    // Handle checkbox change
    const handleCheckChange = useCallback(async (recordId, currentValue) => {
        try {
            const response = await axios.put(`dashboard/coverage/update-check/${recordId}`, {
                check: !currentValue
            });

            if (response.data.success) {
                // Update local state
                setRows(prevRows =>
                    prevRows.map(row =>
                        row.id === recordId ? { ...row, check: !currentValue } : row
                    )
                );
            }
        } catch (error) {
            console.error('Error updating check status:', error);
            alert('Failed to update check status');
        }
    }, []);

    const columns = useMemo(() => [
        {
            field: 'check',
            headerName: 'Check',
            width: 80,
            renderCell: (params) => (
                <Checkbox
                    checked={params.value || false}
                    onChange={() => handleCheckChange(params.row.id, params.value)}
                />
            )
        },
        {
            field: 'inline_date_1',
            headerName: 'Date',
            width: 120,
            renderCell: (params) => {
                const date1 = params.row.inline_date_1;
                const date2 = params.row.inline_date_2;
                const date3 = params.row.inline_date_3;
                const hasAdditionalDates = date2 || date3;

                if (!date1) return null;

                const formattedDate1 = formatDate(date1);

                if (hasAdditionalDates) {
                    const tooltipText = [date1, date2, date3].filter(d => d).join('\n');
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{formattedDate1}</span>
                            <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{tooltipText}</div>} arrow>
                                <IconButton size="small" sx={{ padding: 0 }}>
                                    <InfoIcon fontSize="small" color="primary" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    );
                }

                return <span>{formattedDate1}</span>;
            }
        },
        { field: 'sector', headerName: 'Sector', width: 100 },
        { field: 'line', headerName: 'Line', width: 90 },
        { field: 'order', headerName: 'Order', width: 150 },
        { field: 'article', headerName: 'Article', width: 120 },
        { field: 'plan_pcs', headerName: 'Pcs', width: 100, align: 'left', headerAlign: 'left' },
        {
            field: 'cut_pcs',
            headerName: 'Cut Pcs',
            width: 130,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                // Don't show if not checked
                if (!params.row.check) return null;
                const cutPcs = params.value;
                const fractionCut = params.row.fraction_cut;
                const percentage = fractionCut ? Math.round(fractionCut * 100) : 0;
                const bundleStatus = params.row.bundle_status;
                const isFinished = bundleStatus && bundleStatus.toLowerCase() === 'finished';

                // Build the display text
                let displayText = cutPcs;
                if (percentage > 0) {
                    displayText = `${cutPcs} (${percentage}%)`;
                }

                // If bundle is finished, show icon with text
                if (isFinished) {
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                            <span>{displayText}</span>
                        </Box>
                    );
                }

                return displayText;
            }
        },
        {
            field: 'stilltocut_pcs',
            headerName: 'Still to Cut',
            width: 110,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                // Don't show if not checked
                if (!params.row.check) return null;

                // If bundle is finished, show "-" instead of the value
                const bundleStatus = params.row.bundle_status;
                const isFinished = bundleStatus && bundleStatus.toLowerCase() === 'finished';

                if (isFinished) {
                    return '-';
                }

                return params.value;
            }
        },
        {
            field: 'wh_pcs',
            headerName: 'WH Pcs',
            width: 100,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                // Don't show if not checked
                if (!params.row.check) return null;
                return params.value;
            }
        },
        {
            field: 'queue_pcs',
            headerName: 'Queue Pcs',
            width: 100,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                // Don't show if not checked
                if (!params.row.check) return null;
                return params.value;
            }
        },
        {
            field: 'target_pcs',
            headerName: 'Target Pcs',
            width: 110,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                // Don't show if not checked
                if (!params.row.check) return null;
                return params.value != null ? Math.round(params.value) : '';
            }
        },
        {
            field: 'coverage',
            headerName: 'Coverage',
            width: 120,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                // Don't show if not checked
                if (!params.row.check) return null;
                if (params.value == null) return '';

                const coverageValue = params.value;
                const isLow = coverageValue < 1.5;
                const operators = params.row.operators || 0;
                const wipPcs = params.row.wip_pcs || 0;

                // Build tooltip content
                let tooltipContent = `Operators: ${operators}`;
                if (wipPcs > 0) {
                    tooltipContent += `\nWIP Pcs: ${wipPcs}`;
                }

                return (
                    <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{tooltipContent}</div>} arrow>
                        <span
                            style={{
                                color: isLow ? '#f44336' : 'inherit',
                                fontWeight: isLow ? 600 : 'normal',
                                textShadow: isLow ? '0 0 8px rgba(244, 67, 54, 0.4)' : 'none'
                            }}
                        >
                            {coverageValue.toFixed(1)} days
                        </span>
                    </Tooltip>
                );
            }
        }
    ], [handleCheckChange]);

    // Helper function to format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const day = date.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${hours}:${minutes}`;
    };

    return (
        <>
            <style>
                {`
                    @keyframes pulse {
                        0%, 100% {
                            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
                        }
                        50% {
                            box-shadow: 0 0 0 8px rgba(244, 67, 54, 0);
                        }
                    }
                `}
            </style>
            <MainCard
                title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>Coverage Analysis</span>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'normal' }}>
                            Version:
                        </Typography>
                        <Select
                            value={selectedTimestamp}
                            onChange={(e) => setSelectedTimestamp(e.target.value)}
                            size="small"
                            sx={{
                                minWidth: 150,
                                fontSize: '0.875rem',
                                fontWeight: 'normal',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(0, 0, 0, 0.23)'
                                },
                                '& .MuiSelect-select': {
                                    fontWeight: 'normal'
                                }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        '& .MuiMenuItem-root': {
                                            fontWeight: 'normal'
                                        }
                                    }
                                }
                            }}
                        >
                            <MenuItem value="current" sx={{ fontWeight: 'normal' }}>
                                Current {lastUpdated && `(${formatTimestamp(lastUpdated)})`}
                            </MenuItem>
                            {availableTimestamps.map((ts, index) => (
                                <MenuItem key={index} value={ts.value} sx={{ fontWeight: 'normal' }}>
                                    {ts.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                </Box>
            }
            secondary={
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={showCheckedOnly}
                                onChange={(e) => setShowCheckedOnly(e.target.checked)}
                                size="small"
                                color="secondary"
                            />
                        }
                        label="Active"
                    />
                    <FormGroup row>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedZones.Z1}
                                    onChange={() => handleZoneToggle('Z1')}
                                    size="small"
                                    color="secondary"
                                />
                            }
                            label="Z1"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedZones.Z2}
                                    onChange={() => handleZoneToggle('Z2')}
                                    size="small"
                                    color="secondary"
                                />
                            }
                            label="Z2"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedZones.Z3}
                                    onChange={() => handleZoneToggle('Z3')}
                                    size="small"
                                    color="secondary"
                                />
                            }
                            label="Z3"
                        />
                    </FormGroup>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        sx={{ width: 200 }}
                    />
                </Box>
            }
        >
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 220px)' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Floating Buttons Container */}
                    <Box
                        sx={{
                            position: 'fixed',
                            top: '54.5%',
                            right: 10,
                            transform: 'translateY(-50%)',
                            zIndex: 1300,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        {/* Error Button - Only show when there are errors */}
                        {summary.errorCount > 0 && (
                            <Box
                                sx={{
                                    backgroundColor: 'background.paper',
                                    borderRadius: 2,
                                    boxShadow: 3,
                                    border: '2px solid #f44336',
                                    animation: 'pulse 2s infinite'
                                }}
                            >
                                <Tooltip
                                    title="ERRORS - No Active Coverage"
                                    placement="left"
                                    arrow
                                >
                                    <IconButton
                                        size="medium"
                                        onClick={() => setErrorDialogOpen(true)}
                                        sx={{
                                            color: '#f44336',
                                            m: 0.5,
                                            position: 'relative',
                                            '&:hover': {
                                                backgroundColor: '#f44336',
                                                color: 'white'
                                            }
                                        }}
                                    >
                                        <WarningIcon />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid white'
                                            }}
                                        >
                                            {summary.errorCount}
                                        </Box>
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}

                        {/* Summary Button */}
                        <Box
                            sx={{
                                backgroundColor: 'background.paper',
                                borderRadius: 2,
                                boxShadow: 3,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Tooltip
                                title="Coverage Summary"
                                placement="left"
                                arrow
                            >
                                <IconButton
                                    size="medium"
                                    onClick={() => setSummaryOpen(true)}
                                    sx={{
                                        color: summary.criticalCount > 0 ? '#ff9800' : '#673ab7',
                                        m: 0.5,
                                        position: 'relative',
                                        '&:hover': {
                                            backgroundColor: summary.criticalCount > 0 ? '#ff9800' : '#673ab7',
                                            color: 'white'
                                        }
                                    }}
                                >
                                    <AssessmentIcon />
                                    {summary.criticalCount > 0 && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                backgroundColor: '#ff9800',
                                                color: 'white',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid white'
                                            }}
                                        >
                                            {summary.criticalCount}
                                        </Box>
                                    )}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Main Data Table */}
                    <Box sx={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                        <DataGrid
                            rows={filteredRows}
                            columns={columns}
                            hideFooterPagination
                            hideFooter
                            disableRowSelectionOnClick
                            getRowClassName={(params) => {
                                // Extract line number from line field (e.g., "Z1-01" -> "01")
                                const lineMatch = params.row.line?.match(/-(\d+)$/);
                                if (lineMatch) {
                                    const lineNumber = parseInt(lineMatch[1], 10);
                                    return lineNumber % 2 === 0 ? 'even-line' : 'odd-line';
                                }
                                return '';
                            }}
                            sx={{
                                '& .MuiDataGrid-row.even-line': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)', // Light grey for even lines
                                },
                                '& .MuiDataGrid-row.odd-line': {
                                    backgroundColor: 'transparent',
                                },
                                '& .MuiDataGrid-row': {
                                    '&:hover': {
                                        backgroundColor: 'rgba(103, 58, 183, 0.08) !important' // Purple hover effect
                                    }
                                }
                            }}
                        />
                    </Box>
                </>
            )}

            {/* Summary Dialog */}
            <Dialog
                open={summaryOpen}
                onClose={() => setSummaryOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        maxHeight: '80vh'
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssessmentIcon color="primary" />
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            Low Coverage Summary
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

                        {/* CRITICAL SECTION - Lines with low coverage */}
                        {summary.criticalLines.length > 0 && (
                            <Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {summary.criticalLines.map((lineData, idx) => (
                                        <Card
                                            key={idx}
                                            sx={{
                                                border: '1px solid rgba(0, 0, 0, 0.12)',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Box>
                                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                            {lineData.line}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Total coverage:
                                                        </Typography>
                                                        <Typography
                                                            variant="h5"
                                                            sx={{
                                                                color: 'text.primary',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {lineData.coverage.toFixed(1)} days
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Show orders for critical lines */}
                                                {lineData.orders && lineData.orders.length > 0 && (
                                                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                                                            Active Orders:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            {lineData.orders.map((orderInfo, orderIdx) => {
                                                                const isShared = summary.sharedOrders[orderInfo.order];
                                                                const allLines = isShared ? [...isShared].sort() : [];

                                                                return (
                                                                    <Box
                                                                        key={orderIdx}
                                                                        sx={{
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            pl: 1,
                                                                            borderLeft: '3px solid rgba(0, 0, 0, 0.12)',
                                                                            backgroundColor: 'transparent'
                                                                        }}
                                                                    >
                                                                        <Box>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                                    {orderInfo.order}
                                                                                </Typography>
                                                                                {isShared && (
                                                                                    <CallSplitIcon
                                                                                        sx={{
                                                                                            fontSize: 16,
                                                                                            color: '#d32f2f'
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                                {isShared && (
                                                                                    <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                                                                                        ({allLines.join(', ')})
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {orderInfo.article}
                                                                            </Typography>
                                                                        </Box>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                                            {orderInfo.coverage?.toFixed(1)} days
                                                                        </Typography>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* SUCCESS MESSAGE - All OK */}
                        {summary.criticalLines.length === 0 && (
                            <Card sx={{ border: '2px solid #4caf50', backgroundColor: 'rgba(76, 175, 80, 0.05)' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <InfoIcon sx={{ color: '#4caf50', fontSize: 32 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#4caf50' }}>
                                            ✓ All Lines Have Adequate Coverage
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 5 }}>
                                        All production lines have active coverage of 1.5 days or more.
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Error-Only Dialog */}
            <Dialog
                open={errorDialogOpen}
                onClose={() => setErrorDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        border: '3px solid #f44336'
                    }
                }}
            >
                <DialogTitle sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon sx={{ color: '#f44336', fontSize: 32 }} />
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#f44336' }}>
                            ERRORS - No Active Coverage
                        </Typography>
                        <Chip
                            label={summary.errorCount}
                            size="small"
                            sx={{
                                backgroundColor: '#f44336',
                                color: 'white',
                                fontWeight: 600
                            }}
                        />
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Error Lines List */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#f44336' }}>
                                Lines with no active coverage:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {summary.errorLines.map((lineData, idx) => (
                                    <Card
                                        key={idx}
                                        sx={{
                                            border: '2px solid #f44336',
                                            backgroundColor: 'rgba(244, 67, 54, 0.05)'
                                        }}
                                    >
                                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {lineData.line}
                                                </Typography>
                                                <Chip
                                                    label="NO ACTIVE COVERAGE"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
            </MainCard>
        </>
    );
};

export default Coverage;

