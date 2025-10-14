import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
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
import { getConsistentColors, getBrandColor as getConsistentBrandColor } from '../../../utils/colorUtils';

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

//-----------------------|| DASHBOARD DEFAULT - TOTAL PIECES SPREADED BAR CHART ||-----------------------//

const TotalPiecesSpreadedChart = ({ isLoading, selectedPeriod, onPeriodChange, selectedCuttingRoom, hideCuttingRoomSelector, selectedBreakdown, onBreakdownChange, isAllCuttingRoomsPage }) => {
    const [value, setValue] = useState(selectedPeriod || 'today');
    const [cuttingRoom, setCuttingRoom] = useState(selectedCuttingRoom || 'ALL');
    const [cuttingRooms, setCuttingRooms] = useState([]);
    const [totalPieces, setTotalPieces] = useState(0);
    const [apiCache, setApiCache] = useState({}); // Cache API responses
    const [chartDataState, setChartDataState] = useState({
        ...chartData,
        options: {
            ...chartData.options,
            chart: {
                ...chartData.options.chart,
                id: 'pieces-bar-chart' // Unique ID for pieces chart
            }
        },
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

    // Sync cutting room with prop
    useEffect(() => {
        if (selectedCuttingRoom) {
            setCuttingRoom(selectedCuttingRoom);
        }
    }, [selectedCuttingRoom]);

    // Filter breakdown options based on cutting room context
    const breakdownOptions = isAllCuttingRoomsPage
        ? allBreakdownOptions.filter(option => option.value !== 'spreader' && option.value !== 'operator')
        : allBreakdownOptions;

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

    // Fetch real data from API
    useEffect(() => {
        // Only fetch data if cutting rooms are loaded
        if (cuttingRooms.length === 0) return;

        const fetchPiecesData = async () => {
            try {
                // Use external breakdown if provided, otherwise default to 'none'
                const currentBreakdown = selectedBreakdown || 'none';

                // Build breakdown query parameter
                const breakdownParam = currentBreakdown !== 'none'
                    ? `&breakdown=${currentBreakdown}`
                    : '';

                let colors;
                let series;
                let totalPiecesSum = 0;
                let response; // Declare response variable at the top level

                if (currentBreakdown !== 'none') {
                    // Check cache first
                    const cacheKey = `${value}_${cuttingRoom}_${currentBreakdown}`;

                    if (apiCache[cacheKey]) {
                        response = apiCache[cacheKey];
                    } else {
                        response = await axios.get(`/dashboard/pieces-spreaded?period=${value}&cutting_room=${cuttingRoom}${breakdownParam}`);
                        // Cache the response
                        setApiCache(prev => ({ ...prev, [cacheKey]: response }));
                    }

                    if (response.data.success) {
                        setTotalPieces(response.data.data.total_pieces || 0);

                        const breakdownSeries = response.data.data.chart_data || {};
                        series = Object.keys(breakdownSeries).map(key => ({
                            name: key,
                            data: breakdownSeries[key]
                        }));

                        // Generate colors for breakdown series
                        if (currentBreakdown === 'brand') {
                            // Use consistent brand colors
                            colors = series.map(s => getConsistentBrandColor(s.name));
                        } else {
                            // Use consistent colors for other breakdowns (style, operator, spreader)
                            colors = getConsistentColors(series.map(s => s.name));
                        }
                    }
                } else if (cuttingRoom === 'ALL') {
                    // For ALL view, fetch data for each cutting room separately and stack them (same as meters chart)
                    const roomsToFetch = cuttingRooms.filter(room => room !== 'ALL');

                    // Fetch data for all cutting rooms in parallel with caching
                    const promises = roomsToFetch.map(room => {
                        const cacheKey = `${value}_${room}_none`;
                        if (apiCache[cacheKey]) {
                            return Promise.resolve(apiCache[cacheKey]);
                        } else {
                            return axios.get(`/dashboard/pieces-spreaded?period=${value}&cutting_room=${room}`).then(response => {
                                setApiCache(prev => ({ ...prev, [cacheKey]: response }));
                                return response;
                            });
                        }
                    });

                    const responses = await Promise.all(promises);

                    // Calculate colors for all cutting rooms
                    const allRooms = cuttingRooms.filter(room => room !== 'ALL').sort();
                    const colorMap = {};
                    allRooms.forEach((room) => {
                        colorMap[room] = getCuttingRoomColor(room);
                    });

                    // Build series data from responses
                    series = [];
                    let totalPiecesSum = 0;
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
                                totalPiecesSum += (response.data.data.total_pieces || 0);
                            }
                        }
                    });

                    // Sort series alphabetically for consistent display
                    series.sort((a, b) => a.name.localeCompare(b.name));

                    // Set colors to match series order
                    colors = series.map(s => colorMap[s.name]);

                    setTotalPieces(totalPiecesSum);
                } else {
                    // No breakdown - use simple API call for specific cutting room
                    response = await axios.get(`/dashboard/pieces-spreaded?period=${value}&cutting_room=${cuttingRoom}&_t=${Date.now()}`);
                    if (response.data.success) {
                        setTotalPieces(response.data.data.total_pieces || 0);

                        // Calculate colors for the current selection (same as meters chart)
                        const allRooms = cuttingRooms.filter(room => room !== 'ALL').sort();
                        const colorMap = {};
                        allRooms.forEach((room) => {
                            colorMap[room] = getCuttingRoomColor(room);
                        });

                        series = [{
                            name: cuttingRoom,
                            data: response.data.data.chart_data || []
                        }];
                        colors = [colorMap[cuttingRoom] || primaryDark];
                    }
                }

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

                // Update chart data with real data
                if ((currentBreakdown === 'none' && series && series.length > 0) ||
                    (currentBreakdown !== 'none' && series && series.length > 0)) {

                    // For breakdown === 'none', series and colors are already set above
                    // For breakdown !== 'none', series and colors are set in the breakdown section

                    // Update chart state
                    setChartDataState(prev => ({
                        ...prev,
                        options: {
                            ...prev.options,
                            chart: {
                                ...prev.options.chart,
                                stacked: currentBreakdown !== 'none' || cuttingRoom === 'ALL'
                            },
                            legend: {
                                ...prev.options.legend,
                                show: currentBreakdown !== 'none' || cuttingRoom === 'ALL'
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
                    // No chart data available, clear the chart
                    console.log('No chart data available, clearing chart');
                    setChartDataState(prev => ({
                        ...prev,
                        series: []
                    }));
                }
            } catch (error) {
                console.error('Error fetching pieces data:', error);
                // Clear chart data on error
                setTotalPieces(0);
                setChartDataState(prev => ({
                    ...prev,
                    series: []
                }));
            }
        };

        fetchPiecesData();
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
                        return Math.round(val).toLocaleString() + " pieces";
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
            ApexCharts.exec(`pieces-bar-chart`, 'updateOptions', newChartData);
        }
    }, [primary, grey200, isLoading, grey500, chartDataState]);

    return (
        <>
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
                                            <Typography variant="subtitle2">Total Pieces Completed</Typography>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="h3">{totalPieces.toLocaleString()}</Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item>
                                    <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
                                        {!hideCuttingRoomSelector && (
                                            <Grid item>
                                                <TextField
                                                    id="standard-select-cutting-room"
                                                    select
                                                    value={cuttingRoom}
                                                    onChange={(e) => setCuttingRoom(e.target.value)}
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
                                                onChange={(e) => {
                                                    const newBreakdown = e.target.value;
                                                    if (onBreakdownChange) {
                                                        onBreakdownChange(newBreakdown);
                                                    }
                                                }}
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
        </>
    );
};

TotalPiecesSpreadedChart.propTypes = {
    isLoading: PropTypes.bool,
    selectedPeriod: PropTypes.string,
    onPeriodChange: PropTypes.func,
    selectedCuttingRoom: PropTypes.string,
    hideCuttingRoomSelector: PropTypes.bool,
    selectedBreakdown: PropTypes.string,
    onBreakdownChange: PropTypes.func,
    isAllCuttingRoomsPage: PropTypes.bool
};

export default TotalPiecesSpreadedChart;
