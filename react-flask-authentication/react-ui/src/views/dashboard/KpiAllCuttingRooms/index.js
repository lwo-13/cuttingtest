import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// material-ui
import { Box, Grid, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

// project imports
import EarningCard from '../Default/EarningCard';
import PopularCard from '../Default/PopularCard';
import TopOrdersCard from '../Default/TopOrdersCard';
import TotalOrderLineChartCard from '../Default/TotalOrderLineChartCard';
import TotalIncomeDarkCard from '../Default/TotalIncomeDarkCard';
import TotalIncomeLightCard from '../Default/TotalIncomeLightCard';
import TotalGrowthBarChart from '../Default/TotalGrowthBarChart';
import TotalMetersSpreadedChart from '../Default/TotalMetersSpreadedChart';
import TotalPiecesSpreadedChart from '../Default/TotalPiecesSpreadedChart';
import { gridSpacing } from '../../../store/constant';

// dashboard components
import DateFilter from '../Default/components/DateFilter';
import StatisticsCards from '../Default/components/StatisticsCards';

//-----------------------|| KPI ALL CUTTING ROOMS DASHBOARD ||-----------------------//

const KpiAllCuttingRooms = () => {
    const { t } = useTranslation();
    const [isLoading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [selectedCuttingRoom, setSelectedCuttingRoom] = useState('ALL');
    const [totalMetersCompleted, setTotalMetersCompleted] = useState(0);

    useEffect(() => {
        setLoading(false);
    }, []);

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
    };

    const handleCuttingRoomChange = (cuttingRoom) => {
        setSelectedCuttingRoom(cuttingRoom);
    };

    const handleTotalMetersChange = (meters) => {
        setTotalMetersCompleted(meters);
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
                <StatisticsCards selectedPeriod={selectedPeriod} totalMetersCompleted={totalMetersCompleted} />
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
                            selectedCuttingRoom={selectedCuttingRoom}
                            onCuttingRoomChange={handleCuttingRoomChange}
                            isAllCuttingRoomsPage={true}
                            onTotalMetersChange={handleTotalMetersChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TopOrdersCard isLoading={isLoading} selectedPeriod={selectedPeriod} selectedCuttingRoom={selectedCuttingRoom} />
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

export default KpiAllCuttingRooms;

