import React from 'react';
import { useHistory } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    IconSettings,
    IconBuildingFactory,
    IconPalette,
    IconUsers,
    IconDatabase,
    IconTool
} from '@tabler/icons';
import MainCard from 'ui-component/cards/MainCard';

const ConfigurationDashboard = () => {
    const history = useHistory();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const configOptions = [
        {
            id: 'production-centers',
            title: 'Production Centers',
            description: 'Manage production centers and their mappings',
            icon: IconBuildingFactory,
            path: '/configuration/production-centers',
            color: '#1976d2'
        },
        {
            id: 'user-roles',
            title: 'User Roles',
            description: 'Manage user roles and permissions',
            icon: IconUsers,
            path: '/configuration/user-roles',
            color: '#388e3c'
        },
        {
            id: 'branding',
            title: 'Branding',
            description: 'Configure logo and favicon',
            icon: IconPalette,
            path: '/configuration/branding',
            color: '#d32f2f'
        },
        {
            id: 'server-settings',
            title: 'Server Settings',
            description: 'Database credentials, Power BI, and server configuration',
            icon: IconDatabase,
            path: '/configuration/server-settings',
            color: '#7b1fa2'
        }
    ];

    const handleCardClick = (path) => {
        history.push(path);
    };

    return (
        <MainCard title="Configuration Management">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select a configuration section to manage
            </Typography>

            <Grid container spacing={3}>
                {configOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                        <Grid item xs={12} sm={6} md={4} key={option.id}>
                            <Card
                                onClick={() => handleCardClick(option.path)}
                                sx={{
                                    cursor: 'pointer',
                                    height: '100%',
                                    transition: 'all 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                                        backgroundColor: '#f5f5f5'
                                    },
                                    backgroundColor: '#fff',
                                    border: `2px solid ${option.color}20`,
                                    borderRadius: 2
                                }}
                            >
                                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            mb: 2
                                        }}
                                    >
                                        <Icon
                                            size={48}
                                            color={option.color}
                                            stroke={1.5}
                                        />
                                    </Box>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 600,
                                            mb: 1,
                                            color: option.color
                                        }}
                                    >
                                        {option.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ lineHeight: 1.5 }}
                                    >
                                        {option.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </MainCard>
    );
};

export default ConfigurationDashboard;

