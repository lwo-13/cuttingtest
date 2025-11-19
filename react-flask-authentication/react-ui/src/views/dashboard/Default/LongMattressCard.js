import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography, Box, Chip } from '@mui/material';

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
    const [ranges, setRanges] = useState([]);
    const [totalMattresses, setTotalMattresses] = useState(0);

    useEffect(() => {
        const fetchLongMattressPercentage = async () => {
            try {
                // Always use 6m threshold to get full breakdown
                const response = await axios.get(`/dashboard/long-mattress-percentage?period=${selectedPeriod}&threshold=6`);
                if (response.data.success) {
                    setRanges(response.data.data.ranges || []);
                    setTotalMattresses(response.data.data.total_mattresses || 0);
                }
            } catch (error) {
                console.error('Error fetching long mattress percentage:', error);
            }
        };

        fetchLongMattressPercentage();
    }, [selectedPeriod]);

    // Color palette for ranges
    const getRangeColor = (index, total) => {
        const colors = ['#e3f2fd', '#90caf9', '#42a5f5', '#1976d2'];
        return colors[index % colors.length];
    };

    return (
        <React.Fragment>
            {isLoading ? (
                <TotalIncomeCard />
            ) : (
                <MainCard border={false} className={classes.card} contentClass={classes.content} sx={{ height: '100%' }}>
                    <List className={classes.padding}>
                        <ListItem alignItems="center" disableGutters className={classes.padding}>
                            <ListItemAvatar>
                                <Avatar variant="rounded" className={classes.avatar}>
                                    <IconRuler2 fontSize="inherit" />
                                </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ flex: 1, mr: 5 }}>
                                {/* Length Range Breakdown */}
                                {ranges.length > 0 && totalMattresses > 0 && (
                                    <Box>
                                        {/* Stacked Progress Bar */}
                                        <Box sx={{
                                            display: 'flex',
                                            height: '24px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            backgroundColor: 'grey.200',
                                            mb: 0.75,
                                            border: '1px solid',
                                            borderColor: 'grey.300'
                                        }}>
                                            {ranges.map((range, index) => (
                                                range.percentage > 0 && (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            width: `${range.percentage}%`,
                                                            backgroundColor: getRangeColor(index, ranges.length),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.3s ease',
                                                            position: 'relative',
                                                            borderRight: index < ranges.length - 1 ? '1px solid rgba(255,255,255,0.4)' : 'none'
                                                        }}
                                                        title={`${range.label}: ${range.count} mattresses (${range.percentage.toFixed(1)}%)`}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: index >= 2 ? 'white' : 'primary.dark',
                                                                fontWeight: 600,
                                                                fontSize: '0.6rem',
                                                                textAlign: 'center',
                                                                px: 0.5
                                                            }}
                                                        >
                                                            {range.percentage > 12 ? `${range.percentage.toFixed(0)}%` : ''}
                                                        </Typography>
                                                    </Box>
                                                )
                                            ))}
                                        </Box>

                                        {/* Legend with Chips */}
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {ranges.map((range, index) => (
                                                <Chip
                                                    key={index}
                                                    label={range.label}
                                                    size="small"
                                                    sx={{
                                                        height: '20px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 500,
                                                        backgroundColor: getRangeColor(index, ranges.length),
                                                        color: index >= 2 ? 'white' : 'primary.dark',
                                                        '& .MuiChip-label': {
                                                            px: 1.5,
                                                            py: 0
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
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
