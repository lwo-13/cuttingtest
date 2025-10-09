import PropTypes from 'prop-types';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'utils/axiosInstance';

// material-ui
import { Grid, MenuItem, TextField, Typography, useTheme } from '@mui/material';

// third-party
import ApexCharts from 'apexcharts';
import Chart from 'react-apexcharts';

// project imports
import SkeletonTotalGrowthBarChart from './../../../ui-component/cards/Skeleton/TotalGrowthBarChart';
import MainCard from './../../../ui-component/cards/MainCard';
import { gridSpacing } from './../../../store/constant';
import { getCuttingRoomColor } from '../../../utils/productionCenterConfig';
import { createChartSeries, getSeriesColors, getBrandColor } from '../../../utils/dashboardDataProcessor';

// chart data
import chartData from './chart-data/total-meters-spreaded-chart';

const status = [
    {
        value: 'today',
        label: 'Today'
    },
    {
        value: 'week',
        label: 'Last 7 Days'
    },
    {
        value: 'month',
        label: 'Last 30 Days'
    },
    {
        value: 'year',
        label: 'Last 365 Days'
    }
];

const allBreakdownOptions = [
    { value: 'none', label: 'None' },
    { value: 'brand', label: 'Brand' },
    { value: 'style', label: 'Style' },
    { value: 'spreader', label: 'Spreader' },
    { value: 'operator', label: 'Operator' }
];

//-----------------------|| DASHBOARD DEFAULT - TOTAL METERS SPREADED BAR CHART ||-----------------------//

const TotalMetersSpreadedChart = ({ isLoading, selectedPeriod, onPeriodChange, selectedCuttingRoom, onCuttingRoomChange, hideCuttingRoomSelector, isAllCuttingRoomsPage, onTotalMetersChange }) => {
    const [value, setValue] = useState(selectedPeriod || 'today');
    const [cuttingRoom, setCuttingRoom] = useState(selectedCuttingRoom || 'ALL');
    const [cuttingRooms, setCuttingRooms] = useState([]);
    const [selectedBreakdown, setSelectedBreakdown] = useState('none');
    const [totalMeters, setTotalMeters] = useState(0);
    const [apiCache, setApiCache] = useState({}); // Cache API responses
    const [rawMattressData, setRawMattressData] = useState(null); // Cache raw mattress data
    const [isLoadingRawData, setIsLoadingRawData] = useState(false);

    // Notify parent when total meters changes
    useEffect(() => {
        console.log(`🔔 TotalMetersSpreadedChart - Notifying parent: totalMeters=${totalMeters}`);
        if (onTotalMetersChange) {
            onTotalMetersChange(totalMeters);
        }
    }, [totalMeters, onTotalMetersChange]);

    // Clear cache when period or cutting room changes
    useEffect(() => {
        console.log(`🗑️ Clearing cache due to period/cutting room change`);
        setApiCache({});
    }, [value, cuttingRoom]);

    // Filter breakdown options based on whether we're on the "All Cutting Rooms" page
    const breakdownOptions = isAllCuttingRoomsPage
        ? allBreakdownOptions.filter(opt => opt.value !== 'spreader' && opt.value !== 'operator')
        : allBreakdownOptions;
    const [chartDataState, setChartDataState] = useState({
        ...chartData,
        series: [] // Start with empty series to avoid showing placeholder data
    });
    const theme = useTheme();

    const primary = theme.palette.text.primary;
    const grey200 = theme.palette.grey[200];
    const primary200 = theme.palette.primary[200];
    const primaryDark = theme.palette.primary.dark;
    const secondaryMain = theme.palette.secondary.main;
    const secondaryLight = theme.palette.secondary.light;
    const grey500 = theme.palette.grey[500];

    // Sync chart date filter with global dashboard date filter
    useEffect(() => {
        if (selectedPeriod) {
            setValue(selectedPeriod);
        }
    }, [selectedPeriod]);

    // Sync cutting room with global dashboard cutting room filter
    useEffect(() => {
        if (selectedCuttingRoom) {
            setCuttingRoom(selectedCuttingRoom);
        }
    }, [selectedCuttingRoom]);

    // Reset breakdown if on "All Cutting Rooms" page and current breakdown is spreader or operator
    useEffect(() => {
        if (isAllCuttingRoomsPage && (selectedBreakdown === 'spreader' || selectedBreakdown === 'operator')) {
            setSelectedBreakdown('none');
        }
    }, [isAllCuttingRoomsPage, selectedBreakdown]);

    // Fetch cutting rooms on component mount
    useEffect(() => {
        const fetchCuttingRooms = async () => {
            try {
                const response = await axios.get('/dashboard/cutting-rooms');
                if (response.data.success) {
                    setCuttingRooms(['ALL', ...response.data.data]);
                }
            } catch (error) {
                console.error('Error fetching cutting rooms:', error);
                // Fallback to common cutting room names
                setCuttingRooms(['ALL', 'ZALLI', 'DELICIA', 'MAIN']);
            }
        };

        fetchCuttingRooms();
    }, []);

    // Fetch raw mattress data once when period or cutting room changes
    useEffect(() => {
        const fetchRawData = async () => {
            setIsLoadingRawData(true);
            try {
                console.log(`🔄 Fetching raw mattress data: period=${value}, cutting_room=${cuttingRoom}`);
                const response = await axios.get(`/dashboard/meters-raw-data?period=${value}&cutting_room=${cuttingRoom}`);

                if (response.data.success) {
                    console.log(`✅ Fetched ${response.data.total_records} mattress records`);
                    setRawMattressData(response.data.data);
                } else {
                    console.error('Failed to fetch raw data:', response.data.message);
                    setRawMattressData([]);
                }
            } catch (error) {
                console.error('Error fetching raw data:', error);
                setRawMattressData([]);
            } finally {
                setIsLoadingRawData(false);
            }
        };

        fetchRawData();
    }, [value, cuttingRoom]); // Only refetch when period or cutting room changes

    // Fetch real data from API with caching
    useEffect(() => {
        // Only fetch data if cutting rooms are loaded
        if (cuttingRooms.length === 0) return;

        const fetchMetersData = async () => {
            try {
                // Define x-axis categories based on period
                let categories = [];
                switch (value) {
                    case 'today':
                        categories = ['Today'];
                        break;
                    case 'week':
                        // Last 7 days
                        categories = [];
                        for (let i = 6; i >= 0; i--) {
                            const date = new Date();
                            date.setDate(date.getDate() - i);
                            categories.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                        }
                        break;
                    case 'month':
                        // Last 4 weeks
                        categories = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                        break;
                    case 'year':
                        categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        break;
                    default:
                        categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                }

                // Calculate colors for all cutting rooms
                const allRooms = cuttingRooms.filter(room => room !== 'ALL').sort();
                const colorMap = {};
                allRooms.forEach((room) => {
                    colorMap[room] = getCuttingRoomColor(room);
                });

                let colors;
                let series;
                let totalMetersSum = 0;

                console.log(`🔍 Data fetch logic: breakdown=${selectedBreakdown}, cuttingRoom=${cuttingRoom}`);

                // Build breakdown query parameter
                const breakdownParam = selectedBreakdown !== 'none'
                    ? `&breakdown=${selectedBreakdown}`
                    : '';

                if (selectedBreakdown !== 'none') {
                    console.log(`📊 Branch: WITH breakdown`);

                    // Check cache first
                    const cacheKey = `${value}_${cuttingRoom}_${selectedBreakdown}`;
                    console.log(`🔑 Cache key: ${cacheKey}`);
                    console.log(`📦 Current cache keys:`, Object.keys(apiCache));
                    let response;

                    if (apiCache[cacheKey]) {
                        console.log(`✅ Using cached data for ${cacheKey}`);
                        response = apiCache[cacheKey];
                    } else {
                        console.log(`🔄 Fetching data for ${cacheKey} (cache miss)`);
                        response = await axios.get(`/dashboard/meters-spreaded?period=${value}&cutting_room=${cuttingRoom}${breakdownParam}`);
                        // Cache the response
                        console.log(`💾 Storing in cache: ${cacheKey}`);
                        setApiCache(prev => {
                            const newCache = { ...prev, [cacheKey]: response };
                            console.log(`📦 New cache keys:`, Object.keys(newCache));
                            return newCache;
                        });
                    }

                    if (response.data.success) {
                        setTotalMeters(response.data.data.total_meters || 0);

                        const breakdownSeries = response.data.data.breakdown_series || {};
                        series = Object.keys(breakdownSeries).map(key => ({
                            name: key,
                            data: breakdownSeries[key]
                        }));

                        // Sort series alphabetically for consistent display
                        series.sort((a, b) => a.name.localeCompare(b.name));

                        // Brand color mapping
                        const brandColors = {
                            'CALZEDONIA': '#66BB6A',  // Green
                            'INTIMISSIMI': '#F06292',  // Rose pink
                            'TEZENIS': '#42A5F5',      // Bright blue
                            'FALCONERI': '#FFF59D'     // Pastel yellow
                        };

                        // Generate colors for breakdown series
                        if (selectedBreakdown === 'brand') {
                            // Use hardcoded brand colors
                            colors = series.map(s => {
                                return brandColors[s.name] || theme.palette.grey[500];
                            });
                        } else {
                            // Use color palette for other breakdowns
                            colors = series.map((_, index) => {
                                const colorPalette = [
                                    theme.palette.primary.main,
                                    theme.palette.secondary.main,
                                    theme.palette.success.main,
                                    theme.palette.warning.main,
                                    theme.palette.error.main,
                                    theme.palette.info.main,
                                    '#9c27b0', '#ff9800', '#795548', '#607d8b'
                                ];
                                return colorPalette[index % colorPalette.length];
                            });
                        }

                        setChartDataState(prev => ({
                            ...prev,
                            options: {
                                ...prev.options,
                                chart: {
                                    ...prev.options.chart,
                                    stacked: true,
                                    events: {
                                        legendClick: function(chartContext, seriesIndex, config) {
                                            // Get the current series data
                                            const allSeries = config.globals.initialSeries;
                                            const collapsedSeries = config.globals.collapsedSeriesIndices;

                                            // Calculate new total based on visible series
                                            let newTotal = 0;
                                            allSeries.forEach((s, index) => {
                                                // Check if this series will be visible after the click
                                                const isCurrentlyCollapsed = collapsedSeries.includes(index);
                                                const willBeVisible = index === seriesIndex ? isCurrentlyCollapsed : !collapsedSeries.includes(index);

                                                if (willBeVisible) {
                                                    // Sum all values in this series
                                                    s.data.forEach(val => {
                                                        newTotal += val || 0;
                                                    });
                                                }
                                            });

                                            // Update the total meters display
                                            setTotalMeters(Math.round(newTotal));
                                        }
                                    }
                                },
                                legend: {
                                    ...prev.options.legend,
                                    show: true
                                },
                                colors: colors,
                                xaxis: {
                                    ...prev.options.xaxis,
                                    categories: categories
                                },
                                tooltip: {
                                    shared: false,
                                    intersect: true,
                                    custom: function({ series, seriesIndex, dataPointIndex, w }) {
                                        // Calculate total for this data point across all series
                                        let total = 0;
                                        for (let i = 0; i < series.length; i++) {
                                            total += series[i][dataPointIndex] || 0;
                                        }

                                        const value = series[seriesIndex][dataPointIndex];
                                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                        const seriesName = w.globals.seriesNames[seriesIndex];

                                        return `<div class="apexcharts-tooltip-custom" style="padding: 8px 12px; background: #fff; border: 1px solid #e3e3e3; border-radius: 4px;">
                                            <div style="font-weight: 600; margin-bottom: 4px;">${seriesName}</div>
                                            <div>${Math.round(value).toLocaleString()} meters (${percentage}%)</div>
                                        </div>`;
                                    }
                                }
                            },
                            series: series
                        }));
                    }
                } else if (cuttingRoom === 'ALL') {
                    console.log(`📊 Branch: ALL cutting rooms (no breakdown)`);
                    // For ALL view, fetch data for each cutting room separately and stack them
                    const roomsToFetch = cuttingRooms.filter(room => room !== 'ALL');

                    // Fetch data for all cutting rooms in parallel with caching
                    const promises = roomsToFetch.map(room => {
                        const cacheKey = `${value}_${room}_none`;
                        if (apiCache[cacheKey]) {
                            console.log(`✅ Using cached data for ${cacheKey}`);
                            return Promise.resolve(apiCache[cacheKey]);
                        } else {
                            console.log(`🔄 Fetching data for ${cacheKey}`);
                            return axios.get(`/dashboard/meters-spreaded?period=${value}&cutting_room=${room}`).then(response => {
                                setApiCache(prev => ({ ...prev, [cacheKey]: response }));
                                return response;
                            });
                        }
                    });

                    const responses = await Promise.all(promises);

                    // Build series data from responses
                    series = [];
                    responses.forEach((response, index) => {
                        if (response.data.success) {
                            const roomName = roomsToFetch[index];
                            const roomData = response.data.data.chart_data || [];

                            // Only add series if there's actual data (not all zeros)
                            const hasData = roomData.some(val => val > 0);
                            if (hasData) {
                                series.push({
                                    name: roomName,
                                    data: roomData
                                });
                                totalMetersSum += (response.data.data.total_meters || 0);
                            }
                        }
                    });

                    // Sort series alphabetically for consistent display
                    series.sort((a, b) => a.name.localeCompare(b.name));

                    // Set colors to match series order
                    colors = series.map(s => colorMap[s.name]);

                    console.log(`✅ Setting totalMeters to ${totalMetersSum} for ALL cutting rooms`);
                    setTotalMeters(totalMetersSum);

                    setChartDataState(prev => ({
                        ...prev,
                        options: {
                            ...prev.options,
                            chart: {
                                ...prev.options.chart,
                                stacked: true
                            },
                            legend: {
                                ...prev.options.legend,
                                show: true
                            },
                            colors: colors,
                            xaxis: {
                                ...prev.options.xaxis,
                                categories: categories
                            }
                        },
                        series: series
                    }));
                } else {
                    console.log(`📊 Branch: Single cutting room (no breakdown)`);
                    // Show single series for specific cutting room
                    const cacheKey = `${value}_${cuttingRoom}_none`;
                    let response;

                    if (apiCache[cacheKey]) {
                        console.log(`✅ Using cached data for ${cacheKey}`);
                        response = apiCache[cacheKey];
                    } else {
                        console.log(`🔄 Fetching data for ${cacheKey}`);
                        response = await axios.get(`/dashboard/meters-spreaded?period=${value}&cutting_room=${cuttingRoom}`);
                        setApiCache(prev => ({ ...prev, [cacheKey]: response }));
                    }

                    if (response.data.success) {
                        setTotalMeters(response.data.data.total_meters || 0);

                        series = [
                            {
                                name: cuttingRoom,
                                data: response.data.data.chart_data || []
                            }
                        ];
                        colors = [colorMap[cuttingRoom]];

                        setChartDataState(prev => ({
                            ...prev,
                            options: {
                                ...prev.options,
                                chart: {
                                    ...prev.options.chart,
                                    stacked: false
                                },
                                legend: {
                                    ...prev.options.legend,
                                    show: true
                                },
                                colors: colors,
                                xaxis: {
                                    ...prev.options.xaxis,
                                    categories: categories
                                }
                            },
                            series: series
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching meters data:', error);
                // Clear chart data on error
                setTotalMeters(0);
                setChartDataState(prev => ({
                    ...prev,
                    series: []
                }));
            }
        };

        fetchMetersData();
    }, [value, cuttingRoom, cuttingRooms, selectedBreakdown]);

    // Update chart styling (without colors, as colors are handled in data fetch)
    useEffect(() => {
        const newChartData = {
            ...chartDataState.options,
            xaxis: {
                ...chartDataState.options.xaxis,
                labels: {
                    style: {
                        colors: Array(12).fill(primary)
                    }
                }
            },
            yaxis: {
                ...chartDataState.options.yaxis,
                labels: {
                    style: {
                        colors: [primary]
                    },
                    formatter: function (val) {
                        return Math.round(val).toLocaleString();
                    }
                }
            },
            grid: {
                ...chartDataState.options.grid,
                borderColor: grey200
            },
            tooltip: {
                ...chartDataState.options.tooltip,
                theme: 'light',
                y: {
                    formatter: function (val) {
                        return Math.round(val).toLocaleString() + " meters";
                    }
                }
            },
            legend: {
                ...chartDataState.options.legend,
                show: true,
                showForSingleSeries: true,
                labels: {
                    colors: grey500
                }
            }
        };

        // do not load chart when loading
        if (!isLoading) {
            ApexCharts.exec(`meters-bar-chart`, 'updateOptions', newChartData);
        }
    }, [primary, grey200, isLoading, grey500, chartDataState]);

    return (
        <React.Fragment>
            {isLoading ? (
                <SkeletonTotalGrowthBarChart />
            ) : (
                <MainCard>
                    <Grid container spacing={gridSpacing}>
                        <Grid item xs={12}>
                            <Grid container alignItems="center" justifyContent="space-between">
                                <Grid item>
                                    <Grid container direction="column" spacing={1}>
                                        <Grid item>
                                            <Typography variant="subtitle2">Total Meters Completed</Typography>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="h3">{Math.round(totalMeters).toLocaleString()} m</Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item>
                                    <Grid container spacing={1}>
                                        {!hideCuttingRoomSelector && (
                                            <Grid item>
                                                <TextField
                                                    id="standard-select-cutting-room"
                                                    select
                                                    value={cuttingRoom}
                                                    onChange={(e) => {
                                                        const newCuttingRoom = e.target.value;
                                                        setCuttingRoom(newCuttingRoom);
                                                        // Notify parent component
                                                        if (onCuttingRoomChange) {
                                                            onCuttingRoomChange(newCuttingRoom);
                                                        }
                                                    }}
                                                    size="small"
                                                    sx={{ minWidth: 120 }}
                                                >
                                                    {cuttingRooms.map((room) => (
                                                        <MenuItem key={room} value={room}>
                                                            {room}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Grid>
                                        )}
                                        <Grid item>
                                            <TextField
                                                id="standard-select-breakdown"
                                                select
                                                value={selectedBreakdown}
                                                onChange={(e) => setSelectedBreakdown(e.target.value)}
                                                size="small"
                                                sx={{ minWidth: 180 }}
                                            >
                                                {breakdownOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid item>
                                            <TextField
                                                id="standard-select-period"
                                                select
                                                value={value}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    setValue(newValue);
                                                    // Update the global dashboard filter
                                                    if (onPeriodChange) {
                                                        onPeriodChange(newValue);
                                                    }
                                                }}
                                                size="small"
                                                sx={{ minWidth: 120 }}
                                            >
                                                {status.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Chart {...chartDataState} />
                        </Grid>
                    </Grid>
                </MainCard>
            )}
        </React.Fragment>
    );
};

TotalMetersSpreadedChart.propTypes = {
    isLoading: PropTypes.bool,
    selectedPeriod: PropTypes.string,
    onPeriodChange: PropTypes.func,
    selectedCuttingRoom: PropTypes.string,
    onCuttingRoomChange: PropTypes.func,
    hideCuttingRoomSelector: PropTypes.bool,
    isAllCuttingRoomsPage: PropTypes.bool,
    onTotalMetersChange: PropTypes.func
};

export default TotalMetersSpreadedChart;
