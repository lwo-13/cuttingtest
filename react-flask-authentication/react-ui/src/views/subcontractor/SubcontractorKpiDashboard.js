import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

// material-ui
import { Box, Grid, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

// project imports
import EarningCard from '../dashboard/Default/EarningCard';
import PopularCard from '../dashboard/Default/PopularCard';
import TopOrdersCard from '../dashboard/Default/TopOrdersCard';
import TotalOrderLineChartCard from '../dashboard/Default/TotalOrderLineChartCard';
import TotalIncomeDarkCard from '../dashboard/Default/TotalIncomeDarkCard';
import TotalIncomeLightCard from '../dashboard/Default/TotalIncomeLightCard';
import TotalGrowthBarChart from '../dashboard/Default/TotalGrowthBarChart';
import TotalMetersSpreadedChart from '../dashboard/Default/TotalMetersSpreadedChart';
import TotalPiecesSpreadedChart from '../dashboard/Default/TotalPiecesSpreadedChart';
import { gridSpacing } from '../../store/constant';

// dashboard components
import DateFilter from '../dashboard/Default/components/DateFilter';
import StatisticsCards from '../dashboard/Default/components/StatisticsCards';

// Production center configuration
import { CUTTING_ROOMS, getCuttingRoomFromUsername } from 'utils/productionCenterConfig';

//-----------------------|| SUBCONTRACTOR KPI DASHBOARD ||-----------------------//

const SubcontractorKpiDashboard = () => {
    const { t } = useTranslation();
    const [isLoading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [totalMetersCompleted, setTotalMetersCompleted] = useState(0);
    const [selectedBreakdown, setSelectedBreakdown] = useState('none'); // Shared breakdown state

    // Get current user info
    const account = useSelector((state) => state.account);
    const currentUser = account?.user;
    const username = currentUser?.username; // Username might be like "DELICIA2"

    // Use the shared utility function to extract cutting room from username

    const selectedCuttingRoom = getCuttingRoomFromUsername(username);

    useEffect(() => {
        setLoading(false);
    }, []);

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
    };

    const handleTotalMetersChange = (meters) => {
        setTotalMetersCompleted(meters);
    };

    const handleBreakdownChange = (breakdown) => {
        setSelectedBreakdown(breakdown);
    };

    // If no cutting room is determined, show error message
    if (!selectedCuttingRoom) {
        return (
            <Box p={3}>
                <Typography variant="h6" color="error">
                    Unable to determine cutting room from username: {username}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Please contact an administrator to resolve this issue.
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={gridSpacing}>
            {/* Date Filter */}
            <Grid item xs={12}>
                <DateFilter
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={handlePeriodChange}
                />
            </Grid>

            {/* Total Meters Spreaded Chart */}
            <Grid item xs={12}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12} md={8}>
                        <TotalMetersSpreadedChart
                            isLoading={isLoading}
                            selectedPeriod={selectedPeriod}
                            onPeriodChange={handlePeriodChange}
                            selectedCuttingRoom={selectedCuttingRoom}
                            hideCuttingRoomSelector={true}
                            onTotalMetersChange={handleTotalMetersChange}
                            selectedBreakdown={selectedBreakdown}
                            onBreakdownChange={handleBreakdownChange}
                            isAllCuttingRoomsPage={true}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TopOrdersCard isLoading={isLoading} selectedPeriod={selectedPeriod} selectedCuttingRoom={selectedCuttingRoom} />
                    </Grid>
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
                            selectedCuttingRoom={selectedCuttingRoom}
                            hideCuttingRoomSelector={true}
                            selectedBreakdown={selectedBreakdown}
                            onBreakdownChange={handleBreakdownChange}
                            isAllCuttingRoomsPage={true}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default SubcontractorKpiDashboard;
