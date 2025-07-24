import React from 'react';
import { useTranslation } from 'react-i18next';

// material-ui
import {
    Box,
    Button,
    ButtonGroup,
    Paper,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// icons
import {
    IconCalendar,
    IconCalendarTime,
    IconCalendarEvent,
    IconChartBar
} from '@tabler/icons';

const DateFilter = ({ selectedPeriod, onPeriodChange, sx = {} }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    const periods = [
        {
            value: 'today',
            label: t('dashboard.today', 'Today'),
            icon: <IconCalendarTime size={16} />
        },
        {
            value: 'week',
            label: t('dashboard.thisWeek', 'This Week'),
            icon: <IconCalendarEvent size={16} />
        },
        {
            value: 'month',
            label: t('dashboard.thisMonth', 'This Month'),
            icon: <IconCalendar size={16} />
        },
        {
            value: 'year',
            label: t('dashboard.thisYear', 'This Year'),
            icon: <IconChartBar size={16} />
        }
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 2,
                backgroundColor: theme.palette.background.paper,
                boxShadow: 'none',
                ...sx
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ButtonGroup
                    variant="outlined"
                    size="small"
                    sx={{
                        '& .MuiButton-root': {
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.secondary,
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                                borderColor: theme.palette.primary.main
                            }
                        }
                    }}
                >
                    {periods.map((period) => (
                        <Button
                            key={period.value}
                            variant={selectedPeriod === period.value ? 'contained' : 'outlined'}
                            startIcon={period.icon}
                            onClick={() => onPeriodChange(period.value)}
                            sx={{
                                ...(selectedPeriod === period.value && {
                                    backgroundColor: theme.palette.primary.main,
                                    color: '#ffffff !important',
                                    '& .MuiSvgIcon-root': {
                                        color: '#ffffff !important'
                                    },
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.dark,
                                        color: '#ffffff !important'
                                    }
                                })
                            }}
                        >
                            {period.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </Box>
        </Paper>
    );
};

export default DateFilter;
