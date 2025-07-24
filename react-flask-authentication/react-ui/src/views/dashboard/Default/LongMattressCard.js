import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import axios from 'utils/axiosInstance';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';

// project imports
import MainCard from './../../../ui-component/cards/MainCard';
import TotalIncomeCard from './../../../ui-component/cards/Skeleton/TotalIncomeCard';

// assets
import { IconRuler2 } from '@tabler/icons';

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

    useEffect(() => {
        const fetchLongMattressPercentage = async () => {
            try {
                const response = await axios.get(`/dashboard/long-mattress-percentage?period=${selectedPeriod}`);
                if (response.data.success) {
                    setPercentage(response.data.data.percentage || 0);
                }
            } catch (error) {
                console.error('Error fetching long mattress percentage:', error);
            }
        };

        fetchLongMattressPercentage();
    }, [selectedPeriod]);

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
                            <ListItemText
                                className={classes.padding}
                                sx={{
                                    mt: 0.45,
                                    mb: 0.45
                                }}
                                primary={
                                    <Typography variant="h4" className={classes.primary}>
                                        {percentage.toFixed(1)}%
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="subtitle2" className={classes.secondary}>
                                        Mattresses > 8m
                                    </Typography>
                                }
                            />
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
