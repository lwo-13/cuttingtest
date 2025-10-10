import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// material-ui
import { makeStyles } from '@mui/styles';
import { CardContent, Divider, Grid, Menu, MenuItem, Typography, Tabs, Tab } from '@mui/material';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import SkeletonPopularCard from './../../../ui-component/cards/Skeleton/PopularCard';
import { gridSpacing } from './../../../store/constant';

// assets
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

// style constant
const useStyles = makeStyles((theme) => ({
    cardAction: {
        padding: '10px',
        paddingTop: 0,
        justifyContent: 'center'
    },
    primaryLight: {
        color: theme.palette.primary[200],
        cursor: 'pointer'
    },
    divider: {
        marginTop: '12px',
        marginBottom: '12px'
    },
    firstPlace: {
        backgroundColor: '#FFF9E6',
        borderLeft: '4px solid #FFD700',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '12px'
    },
    secondPlace: {
        backgroundColor: '#F5F5F5',
        borderLeft: '4px solid #C0C0C0',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '12px'
    },
    firstPlaceIcon: {
        color: '#FFD700',
        fontSize: '1.5rem',
        marginRight: '8px'
    },
    secondPlaceIcon: {
        color: '#C0C0C0',
        fontSize: '1.5rem',
        marginRight: '8px'
    }
}));

//-----------------------|| DASHBOARD DEFAULT - TOP ORDERS CARD ||-----------------------//

const TopOrdersCard = ({ isLoading, selectedPeriod, selectedCuttingRoom }) => {
    const classes = useStyles();
    const [topOrdersData, setTopOrdersData] = useState([]);
    const [stylesData, setStylesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // State for fabrics data
    const [fabricsData, setFabricData] = useState([]);

    // Fetch top orders data from API
    useEffect(() => {
        const fetchTopOrdersData = async () => {
            try {
                setLoading(true);
                const cuttingRoomParam = selectedCuttingRoom || 'ALL';
                const response = await axios.get(`/api/dashboard/top-orders-test?period=${selectedPeriod}&limit=6&cutting_room=${cuttingRoomParam}`);

                if (response.data.success) {
                    const ordersData = response.data.data;
                    setTopOrdersData(ordersData);

                    // Process styles data by grouping orders by style
                    const styleGroups = {};
                    ordersData.forEach(order => {
                        const styleName = order.style || 'N/A';
                        if (!styleGroups[styleName]) {
                            styleGroups[styleName] = {
                                name: styleName,
                                total_meters: 0,
                                order_count: 0
                            };
                        }
                        styleGroups[styleName].total_meters += order.total_meters || 0;
                        styleGroups[styleName].order_count += 1;
                    });

                    // Convert to array and sort by total meters
                    const stylesArray = Object.values(styleGroups)
                        .sort((a, b) => b.total_meters - a.total_meters)
                        .slice(0, 6); // Limit to top 6 styles

                    setStylesData(stylesArray);
                } else {
                    console.error('❌ Failed to fetch top orders data:', response.data.message);
                    // Fallback to empty array
                    setTopOrdersData([]);
                    setStylesData([]);
                }
                setLoading(false);
            } catch (error) {
                console.error('❌ Error fetching top orders data:', error);
                console.error('❌ Error details:', error.response?.data || error.message);
                // Fallback to empty array on error
                setTopOrdersData([]);
                setStylesData([]);
                setLoading(false);
            }
        };

        fetchTopOrdersData();
    }, [selectedPeriod, selectedCuttingRoom]);

    // Fetch top fabrics data from API
    useEffect(() => {
        const fetchTopFabricsData = async () => {
            try {
                const cuttingRoomParam = selectedCuttingRoom || 'ALL';
                const response = await axios.get(`/api/dashboard/top-fabrics?period=${selectedPeriod}&limit=6&cuttingRoom=${cuttingRoomParam}`);

                if (response.data.success) {
                    const fabricsArray = response.data.data;
                    setFabricData(fabricsArray);
                } else {
                    setFabricData([]);
                }
            } catch (error) {
                console.error('❌ Error fetching top fabrics data:', error);
                console.error('❌ Error details:', error.response?.data || error.message);
                setFabricData([]);
            }
        };

        fetchTopFabricsData();
    }, [selectedPeriod, selectedCuttingRoom]);

    // Calculate total meters across all orders
    const totalMeters = topOrdersData.reduce((sum, order) => sum + (order.total_meters || 0), 0);

    // Helper function to format meters as integer
    const formatMeters = (meters) => {
        return `${Math.round(meters)}m`;
    };

    // Helper function to calculate and format percentage (for orders tab)
    const calculatePercentage = (meters) => {
        if (totalMeters === 0) return '0%';
        const percentage = Math.round((meters / totalMeters) * 100);
        return `${percentage}%`;
    };

    // Helper function to get place styling
    const getPlaceClass = (index) => {
        if (index === 0) return classes.firstPlace;
        if (index === 1) return classes.secondPlace;
        return '';
    };

    // Helper function to get place icon class
    const getPlaceIconClass = (index) => {
        if (index === 0) return classes.firstPlaceIcon;
        if (index === 1) return classes.secondPlaceIcon;
        return '';
    };

    // Helper function to get the appropriate icon component
    const getPlaceIcon = (index) => {
        const iconClass = getPlaceIconClass(index);
        if (index === 0) {
            // 1st place - Gold trophy
            return <EmojiEventsIcon className={iconClass} />;
        } else if (index === 1) {
            // 2nd place - Silver medal
            return <WorkspacePremiumIcon className={iconClass} />;
        }
        return null;
    };

    return (
        <React.Fragment>
            {isLoading || loading ? (
                <SkeletonPopularCard />
            ) : (
                <MainCard content={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Grid container spacing={gridSpacing}>
                            <Grid item xs={12}>
                                <Grid container alignContent="center" justifyContent="space-between">
                                    <Grid item>
                                        <Typography variant="h4">
                                            {activeTab === 0 ? 'Top Orders' : activeTab === 1 ? 'Top Styles' : 'Top Fabrics'}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <MoreHorizOutlinedIcon
                                            fontSize="small"
                                            className={classes.primaryLight}
                                            aria-controls="menu-top-orders-card"
                                            aria-haspopup="true"
                                            onClick={handleClick}
                                        />
                                        <Menu
                                            id="menu-top-orders-card"
                                            anchorEl={anchorEl}
                                            keepMounted
                                            open={Boolean(anchorEl)}
                                            onClose={handleClose}
                                            variant="selectedMenu"
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right'
                                            }}
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'right'
                                            }}
                                        >
                                            <MenuItem onClick={handleClose}> Today</MenuItem>
                                            <MenuItem onClick={handleClose}> This Month</MenuItem>
                                            <MenuItem onClick={handleClose}> This Year </MenuItem>
                                        </Menu>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid item xs={12}>
                                <Tabs
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    variant="fullWidth"
                                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                                >
                                    <Tab label="Orders" />
                                    <Tab label="Styles" />
                                    <Tab label="Fabrics" />
                                </Tabs>
                            </Grid>
                            <Grid item xs={12}>
                                {activeTab === 0 && (
                                    topOrdersData.length > 0 ? (
                                        topOrdersData.slice(0, 6).map((order, index) => (
                                    <React.Fragment key={order.order_commessa}>
                                        <Grid container direction="column" className={getPlaceClass(index)}>
                                            <Grid item>
                                                <Grid container alignItems="center" justifyContent="space-between">
                                                    <Grid item>
                                                        <Grid container alignItems="center">
                                                            {index < 2 && (
                                                                <Grid item>
                                                                    {getPlaceIcon(index)}
                                                                </Grid>
                                                            )}
                                                            <Grid item>
                                                                <Typography variant="subtitle1" color="inherit">
                                                                    {order.order_commessa}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {order.style} - {order.color_code}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid item>
                                                        <Grid container alignItems="center" spacing={1}>
                                                            <Grid item>
                                                                <Typography variant="subtitle1" color="inherit">
                                                                    {formatMeters(order.total_meters)}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    ({calculatePercentage(order.total_meters)})
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                            {index < Math.min(topOrdersData.length, 6) - 1 && <Divider className={classes.divider} />}
                                        </React.Fragment>
                                        ))
                                    ) : (
                                        <Grid container direction="column" alignItems="center" sx={{ py: 2 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                No completed orders found
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Try selecting a different time period
                                            </Typography>
                                        </Grid>
                                    )
                                )}

                                {activeTab === 1 && (
                                    stylesData.length > 0 ? (
                                        stylesData.slice(0, 6).map((style, index) => (
                                            <React.Fragment key={style.name}>
                                                <Grid container direction="column" className={getPlaceClass(index)}>
                                                    <Grid item>
                                                        <Grid container alignItems="center" justifyContent="space-between">
                                                            <Grid item>
                                                                <Grid container alignItems="center">
                                                                    {index < 2 && (
                                                                        <Grid item>
                                                                            {getPlaceIcon(index)}
                                                                        </Grid>
                                                                    )}
                                                                    <Grid item>
                                                                        <Typography variant="subtitle1" color="inherit">
                                                                            {style.name}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {style.order_count} {style.order_count === 1 ? 'order' : 'orders'}
                                                                        </Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                            <Grid item>
                                                                <Grid container alignItems="center" spacing={1}>
                                                                    <Grid item>
                                                                        <Typography variant="subtitle1" color="inherit">
                                                                            {formatMeters(style.total_meters)}
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid item>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            ({calculatePercentage(style.total_meters)})
                                                                        </Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                                {index < Math.min(stylesData.length, 6) - 1 && <Divider className={classes.divider} />}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <Grid container direction="column" alignItems="center" sx={{ py: 2 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                No styles found
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Try selecting a different time period
                                            </Typography>
                                        </Grid>
                                    )
                                )}

                                {activeTab === 2 && (
                                    fabricsData.length > 0 ? (
                                        fabricsData.slice(0, 6).map((fabric, index) => (
                                            <React.Fragment key={fabric.fabric_code}>
                                                <Grid container direction="column" className={getPlaceClass(index)}>
                                                    <Grid item>
                                                        <Grid container alignItems="center" justifyContent="space-between">
                                                            <Grid item>
                                                                <Grid container alignItems="center">
                                                                    {index < 2 && (
                                                                        <Grid item>
                                                                            {getPlaceIcon(index)}
                                                                        </Grid>
                                                                    )}
                                                                    <Grid item>
                                                                        <Typography variant="subtitle1" color="inherit">
                                                                            {fabric.fabric_code}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {fabric.styles}
                                                                        </Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                            <Grid item>
                                                                <Grid container alignItems="center" spacing={1}>
                                                                    <Grid item>
                                                                        <Typography variant="subtitle1" color="inherit">
                                                                            {formatMeters(fabric.total_meters)}
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid item>
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            ({calculatePercentage(fabric.total_meters)})
                                                                        </Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                                {index < Math.min(fabricsData.length, 6) - 1 && <Divider className={classes.divider} />}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <Grid container direction="column" alignItems="center" sx={{ py: 2 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                No fabric data available for this period
                                            </Typography>
                                        </Grid>
                                    )
                                )}

                            </Grid>
                        </Grid>
                    </CardContent>
                </MainCard>
            )}
        </React.Fragment>
    );
};

TopOrdersCard.propTypes = {
    isLoading: PropTypes.bool,
    selectedPeriod: PropTypes.string,
    selectedCuttingRoom: PropTypes.string
};

export default TopOrdersCard;
