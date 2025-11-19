import React from 'react';
import { Grid, Typography, Card, CardContent } from '@mui/material';
import { gridSpacing } from '../../store/constant';

const Coverage = () => {
    return (
        <Grid container spacing={gridSpacing}>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h3" gutterBottom>
                            Coverage
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            This page will display coverage information and analytics.
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default Coverage;

