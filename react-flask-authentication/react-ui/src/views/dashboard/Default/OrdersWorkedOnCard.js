import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, Grid, Typography } from '@mui/material';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import SkeletonEarningCard from './../../../ui-component/cards/Skeleton/EarningCard';

// assets
import { IconListCheck } from '@tabler/icons';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

// style constant
const useStyles = makeStyles((theme) => ({
    card: {
        backgroundColor: theme.palette.primary.dark,
        color: '#fff',
        overflow: 'hidden',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            width: '210px',
            height: '210px',
            background: theme.palette.primary[800],
            borderRadius: '50%',
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
            width: '210px',
            height: '210px',
            background: theme.palette.primary[800],
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
        backgroundColor: theme.palette.primary[800],
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
        color: theme.palette.primary[200]
    },
    avatarCircle: {
        cursor: 'pointer',
        ...theme.typography.smallAvatar,
        backgroundColor: theme.palette.primary[200],
        color: theme.palette.primary.dark
    },
    circleIcon: {
        transform: 'rotate3d(1, 1, 1, 45deg)'
    }
}));

//===========================|| DASHBOARD - ORDERS WORKED ON CARD ||===========================//

const OrdersWorkedOnCard = ({ isLoading, selectedPeriod }) => {
    const classes = useStyles();
    const [ordersCount, setOrdersCount] = useState(0);

    useEffect(() => {
        const fetchOrdersCount = async () => {
            try {
                const response = await axios.get(`/dashboard/statistics?period=${selectedPeriod}`);
                if (response.data.success) {
                    setOrdersCount(response.data.data.orders_worked_on || 0);
                }
            } catch (error) {
                console.error('Error fetching orders count:', error);
            }
        };

        fetchOrdersCount();
    }, [selectedPeriod]);

    return (
        <React.Fragment>
            {isLoading ? (
                <SkeletonEarningCard />
            ) : (
                <MainCard border={false} className={classes.card} contentClass={classes.content}>
                    <Grid container direction="column">
                        <Grid item>
                            <Grid container justifyContent="space-between">
                                <Grid item>
                                    <Avatar variant="rounded" className={classes.avatar}>
                                        <IconListCheck fontSize="inherit" />
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Grid container alignItems="center">
                                <Grid item>
                                    <Typography className={classes.cardHeading}>
                                        {ordersCount}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <Avatar className={classes.avatarCircle}>
                                        <ArrowUpwardIcon fontSize="inherit" className={classes.circleIcon} />
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item sx={{ mb: 1.25 }}>
                            <Typography className={classes.subHeading}>Orders Worked On</Typography>
                        </Grid>
                    </Grid>
                </MainCard>
            )}
        </React.Fragment>
    );
};

OrdersWorkedOnCard.propTypes = {
    isLoading: PropTypes.bool,
    selectedPeriod: PropTypes.string
};

export default OrdersWorkedOnCard;
