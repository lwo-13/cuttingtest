import React, { useState } from 'react';
import {
    Grid,
    Typography,
    Button,
    Box,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Paper,
    Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconPlayerPlay, IconChartPie, IconTrendingUp, IconTrendingDown, IconAlertTriangle } from '@tabler/icons';
import { gridSpacing } from '../../store/constant';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axiosInstance';
import Chart from 'react-apexcharts';

const AIAnalysis = () => {
    const theme = useTheme();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [currentStep, setCurrentStep] = useState(0); // 0 = setup, 1 = italian ratio results

    // Generate year options (current year and 2 years back)
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

    const monthOptions = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const handleRunAnalysis = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/dashboard/italian-ratio-analysis', {
                params: {
                    year: selectedYear,
                    month: selectedMonth
                }
            });

            if (response.data.success) {
                setAnalysisData(response.data.data);
                setCurrentStep(1); // Move to results step
            }
        } catch (error) {
            console.error('Error running analysis:', error);
            alert('Failed to run analysis. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setCurrentStep(0);
        setAnalysisData(null);
    };

    return (
        <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
                <MainCard>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h3" gutterBottom>
                            AI Analysis - Italian Ratio Distribution
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Analyze the distribution of Italian ratios across completed orders to identify patterns and trends.
                        </Typography>
                    </Box>

                    {currentStep === 0 && (
                        <Box>
                            <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
                                Step 1: Select Analysis Period
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Year</InputLabel>
                                        <Select
                                            value={selectedYear}
                                            label="Year"
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                        >
                                            {yearOptions.map((year) => (
                                                <MenuItem key={year} value={year}>
                                                    {year}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Month</InputLabel>
                                        <Select
                                            value={selectedMonth}
                                            label="Month"
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                        >
                                            {monthOptions.map((month) => (
                                                <MenuItem key={month.value} value={month.value}>
                                                    {month.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={12} md={6}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <IconPlayerPlay />}
                                        onClick={handleRunAnalysis}
                                        disabled={loading}
                                        sx={{ height: '56px' }}
                                    >
                                        {loading ? 'Running Analysis...' : 'Run Analysis'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {currentStep === 1 && analysisData && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h4" gutterBottom>
                                    Italian Ratio Distribution Analysis
                                </Typography>
                                <Button variant="outlined" onClick={handleReset}>
                                    New Analysis
                                </Button>
                            </Box>

                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Analysis Period: {monthOptions.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            {/* Summary Cards */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={4}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            backgroundColor: theme.palette.background.default
                                        }}
                                    >
                                        <Typography variant="h3" color="primary">
                                            {analysisData.total_orders}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Total Orders Completed
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            backgroundColor: theme.palette.background.default
                                        }}
                                    >
                                        <Typography variant="h3" color="secondary">
                                            {analysisData.orders_with_ratios}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Orders with Italian Ratios
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            backgroundColor: theme.palette.warning.lighter,
                                            border: `2px solid ${theme.palette.warning.main}`
                                        }}
                                    >
                                        <Typography variant="h3" color="warning.dark">
                                            {analysisData.orders_without_ratios}
                                        </Typography>
                                        <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 'bold' }}>
                                            ⚠️ Orders without Ratios
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Distribution Breakdown */}
                            <MainCard>
                                <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                                    <IconChartPie style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                    Distribution Breakdown
                                </Typography>

                                <Grid container spacing={3}>
                                    {/* Left Side: Pie Chart and Legend */}
                                    <Grid item xs={12} md={6}>
                                        <Grid container spacing={3}>
                                            {/* Pie Chart */}
                                            <Grid item xs={12} md={6}>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                <Chart
                                                    options={{
                                                        chart: {
                                                            type: 'donut',
                                                            fontFamily: `'Roboto', sans-serif`
                                                        },
                                                        labels: ['Disadvantage', 'Balanced', 'Advantage'],
                                                        colors: ['#f44336', '#4caf50', '#2196f3'],
                                                        legend: {
                                                            show: false
                                                        },
                                                        dataLabels: {
                                                            enabled: true,
                                                            formatter: function (val) {
                                                                return `${Math.round(val)}%`;
                                                            },
                                                            style: {
                                                                fontSize: '16px',
                                                                fontWeight: '600',
                                                                colors: ['#fff']
                                                            },
                                                            dropShadow: {
                                                                enabled: true,
                                                                top: 1,
                                                                left: 1,
                                                                blur: 1,
                                                                opacity: 0.45
                                                            }
                                                        },
                                                        plotOptions: {
                                                            pie: {
                                                                donut: {
                                                                    size: '70%',
                                                                    labels: {
                                                                        show: true,
                                                                        name: {
                                                                            show: true,
                                                                            fontSize: '18px',
                                                                            fontWeight: 600,
                                                                            color: theme.palette.text.primary
                                                                        },
                                                                        value: {
                                                                            show: true,
                                                                            fontSize: '28px',
                                                                            fontWeight: 'bold',
                                                                            color: theme.palette.text.primary,
                                                                            formatter: function (val) {
                                                                                return val;
                                                                            }
                                                                        },
                                                                        total: {
                                                                            show: true,
                                                                            label: 'Total Orders',
                                                                            fontSize: '14px',
                                                                            color: theme.palette.text.secondary,
                                                                            formatter: function (w) {
                                                                                return analysisData.orders_with_ratios;
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        stroke: {
                                                            show: true,
                                                            width: 2,
                                                            colors: ['#fff']
                                                        },
                                                        tooltip: {
                                                            enabled: true,
                                                            y: {
                                                                formatter: function (val) {
                                                                    return `${val} orders`;
                                                                }
                                                            }
                                                        },
                                                        responsive: [{
                                                            breakpoint: 480,
                                                            options: {
                                                                chart: {
                                                                    width: 300
                                                                }
                                                            }
                                                        }]
                                                    }}
                                                    series={[
                                                        analysisData.disadvantage_count,
                                                        analysisData.balanced_count,
                                                        analysisData.advantage_count
                                                    ]}
                                                    type="donut"
                                                    height={350}
                                                />
                                            </Box>
                                        </Grid>

                                        {/* Legend and Details */}
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 3 }}>
                                                {/* Disadvantage */}
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Box
                                                            sx={{
                                                                width: 16,
                                                                height: 16,
                                                                borderRadius: '4px',
                                                                backgroundColor: '#f44336',
                                                                mr: 1.5
                                                            }}
                                                        />
                                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                            Disadvantage
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ ml: 3.5 }}>
                                                        <Typography variant="h3" color="error.main" sx={{ mb: 0.5 }}>
                                                            {analysisData.disadvantage_percentage}%
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {analysisData.disadvantage_count} orders - Production shifted to larger sizes
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Balanced */}
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Box
                                                            sx={{
                                                                width: 16,
                                                                height: 16,
                                                                borderRadius: '4px',
                                                                backgroundColor: '#4caf50',
                                                                mr: 1.5
                                                            }}
                                                        />
                                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                            Balanced
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ ml: 3.5 }}>
                                                        <Typography variant="h3" color="success.main" sx={{ mb: 0.5 }}>
                                                            {analysisData.balanced_percentage}%
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {analysisData.balanced_count} orders - Production matched Italian ratios
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Advantage */}
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Box
                                                            sx={{
                                                                width: 16,
                                                                height: 16,
                                                                borderRadius: '4px',
                                                                backgroundColor: '#2196f3',
                                                                mr: 1.5
                                                            }}
                                                        />
                                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                            Advantage
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ ml: 3.5 }}>
                                                        <Typography variant="h3" color="primary.main" sx={{ mb: 0.5 }}>
                                                            {analysisData.advantage_percentage}%
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {analysisData.advantage_count} orders - Production shifted to smaller sizes
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    </Grid>

                                    {/* Right Side: Trend Analysis */}
                                    <Grid item xs={12} md={6}>
                                        <Grid container spacing={2}>
                                            {/* Deviation Coefficient KPI */}
                                            <Grid item xs={12}>
                                                <Paper
                                                    sx={{
                                                        p: 2.5,
                                                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                                                        color: '#fff'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <IconAlertTriangle size={24} style={{ marginRight: 8 }} />
                                                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                                                            Deviation Coefficient
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="h2" sx={{ color: '#fff', mb: 1 }}>
                                                        {analysisData.deviation_coefficient}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                                        Imbalance between advantage and disadvantage (0 = balanced, 1 = one-sided)
                                                    </Typography>
                                                    <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.3)' }} />
                                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                                        Average Deviation: <strong>{analysisData.avg_deviation}</strong>
                                                    </Typography>
                                                </Paper>
                                            </Grid>

                                            {/* Top Disadvantage Styles */}
                                            <Grid item xs={12}>
                                                <Paper sx={{ p: 2.5, border: `2px solid ${theme.palette.error.light}` }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <IconTrendingDown size={20} style={{ marginRight: 8, color: theme.palette.error.main }} />
                                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                            Top Disadvantage Styles
                                                        </Typography>
                                                    </Box>
                                                    {analysisData.disadvantage_styles && analysisData.disadvantage_styles.length > 0 ? (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                            {analysisData.disadvantage_styles.map((item, index) => (
                                                                <Box
                                                                    key={index}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        p: 1.5,
                                                                        backgroundColor: theme.palette.error.lighter,
                                                                        borderRadius: 1,
                                                                        borderLeft: `4px solid ${theme.palette.error.main}`
                                                                    }}
                                                                >
                                                                    <Box>
                                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                            {item.style}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {item.total} orders total
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ textAlign: 'right' }}>
                                                                        <Typography variant="h4" color="error.main">
                                                                            {item.disadvantage}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            disadvantage
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="textSecondary">
                                                            No disadvantage orders found
                                                        </Typography>
                                                    )}
                                                </Paper>
                                            </Grid>

                                            {/* Top Advantage Styles */}
                                            <Grid item xs={12}>
                                                <Paper sx={{ p: 2.5, border: `2px solid ${theme.palette.primary.light}` }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <IconTrendingUp size={20} style={{ marginRight: 8, color: theme.palette.primary.main }} />
                                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                            Top Advantage Styles
                                                        </Typography>
                                                    </Box>
                                                    {analysisData.advantage_styles && analysisData.advantage_styles.length > 0 ? (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                            {analysisData.advantage_styles.map((item, index) => (
                                                                <Box
                                                                    key={index}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        p: 1.5,
                                                                        backgroundColor: theme.palette.primary.lighter,
                                                                        borderRadius: 1,
                                                                        borderLeft: `4px solid ${theme.palette.primary.main}`
                                                                    }}
                                                                >
                                                                    <Box>
                                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                            {item.style}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {item.total} orders total
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ textAlign: 'right' }}>
                                                                        <Typography variant="h4" color="primary.main">
                                                                            {item.advantage}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            advantage
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="textSecondary">
                                                            No advantage orders found
                                                        </Typography>
                                                    )}
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </MainCard>
                        </Box>
                    )}
                </MainCard>
            </Grid>
        </Grid>
    );
};

export default AIAnalysis;
