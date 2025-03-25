import React, { useEffect, useState } from 'react';

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

//-----------------------|| DEFAULT DASHBOARD ||-----------------------//

const Dashboard = () => {
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(false);
    }, []);

    return (
        <Grid container spacing={gridSpacing}>
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
            <Box 
                sx={{
                    width: '100%',
                    height: '100%',
                    height: '90vh',              // Adjust to '100vh' if you want full screen
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Box
                    sx={{
                        textAlign: 'center',
                        p: 10,
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        backgroundColor: '#f9f9f9'
                    }}
                >
                    <ConstructionIcon sx={{ fontSize: 80, color: 'orange' }} />
                    <Typography variant="h4" sx={{ mt: 2 }}>
                        WORK IN PROGRESS
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                        Cutting λν - ZALLI
                    </Typography>
                </Box>
            </Box>
        </Grid>
    );
};

export default Dashboard;
