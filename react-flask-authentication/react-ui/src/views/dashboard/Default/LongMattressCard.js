import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography, ToggleButton, ToggleButtonGroup, Box, Chip } from '@mui/material';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import TotalIncomeCard from './../../../ui-component/cards/Skeleton/TotalIncomeCard';

// assets
import { IconRuler2, IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons';

// style constant
const useStyles = makeStyles((theme) => ({
    card: {
        overflow: 'hidden',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            width: '210px',
            height: '210px',
            background: 'linear-gradient(210.04deg, ' + theme.palette.primary.dark + ' -50.94%, rgba(144, 202, 249, 0) 83.49%)',
            borderRadius: '50%',
            top: '-30px',
            right: '-180px'
        },
        '&:before': {
            content: '""',
            position: 'absolute',
            width: '210px',
            height: '210px',
            background: 'linear-gradient(140.9deg, ' + theme.palette.primary.dark + ' -14.02%, rgba(144, 202, 249, 0) 70.50%)',
            borderRadius: '50%',
            top: '-160px',
            right: '-130px'
        }
    },
    content: {
        padding: '16px !important'
    },
    avatar: {
        ...theme.typography.commonAvatar,
        ...theme.typography.largeAvatar,
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.dark
    },
    secondary: {
        color: theme.palette.grey[500],
        marginTop: '5px'
    },
    padding: {
        paddingTop: 0,
        paddingBottom: 0
    }
}));

//-----------------------|| DASHBOARD - LONG MATTRESS PERCENTAGE CARD ||-----------------------//

const LongMattressCard = ({ isLoading, selectedPeriod }) => {
    const classes = useStyles();
    const [percentage, setPercentage] = useState(0);
    const [threshold, setThreshold] = useState(8);
    const [trend, setTrend] = useState(null);
    const [trendValue, setTrendValue] = useState(0);

    useEffect(() => {
        const fetchLongMattressPercentage = async () => {
            try {
                const response = await axios.get(`/dashboard/long-mattress-percentage?period=${selectedPeriod}&threshold=${threshold}`);
                if (response.data.success) {
                    setPercentage(response.data.data.percentage || 0);
                    setTrend(response.data.data.trend);
                    setTrendValue(response.data.data.trend_value || 0);
                }
            } catch (error) {
                console.error('Error fetching long mattress percentage:', error);
            }
        };

        fetchLongMattressPercentage();
    }, [selectedPeriod, threshold]);

    const handleThresholdChange = (event, newThreshold) => {
        if (newThreshold !== null) {
            setThreshold(newThreshold);
        }
    };

    return (
        <React.Fragment>
            {isLoading ? (
                <TotalIncomeCard />
            ) : (
                <MainCard border={false} className={classes.card} contentClass={classes.content} sx={{ height: '100%' }}>
                    <List className={classes.padding}>
                        <ListItem alignItems="center" disableGutters className={classes.padding} sx={{ justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ListItemAvatar>
                                    <Avatar variant="rounded" className={classes.avatar}>
                                        <IconRuler2 fontSize="inherit" />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    className={classes.padding}
                                    sx={{
                                        mt: 0.45,
                                        mb: 0.45
                                    }}
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h4" className={classes.primary}>
                                                {percentage.toFixed(1)}%
                                            </Typography>
                                            {trend && (
                                                <Chip
                                                    icon={
                                                        trend === 'up' ? (
                                                            <IconTrendingUp size={14} />
                                                        ) : trend === 'down' ? (
                                                            <IconTrendingDown size={14} />
                                                        ) : (
                                                            <IconMinus size={14} />
                                                        )
                                                    }
                                                    label={`${trendValue > 0 ? '+' : ''}${trendValue.toFixed(1)}%`}
                                                    size="small"
                                                    sx={{
                                                        height: '20px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        backgroundColor: trend === 'up' ? 'success.light' : trend === 'down' ? 'error.light' : 'grey.300',
                                                        color: trend === 'up' ? 'success.dark' : trend === 'down' ? 'error.dark' : 'grey.700',
                                                        '& .MuiChip-icon': {
                                                            color: 'inherit',
                                                            marginLeft: '4px'
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="subtitle2" className={classes.secondary}>
                                            AS Mattresses > {threshold}m
                                        </Typography>
                                    }
                                />
                            </Box>
                            <ToggleButtonGroup
                                value={threshold}
                                exclusive
                                onChange={handleThresholdChange}
                                size="small"
                                sx={{
                                    height: '28px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '6px',
                                    padding: '2px',
                                    mr: 4,
                                    '& .MuiToggleButtonGroup-grouped': {
                                        border: 0,
                                        '&:not(:first-of-type)': {
                                            borderRadius: '4px',
                                            marginLeft: '2px'
                                        },
                                        '&:first-of-type': {
                                            borderRadius: '4px'
                                        }
                                    },
                                    '& .MuiToggleButton-root': {
                                        px: 1.5,
                                        py: 0.5,
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        color: 'grey.500',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            color: 'grey.700'
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.light',
                                            color: 'primary.dark',
                                            fontWeight: 700,
                                            boxShadow: 'none',
                                            '&:hover': {
                                                backgroundColor: 'primary.light',
                                            }
                                        }
                                    }
                                }}
                            >
                                <ToggleButton value={6}>6m</ToggleButton>
                                <ToggleButton value={8}>8m</ToggleButton>
                                <ToggleButton value={10}>10m</ToggleButton>
                            </ToggleButtonGroup>
                        </ListItem>
                    </List>
                </MainCard>
            )}
        </React.Fragment>
    );
};

LongMattressCard.propTypes = {
    isLoading: PropTypes.bool,
    selectedPeriod: PropTypes.string
};

export default LongMattressCard;
