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

// chart data
import chartData from './chart-data/total-meters-spreaded-chart';

const status = [
    {
        value: 'today',
        label: 'Today'
    },
    {
        value: 'week',
        label: 'This Week'
    },
    {
        value: 'month',
        label: 'This Month'
    },
    {
        value: 'year',
        label: 'This Year'
    }
];

//-----------------------|| DASHBOARD DEFAULT - TOTAL PIECES SPREADED BAR CHART ||-----------------------//

const TotalPiecesSpreadedChart = ({ isLoading, selectedPeriod, onPeriodChange }) => {
    const [value, setValue] = useState(selectedPeriod || 'today');
    const [cuttingRoom, setCuttingRoom] = useState('ALL');
    const [cuttingRooms, setCuttingRooms] = useState([]);
    const [totalPieces, setTotalPieces] = useState(0);
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
                const response = await axios.get(`/dashboard/pieces-spreaded?period=${value}&cutting_room=${cuttingRoom}&_t=${Date.now()}`);
                if (response.data.success) {
                    setTotalPieces(response.data.data.total_pieces || 0);

                    // Debug: Log API response
                    console.log('API Response for period:', value, 'cutting_room:', cuttingRoom);
                    console.log('Chart data from API:', response.data.data.chart_data);
                    console.log('Total pieces:', response.data.data.total_pieces);

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
                    if (response.data.data.chart_data && response.data.data.chart_data.length > 0) {
                        // Calculate colors for the current selection
                        const allRooms = cuttingRooms.filter(room => room !== 'ALL').sort();
                        const colorMap = {};
                        allRooms.forEach((room) => {
                            colorMap[room] = getCuttingRoomColor(room);
                        });

                        let colors;
                        let series;

                        if (cuttingRoom === 'ALL') {
                            // For ALL view, show stacked data with Zalli real data and others as 0
                            const otherCuttingRooms = cuttingRooms.filter(room => room !== 'ALL' && room !== 'ZALLI');
                            series = [
                                {
                                    name: 'ZALLI',
                                    data: response.data.data.chart_data
                                }
                            ];

                            // Add all other cutting rooms with 0 data
                            otherCuttingRooms.forEach(room => {
                                series.push({
                                    name: room,
                                    data: Array(response.data.data.chart_data.length).fill(0)
                                });
                            });

                            // For ALL view, match the series order: ZALLI first, then others alphabetically
                            const otherRooms = allRooms.filter(room => room !== 'ZALLI').sort();
                            const seriesOrder = ['ZALLI', ...otherRooms];
                            colors = seriesOrder.map(room => colorMap[room]);

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
                            // Show single series for specific cutting room
                            series = [
                                {
                                    name: cuttingRoom,
                                    data: response.data.data.chart_data
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
                    } else {
                        // No chart data available, clear the chart
                        console.log('No chart data available, clearing chart');
                        setChartDataState(prev => ({
                            ...prev,
                            series: []
                        }));
                    }
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
    }, [value, cuttingRoom, cuttingRooms]);

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
    onPeriodChange: PropTypes.func
};

export default TotalPiecesSpreadedChart;
