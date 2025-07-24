import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, Button, Grid, Typography } from '@mui/material';

// third-party
import Chart from 'react-apexcharts';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import SkeletonTotalOrderCard from './../../../ui-component/cards/Skeleton/EarningCard';

// assets
import { IconFileImport } from '@tabler/icons';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

// style constant
const useStyles = makeStyles((theme) => ({
    card: {
        backgroundColor: theme.palette.secondary.dark,
        color: '#fff',
        overflow: 'hidden',
        position: 'relative',
        '&>div': {
            position: 'relative',
            zIndex: 5
        },
        '&:after': {
            content: '""',
            position: 'absolute',
            width: '210px',
            height: '210px',
            background: theme.palette.secondary[800],
            borderRadius: '50%',
            zIndex: 1,
            top: '-85px',
            right: '-95px',
            [theme.breakpoints.down('xs')]: {
                top: '-105px',
                right: '-140px'
            }
        },
        '&:before': {
            content: '""',
            position: 'absolute',
            zIndex: 1,
            width: '210px',
            height: '210px',
            background: theme.palette.secondary[800],
            borderRadius: '50%',
            top: '-125px',
            right: '-15px',
            opacity: 0.5,
            [theme.breakpoints.down('xs')]: {
                top: '-155px',
                right: '-70px'
            }
        }
    },
    content: {
        padding: '20px !important'
    },
    avatar: {
        ...theme.typography.commonAvatar,
        ...theme.typography.largeAvatar,
        backgroundColor: theme.palette.secondary[800],
        color: '#fff',
        marginTop: '8px'
    },
    cardHeading: {
        fontSize: '2.125rem',
        fontWeight: 500,
        marginRight: '8px',
        marginTop: '14px',
        marginBottom: '6px'
    },
    subHeading: {
        fontSize: '1rem',
        fontWeight: 500,
        color: theme.palette.secondary[200]
    },
    avatarCircle: {
        ...theme.typography.smallAvatar,
        cursor: 'pointer',
        backgroundColor: theme.palette.secondary[200],
        color: theme.palette.secondary.dark
    },
    circleIcon: {
        transform: 'rotate3d(1, 1, 1, 45deg)'
    }
}));



//-----------------------|| DASHBOARD - MARKERS IMPORTED CARD ||-----------------------//

const MarkersImportedCard = ({ isLoading, selectedPeriod }) => {
    const classes = useStyles();
    const [markersCount, setMarkersCount] = useState(0);
    const [chartData, setChartData] = useState({
        type: 'line',
        height: 90,
        options: {
            chart: {
                sparkline: {
                    enabled: true
                }
            },
            dataLabels: {
                enabled: false
            },
            colors: ['#fff'],
            fill: {
                type: 'solid',
                opacity: 1
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            yaxis: {
                min: 0
            },
            tooltip: {
                theme: 'dark',
                fixed: {
                    enabled: false
                },
                x: {
                    show: false
                },
                y: {
                    title: {
                        formatter: (seriesName) => 'Markers Imported'
                    }
                },
                marker: {
                    show: false
                }
            }
        },
        series: [
            {
                name: 'markers',
                data: [0, 0, 0, 0, 0, 0, 0] // Default empty data for week (7 days)
            }
        ]
    });



    useEffect(() => {
        const fetchMarkersData = async () => {
            try {
                // Fetch current period count
                const statsResponse = await axios.get(`/dashboard/statistics?period=${selectedPeriod}`);

                // Fetch historical trend data
                const trendResponse = await axios.get(`/dashboard/markers-imported-trend?period=${selectedPeriod}`);

                if (statsResponse.data.success) {
                    const count = statsResponse.data.data.markers_imported || 0;
                    setMarkersCount(count);
                }

                if (trendResponse.data.success) {
                    const trendData = trendResponse.data.data.map(item => item.count);
                    setChartData(prev => ({
                        ...prev,
                        series: [
                            {
                                name: 'markers',
                                data: trendData
                            }
                        ]
                    }));
                }
            } catch (error) {
                console.error('Error fetching markers data:', error);
                // Fallback to empty data on error
                setChartData(prev => ({
                    ...prev,
                    series: [
                        {
                            name: 'markers',
                            data: selectedPeriod === 'week' ? [0,0,0,0,0,0,0] :
                                  selectedPeriod === 'month' ? [0,0,0,0] :
                                  [0,0,0,0,0,0,0,0,0,0,0,0]
                        }
                    ]
                }));
            }
        };

        fetchMarkersData();
    }, [selectedPeriod]);

    return (
        <React.Fragment>
            {isLoading ? (
                <SkeletonTotalOrderCard />
            ) : (
                <MainCard border={false} className={classes.card} contentClass={classes.content}>
                    <Grid container direction="column">
                        <Grid item>
                            <Grid container justifyContent="space-between">
                                <Grid item>
                                    <Avatar variant="rounded" className={classes.avatar}>
                                        <IconFileImport fontSize="inherit" />
                                    </Avatar>
                                </Grid>

                            </Grid>
                        </Grid>
                        <Grid item sx={{ mb: 0.75 }}>
                            <Grid container alignItems="center">
                                <Grid item xs={6}>
                                    <Grid container alignItems="center">
                                        <Grid item>
                                            <Typography className={classes.cardHeading}>
                                                {markersCount}
                                            </Typography>
                                        </Grid>
                                        <Grid item>
                                            <Avatar className={classes.avatarCircle}>
                                                <ArrowUpwardIcon fontSize="inherit" className={classes.circleIcon} />
                                            </Avatar>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography className={classes.subHeading}>Markers Imported</Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={6}>
                                    <Chart {...chartData} />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </MainCard>
            )}
        </React.Fragment>
    );
};

MarkersImportedCard.propTypes = {
    isLoading: PropTypes.bool,
    selectedPeriod: PropTypes.string
};

export default MarkersImportedCard;
