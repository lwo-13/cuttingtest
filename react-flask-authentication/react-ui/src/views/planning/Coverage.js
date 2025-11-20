import React, { useState, useMemo, useEffect } from 'react';
import { Box, Checkbox, FormControlLabel, FormGroup, Paper, Tooltip, IconButton, CircularProgress, Typography, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import InfoIcon from '@mui/icons-material/Info';
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

    // Fetch data from API
    useEffect(() => {
        const fetchCoverageData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/dashboard/coverage');
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
    }, []);

    // Filter and sort rows based on selected filters
    const filteredRows = useMemo(() => {
        const filtered = rows.filter(row => {
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

        // Sort by sector first, then by line
        return filtered.sort((a, b) => {
            // First compare by sector
            if (a.sector < b.sector) return -1;
            if (a.sector > b.sector) return 1;

            // If sectors are equal, compare by line
            if (a.line < b.line) return -1;
            if (a.line > b.line) return 1;

            return 0;
        });
    }, [rows, showCheckedOnly, selectedZones, filterText]);

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

    const columns = useMemo(() => [
        {
            field: 'check',
            headerName: 'Check',
            width: 80,
            renderCell: (params) => (
                <Checkbox checked={params.value} disabled />
            )
        },
        {
            field: 'inline_date_1',
            headerName: 'Date',
            width: 120,
            renderCell: (params) => {
                // Don't show date if not checked
                if (!params.row.check) return null;

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

                // Don't show percentage if it's 0
                if (percentage === 0) {
                    return cutPcs;
                }

                return `${cutPcs} (${percentage}%)`;
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

                return (
                    <span
                        style={{
                            color: isLow ? '#f44336' : 'inherit',
                            fontWeight: isLow ? 600 : 'normal',
                            textShadow: isLow ? '0 0 8px rgba(244, 67, 54, 0.4)' : 'none'
                        }}
                    >
                        {coverageValue.toFixed(1)} days
                    </span>
                );
            }
        }
    ], []);

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
        <MainCard
            title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>Coverage Analysis</span>
                    {lastUpdated && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'normal' }}>
                            Last Updated: {formatTimestamp(lastUpdated)}
                        </Typography>
                    )}
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
                <Box sx={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                    <DataGrid
                        rows={filteredRows}
                        columns={columns}
                        hideFooterPagination
                        hideFooter
                        disableRowSelectionOnClick
                        sx={{
                            '& .MuiDataGrid-row': {
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }
                        }}
                    />
                </Box>
            )}
        </MainCard>
    );
};

export default Coverage;

