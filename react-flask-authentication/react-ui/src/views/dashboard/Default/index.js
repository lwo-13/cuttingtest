import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// material-ui
import { Box, Grid, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

// project imports
import EarningCard from './EarningCard';
import PopularCard from './PopularCard';
import TopOrdersCard from './TopOrdersCard';
import TotalOrderLineChartCard from './TotalOrderLineChartCard';
import TotalIncomeDarkCard from './TotalIncomeDarkCard';
import TotalIncomeLightCard from './TotalIncomeLightCard';
import TotalGrowthBarChart from './TotalGrowthBarChart';
import TotalMetersSpreadedChart from './TotalMetersSpreadedChart';
import TotalPiecesSpreadedChart from './TotalPiecesSpreadedChart';
import { gridSpacing } from './../../../store/constant';

// dashboard components
import DateFilter from './components/DateFilter';
import StatisticsCards from './components/StatisticsCards';

//-----------------------|| DEFAULT DASHBOARD ||-----------------------//

const Dashboard = () => {
    const { t } = useTranslation();
    const [isLoading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('today');

    useEffect(() => {
        setLoading(false);
    }, []);

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
    };

    return (
        <Grid container spacing={gridSpacing}>
            {/* Date Filter */}
            <Grid item xs={12}>
                <DateFilter
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={handlePeriodChange}
                />
            </Grid>

            {/* Statistics Cards */}
            <Grid item xs={12}>
                <StatisticsCards selectedPeriod={selectedPeriod} />
            </Grid>

            {/* Additional Dashboard Components - Commented Out */}
            {/*<Grid item xs={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid item lg={4} md={6} sm={6} xs={12}>
                        <EarningCard isLoading={isLoading} />
                    </Grid>
                    <Grid item lg={4} md={6} sm={6} xs={12}>
                        <TotalOrderLineChartCard isLoading={isLoading} />
                    </Grid>
                    <Grid item lg={4} md={12} sm={12} xs={12}>
                        <Grid container spacing={gridSpacing}>
                            <Grid item sm={6} xs={12} md={6} lg={12}>
                                <TotalIncomeDarkCard isLoading={isLoading} />
                            </Grid>
                            <Grid item sm={6} xs={12} md={6} lg={12}>
                                <TotalIncomeLightCard isLoading={isLoading} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>*/}
            {/* Total Meters Spreaded Chart */}
            <Grid item xs={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12} md={8}>
                        <TotalMetersSpreadedChart
                            isLoading={isLoading}
                            selectedPeriod={selectedPeriod}
                            onPeriodChange={handlePeriodChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TopOrdersCard isLoading={isLoading} selectedPeriod={selectedPeriod} />
                    </Grid>

                    {/* Commented out Popular Stocks Card */}
                    {/*<Grid item xs={12} md={4}>
                        <PopularCard isLoading={isLoading} />
                    </Grid>*/}
                </Grid>
            </Grid>

            {/* Total Pieces Spreaded Chart */}
            <Grid item xs={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12} md={8}>
                        <TotalPiecesSpreadedChart
                            isLoading={isLoading}
                            selectedPeriod={selectedPeriod}
                            onPeriodChange={handlePeriodChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TopOrdersCard isLoading={isLoading} selectedPeriod={selectedPeriod} />
                    </Grid>
                </Grid>
            </Grid>

            {/* Commented out Total Growth Bar Chart */}
            {/*<Grid item xs={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12} md={8}>
                        <TotalGrowthBarChart isLoading={isLoading} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <PopularCard isLoading={isLoading} />
                    </Grid>
                </Grid>
            </Grid>*/}
        </Grid>
    );
};

export default Dashboard;
