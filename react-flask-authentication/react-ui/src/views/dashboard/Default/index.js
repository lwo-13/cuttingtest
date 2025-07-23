import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// material-ui
import { Box, Grid, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

// project imports
import EarningCard from './EarningCard';
import PopularCard from './PopularCard';
import TotalOrderLineChartCard from './TotalOrderLineChartCard';
import TotalIncomeDarkCard from './TotalIncomeDarkCard';
import TotalIncomeLightCard from './TotalIncomeLightCard';
import TotalGrowthBarChart from './TotalGrowthBarChart';
import { gridSpacing } from './../../../store/constant';

// dashboard components
import DateFilter from './components/DateFilter';
import StatisticsCards from './components/StatisticsCards';
import OrdersWorkedOn from './components/OrdersWorkedOn';
import MarkersImported from './components/MarkersImported';

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

            {/* Orders Worked On */}
            <Grid item xs={12} lg={6}>
                <OrdersWorkedOn selectedPeriod={selectedPeriod} />
            </Grid>

            {/* Markers Imported */}
            <Grid item xs={12} lg={6}>
                <MarkersImported selectedPeriod={selectedPeriod} />
            </Grid>

            {/* Future Components - Preserved for later use */}
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
            </Grid>
            <Grid item xs={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12} md={8}>
                        <TotalGrowthBarChart isLoading={isLoading} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <PopularCard isLoading={isLoading} />
                    </Grid>
                </Grid>
            </Grid> */}
        </Grid>
    );
};

export default Dashboard;
