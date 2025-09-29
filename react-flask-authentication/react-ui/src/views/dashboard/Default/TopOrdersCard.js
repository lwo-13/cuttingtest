import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, Button, CardActions, CardContent, Divider, Grid, Menu, MenuItem, Typography, Tabs, Tab, Box } from '@mui/material';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import SkeletonPopularCard from './../../../ui-component/cards/Skeleton/PopularCard';
import { gridSpacing } from './../../../store/constant';

// assets
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';

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
    avatarSuccess: {
        width: '16px',
        height: '16px',
        borderRadius: '5px',
        backgroundColor: theme.palette.success.light,
        color: theme.palette.success.dark,
        marginLeft: '15px'
    },
    successDark: {
        color: theme.palette.success.dark
    },
    avatarError: {
        width: '16px',
        height: '16px',
        borderRadius: '5px',
        backgroundColor: theme.palette.orange.light,
        color: theme.palette.orange.dark,
        marginLeft: '15px'
    },
    errorDark: {
        color: theme.palette.orange.dark
    }
}));

//-----------------------|| DASHBOARD DEFAULT - TOP ORDERS CARD ||-----------------------//

const TopOrdersCard = ({ isLoading, selectedPeriod }) => {
    const classes = useStyles();
    const [topOrdersData, setTopOrdersData] = useState([]);
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

    // Dummy data for styles
    const stylesData = [
        { name: 'CLASSIC-FIT', orders: 45, change: 12.5 },
        { name: 'SLIM-MODERN', orders: 38, change: -2.1 },
        { name: 'COMFORT-PLUS', orders: 32, change: 8.3 },
        { name: 'ATHLETIC-CUT', orders: 28, change: 15.7 },
        { name: 'VINTAGE-STYLE', orders: 22, change: -5.2 }
    ];

    // Dummy data for fabrics
    const fabricsData = [
        { name: 'Cotton Blend', meters: 1250, change: 18.2 },
        { name: 'Polyester Mix', meters: 980, change: -3.4 },
        { name: 'Denim Classic', meters: 875, change: 22.1 },
        { name: 'Wool Premium', meters: 650, change: 7.8 },
        { name: 'Silk Touch', meters: 420, change: -8.9 }
    ];

    // Fetch top orders data from API
    useEffect(() => {
        const fetchTopOrdersData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/dashboard/top-orders-test?period=${selectedPeriod}&limit=5`);

                if (response.data.success) {
                    console.log('✅ Top Orders API Response:', response.data);
                    console.log('📊 Orders data:', response.data.data);
                    setTopOrdersData(response.data.data);
                } else {
                    console.error('❌ Failed to fetch top orders data:', response.data.message);
                    // Fallback to empty array
                    setTopOrdersData([]);
                }
                setLoading(false);
            } catch (error) {
                console.error('❌ Error fetching top orders data:', error);
                console.error('❌ Error details:', error.response?.data || error.message);
                // Fallback to empty array on error
                setTopOrdersData([]);
                setLoading(false);
            }
        };

        fetchTopOrdersData();
    }, [selectedPeriod]);

    // Helper function to format meters
    const formatMeters = (meters) => {
        if (meters < 1000) {
            return `${meters}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    };

    // Helper function to format percentage (placeholder for future use)
    const formatPercentage = (percentage) => {
        const sign = percentage >= 0 ? '+' : '';
        return `${sign}${percentage.toFixed(1)}%`;
    };

    return (
        <React.Fragment>
            {isLoading || loading ? (
                <SkeletonPopularCard />
            ) : (
                <MainCard content={false}>
                    <CardContent>
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
                                        topOrdersData.map((order, index) => (
                                    <React.Fragment key={order.order_commessa}>
                                        <Grid container direction="column">
                                            <Grid item>
                                                <Grid container alignItems="center" justifyContent="space-between">
                                                    <Grid item>
                                                        <Typography variant="subtitle1" color="inherit">
                                                            {order.order_commessa}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {order.style} - {order.color_code}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Grid container alignItems="center" justifyContent="space-between">
                                                            <Grid item>
                                                                <Typography variant="subtitle1" color="inherit">
                                                                    {formatMeters(order.total_meters)}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                            {index < topOrdersData.length - 1 && <Divider className={classes.divider} />}
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

                                {activeTab === 1 && stylesData.map((style, index) => (
                                    <React.Fragment key={style.name}>
                                        <Grid container direction="column">
                                            <Grid item>
                                                <Grid container alignItems="center" justifyContent="space-between">
                                                    <Grid item>
                                                        <Typography variant="subtitle1" color="inherit">
                                                            {style.name}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Grid container alignItems="center" justifyContent="space-between">
                                                            <Grid item>
                                                                <Typography variant="subtitle1" color="inherit">
                                                                    {style.orders} orders
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Avatar
                                                                    variant="rounded"
                                                                    className={style.change >= 0 ? classes.avatarSuccess : classes.avatarError}
                                                                >
                                                                    {style.change >= 0 ? (
                                                                        <KeyboardArrowUpOutlinedIcon fontSize="small" color="inherit" />
                                                                    ) : (
                                                                        <KeyboardArrowDownOutlinedIcon fontSize="small" color="inherit" />
                                                                    )}
                                                                </Avatar>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid item>
                                                <Typography
                                                    variant="subtitle2"
                                                    className={style.change >= 0 ? classes.successDark : classes.errorDark}
                                                >
                                                    {formatPercentage(style.change)}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        {index < stylesData.length - 1 && <Divider className={classes.divider} />}
                                    </React.Fragment>
                                ))}

                                {activeTab === 2 && fabricsData.map((fabric, index) => (
                                    <React.Fragment key={fabric.name}>
                                        <Grid container direction="column">
                                            <Grid item>
                                                <Grid container alignItems="center" justifyContent="space-between">
                                                    <Grid item>
                                                        <Typography variant="subtitle1" color="inherit">
                                                            {fabric.name}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Grid container alignItems="center" justifyContent="space-between">
                                                            <Grid item>
                                                                <Typography variant="subtitle1" color="inherit">
                                                                    {fabric.meters}m
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Avatar
                                                                    variant="rounded"
                                                                    className={fabric.change >= 0 ? classes.avatarSuccess : classes.avatarError}
                                                                >
                                                                    {fabric.change >= 0 ? (
                                                                        <KeyboardArrowUpOutlinedIcon fontSize="small" color="inherit" />
                                                                    ) : (
                                                                        <KeyboardArrowDownOutlinedIcon fontSize="small" color="inherit" />
                                                                    )}
                                                                </Avatar>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid item>
                                                <Typography
                                                    variant="subtitle2"
                                                    className={fabric.change >= 0 ? classes.successDark : classes.errorDark}
                                                >
                                                    {formatPercentage(fabric.change)}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        {index < fabricsData.length - 1 && <Divider className={classes.divider} />}
                                    </React.Fragment>
                                ))}

                            </Grid>
                        </Grid>
                    </CardContent>
                    <CardActions className={classes.cardAction}>
                        <Button size="small" disableElevation>
                            View All
                            <ChevronRightOutlinedIcon />
                        </Button>
                    </CardActions>
                </MainCard>
            )}
        </React.Fragment>
    );
};

TopOrdersCard.propTypes = {
    isLoading: PropTypes.bool,
    selectedPeriod: PropTypes.string
};

export default TopOrdersCard;
