import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, Button, CardActions, CardContent, Divider, Grid, Menu, MenuItem, Typography, Tabs, Tab, Box } from '@mui/material';

// project imports
import BajajAreaChartCard from './BajajAreaChartCard';
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

//-----------------------|| DASHBOARD DEFAULT - CRYPTO CARD ||-----------------------//

const CryptoCard = ({ isLoading }) => {
    const classes = useStyles();
    const [cryptoData, setCryptoData] = useState([]);
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

    // Fetch real crypto data from CoinGecko API
    useEffect(() => {
        const fetchCryptoData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,polygon&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h'
                );

                setCryptoData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching crypto data:', error);
                // Fallback to dummy data on error
                setCryptoData([
                    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 43250, price_change_percentage_24h: 2.5 },
                    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 2680, price_change_percentage_24h: -1.2 },
                    { id: 'solana', name: 'Solana', symbol: 'SOL', current_price: 98.50, price_change_percentage_24h: 5.8 },
                    { id: 'cardano', name: 'Cardano', symbol: 'ADA', current_price: 0.45, price_change_percentage_24h: -3.1 },
                    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', current_price: 0.89, price_change_percentage_24h: 4.2 }
                ]);
                setLoading(false);
            }
        };

        fetchCryptoData();

        // Refresh data every 5 minutes
        const interval = setInterval(fetchCryptoData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // Helper function to format price
    const formatPrice = (price) => {
        if (price < 1) {
            return `$${price.toFixed(4)}`;
        } else if (price < 100) {
            return `$${price.toFixed(2)}`;
        } else {
            return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
    };

    // Helper function to format percentage
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
                                            {activeTab === 0 ? 'Top Crypto' : activeTab === 1 ? 'Top Styles' : 'Top Fabrics'}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <MoreHorizOutlinedIcon
                                            fontSize="small"
                                            className={classes.primaryLight}
                                            aria-controls="menu-crypto-card"
                                            aria-haspopup="true"
                                            onClick={handleClick}
                                        />
                                        <Menu
                                            id="menu-crypto-card"
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
                                    <Tab label="Crypto" />
                                    <Tab label="Styles" />
                                    <Tab label="Fabrics" />
                                </Tabs>
                            </Grid>
                            {activeTab === 0 && (
                                <Grid item xs={12} sx={{ pt: '16px !important' }}>
                                    <BajajAreaChartCard />
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                {activeTab === 0 && cryptoData.map((crypto, index) => (
                                    <React.Fragment key={crypto.id}>
                                        <Grid container direction="column">
                                            <Grid item>
                                                <Grid container alignItems="center" justifyContent="space-between">
                                                    <Grid item>
                                                        <Typography variant="subtitle1" color="inherit">
                                                            {crypto.name} ({crypto.symbol.toUpperCase()})
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Grid container alignItems="center" justifyContent="space-between">
                                                            <Grid item>
                                                                <Typography variant="subtitle1" color="inherit">
                                                                    {formatPrice(crypto.current_price)}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Avatar
                                                                    variant="rounded"
                                                                    className={crypto.price_change_percentage_24h >= 0 ? classes.avatarSuccess : classes.avatarError}
                                                                >
                                                                    {crypto.price_change_percentage_24h >= 0 ? (
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
                                                    className={crypto.price_change_percentage_24h >= 0 ? classes.successDark : classes.errorDark}
                                                >
                                                    {formatPercentage(crypto.price_change_percentage_24h)}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        {index < cryptoData.length - 1 && <Divider className={classes.divider} />}
                                    </React.Fragment>
                                ))}

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

CryptoCard.propTypes = {
    isLoading: PropTypes.bool
};

export default CryptoCard;
