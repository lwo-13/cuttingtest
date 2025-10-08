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

//-----------------------|| DASHBOARD DEFAULT - TOTAL METERS SPREADED BAR CHART ||-----------------------//

const TotalMetersSpreadedChart = ({ isLoading, selectedPeriod, onPeriodChange, selectedCuttingRoom, onCuttingRoomChange }) => {
    const [value, setValue] = useState(selectedPeriod || 'today');
    const [cuttingRoom, setCuttingRoom] = useState(selectedCuttingRoom || 'ALL');
    const [cuttingRooms, setCuttingRooms] = useState([]);
    const [totalMeters, setTotalMeters] = useState(0);
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

                if (cuttingRoom === 'ALL') {
                    // For ALL view, fetch data for each cutting room separately and stack them
                    const roomsToFetch = cuttingRooms.filter(room => room !== 'ALL');

                    // Fetch data for all cutting rooms in parallel
                    const promises = roomsToFetch.map(room =>
                        axios.get(`/dashboard/meters-spreaded?period=${value}&cutting_room=${room}&_t=${Date.now()}`)
                    );

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
                    // Show single series for specific cutting room
                    const response = await axios.get(`/dashboard/meters-spreaded?period=${value}&cutting_room=${cuttingRoom}&_t=${Date.now()}`);

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
    onCuttingRoomChange: PropTypes.func
};

export default TotalMetersSpreadedChart;
