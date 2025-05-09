import React from 'react';

// material-ui
import { makeStyles } from '@mui/styles';
import { Button, Card, CardContent, Grid, Link, Stack, Typography } from '@mui/material';

// project imports
import AnimateButton from './../../../../ui-component/extended/AnimateButton';

import { useTranslation } from 'react-i18next';

// style constant
const useStyles = makeStyles((theme) => ({
    card: {
        background: theme.palette.warning.light,
        marginTop: '16px',
        marginBottom: '16px',
        overflow: 'hidden',
        position: 'relative',
        '&:after': {
            content: '""',
            position: 'absolute',
            width: '200px',
            height: '200px',
            border: '19px solid ',
            borderColor: theme.palette.warning.main,
            borderRadius: '50%',
            top: '65px',
            right: '-150px'
        },
        '&:before': {
            content: '""',
            position: 'absolute',
            width: '200px',
            height: '200px',
            border: '3px solid ',
            borderColor: theme.palette.warning.main,
            borderRadius: '50%',
            top: '145px',
            right: '-70px'
        }
    },
    tagLine: {
        color: theme.palette.grey[900],
        opacity: 0.6
    },
    button: {
        color: theme.palette.grey[800],
        backgroundColor: theme.palette.warning.main,
        textTransform: 'capitalize',
        boxShadow: 'none',
        '&:hover': {
            backgroundColor: theme.palette.warning.dark
        }
    }
}));

//-----------------------|| PROFILE MENU - UPGRADE PLAN CARD ||-----------------------//

const UpgradePlanCard = () => {
    const classes = useStyles();
    const { t } = useTranslation();

    return (
        <Card className={classes.card}>
            <CardContent>
                <Grid container direction="column" spacing={2}>
                    <Grid item>
                        <Typography variant="h4">
                            {t('sidebar.cuttingBIAnalytics')}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="subtitle2" className={classes.tagLine}>
                            {t('sidebar.fabricConsumptionTracking')}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Stack direction="row">
                            <AnimateButton>
                                <Button
                                    component={Link}
                                    href="https://app.powerbi.com/groups/43372a6e-1426-47c4-b649-c4e5a7b442c9/reports/d0c8200d-b5b6-4e13-9bdd-59d6971ed2e8?ctid=6059e369-43c9-4383-8894-23a9d5957ceb&pbi_source=linkShare"
                                    target="_blank"
                                    variant="contained"
                                    className={classes.button}
                                >
                                    Open Power BI
                                </Button>
                            </AnimateButton>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default UpgradePlanCard;
