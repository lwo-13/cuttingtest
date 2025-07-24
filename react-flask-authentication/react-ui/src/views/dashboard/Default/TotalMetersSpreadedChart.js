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

//-----------------------|| DASHBOARD DEFAULT - TOTAL METERS SPREADED BAR CHART ||-----------------------//

const TotalMetersSpreadedChart = ({ isLoading, selectedPeriod }) => {
    const [value, setValue] = useState('month');
    const [cuttingRoom, setCuttingRoom] = useState('ALL');
    const [cuttingRooms, setCuttingRooms] = useState([]);
    const [totalMeters, setTotalMeters] = useState(0);
    const [chartDataState, setChartDataState] = useState(chartData);
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

    // Use dummy data for now (commented out API call)
    useEffect(() => {
        // Set dummy total based on period and cutting room
        const baseTotals = {
            'today': 45,
            'week': 320,
            'month': 1280,
            'year': 15360
        };

        let total = baseTotals[value] || 1280;

        if (cuttingRoom === 'ALL') {
            // Show stacked data for all cutting rooms
            const zalliData = [210, 750, 210, 210, 210, 480, 210, 120, 210, 270, 90, 450];
            const deliciaData = [140, 500, 140, 140, 140, 320, 140, 80, 140, 180, 60, 300];
            const mainData = [280, 1000, 280, 280, 280, 640, 280, 160, 280, 360, 120, 600];

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
                    }
                },
                series: [
                    {
                        name: 'ZALLI',
                        data: zalliData
                    },
                    {
                        name: 'DELICIA',
                        data: deliciaData
                    },
                    {
                        name: 'MAIN',
                        data: mainData
                    }
                ]
            }));

            setTotalMeters(total);
        } else {
            // Show single series for specific cutting room
            const roomMultipliers = {
                'ZALLI': 0.6,
                'DELICIA': 0.4,
                'MAIN': 0.8
            };

            const multiplier = roomMultipliers[cuttingRoom] || 0.5;
            total = Math.floor(total * multiplier);

            // Single room data (proportional to original dummy data)
            const singleRoomData = [350, 1250, 350, 350, 350, 800, 350, 200, 350, 450, 150, 750].map(val =>
                Math.floor(val * multiplier)
            );

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
                    }
                },
                series: [
                    {
                        name: cuttingRoom,
                        data: singleRoomData
                    }
                ]
            }));

            setTotalMeters(total);
        }

        // Keep the default chart data from the imported chartData
        // No need to update chart data as it's already set with dummy data

        /* TODO: Replace with real API call later
        const fetchMetersData = async () => {
            try {
                const response = await axios.get(`/dashboard/meters-spreaded?period=${value}`);
                if (response.data.success) {
                    setTotalMeters(response.data.data.total_meters || 0);

                    // Update chart data with real data
                    if (response.data.data.chart_data) {
                        setChartDataState(prev => ({
                            ...prev,
                            series: [
                                {
                                    name: 'Meters Spreaded',
                                    data: response.data.data.chart_data
                                }
                            ]
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching meters data:', error);
                // Keep default chart data on error
            }
        };

        fetchMetersData();
        */
    }, [value, cuttingRoom]);

    // Update chart colors and styling
    useEffect(() => {
        // Set colors based on cutting room selection (same as Total Growth)
        const colors = cuttingRoom === 'ALL'
            ? [primary200, primaryDark, secondaryMain, secondaryLight] // Multiple colors for stacked (same as Total Growth)
            : [primaryDark]; // Single color for individual room

        const newChartData = {
            ...chartDataState.options,
            colors: colors,
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
                    }
                }
            },
            grid: {
                ...chartDataState.options.grid,
                borderColor: grey200
            },
            tooltip: {
                ...chartDataState.options.tooltip,
                theme: 'light'
            },
            legend: {
                ...chartDataState.options.legend,
                show: true,
                labels: {
                    colors: grey500
                }
            }
        };

        // do not load chart when loading
        if (!isLoading) {
            ApexCharts.exec(`meters-bar-chart`, 'updateOptions', newChartData);
        }
    }, [primary200, primaryDark, secondaryMain, secondaryLight, primary, grey200, isLoading, grey500, chartDataState, cuttingRoom]);

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
                                            <Typography variant="subtitle2">Total Meters Spreaded</Typography>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="h3">{totalMeters.toLocaleString()} m</Typography>
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
                                                onChange={(e) => setValue(e.target.value)}
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
    isLoading: PropTypes.bool
};

export default TotalMetersSpreadedChart;
