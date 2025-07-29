import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '../utils/axiosInstance';

const NetworkDiagnostics = () => {
    const [diagnostics, setDiagnostics] = useState({
        loading: false,
        networkTest: null,
        browserInfo: null,
        connectionInfo: null,
        vpnDetection: null,
        errors: []
    });

    const runNetworkTest = async () => {
        setDiagnostics(prev => ({ ...prev, loading: true, errors: [] }));

        try {
            // Test 1: Basic network connectivity
            console.log('🔥 RUNNING NETWORK CONNECTIVITY TEST');
            const networkResponse = await axiosInstance.get('/network-test');
            
            // Test 2: Gather browser information
            const browserInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                onLine: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled,
                connection: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                } : null
            };

            // Test 3: Connection information
            const connectionInfo = {
                hostname: window.location.hostname,
                port: window.location.port,
                protocol: window.location.protocol,
                pathname: window.location.pathname,
                origin: window.location.origin,
                href: window.location.href,
                referrer: document.referrer
            };

            // Test 4: VPN detection
            const vpnDetection = {
                isVPNHostname: window.location.hostname === 'sslvpn1.calzedonia.com',
                hasVPNPath: window.location.pathname.startsWith('/web_forward_CuttingApplication'),
                isHTTPS: window.location.protocol === 'https:',
                hasVPNReferrer: document.referrer && document.referrer.includes('sslvpn1.calzedonia.com'),
                detectedEnvironment: getEnvironmentType()
            };

            setDiagnostics({
                loading: false,
                networkTest: networkResponse.data,
                browserInfo,
                connectionInfo,
                vpnDetection,
                errors: []
            });

        } catch (error) {
            console.error('🔥 NETWORK TEST FAILED:', error);
            setDiagnostics(prev => ({
                ...prev,
                loading: false,
                errors: [...prev.errors, {
                    type: 'Network Test Failed',
                    message: error.message,
                    details: error.response?.data || error.toString()
                }]
            }));
        }
    };

    const getEnvironmentType = () => {
        if (window.location.hostname === 'sslvpn1.calzedonia.com') return 'VPN';
        if (window.location.hostname === 'localhost') return 'Local Development';
        if (window.location.hostname.includes('172.27.57.210') || 
            window.location.hostname.includes('gab-navint01p.csg1.sys.calzedonia.com')) return 'VM Direct';
        return 'Unknown';
    };

    const getStatusColor = (status) => {
        if (status === 'success' || status === true) return 'success';
        if (status === 'error' || status === false) return 'error';
        return 'warning';
    };

    useEffect(() => {
        // Auto-run diagnostics on component mount
        runNetworkTest();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <NetworkCheckIcon sx={{ mr: 1 }} />
                        <Typography variant="h5">Network Diagnostics</Typography>
                        <Button
                            variant="outlined"
                            onClick={runNetworkTest}
                            disabled={diagnostics.loading}
                            sx={{ ml: 'auto' }}
                            startIcon={diagnostics.loading ? <CircularProgress size={20} /> : <NetworkCheckIcon />}
                        >
                            {diagnostics.loading ? 'Testing...' : 'Run Test'}
                        </Button>
                    </Box>

                    {diagnostics.errors.length > 0 && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            <Typography variant="h6">Network Issues Detected:</Typography>
                            {diagnostics.errors.map((error, index) => (
                                <Box key={index} sx={{ mt: 1 }}>
                                    <Typography variant="subtitle2">{error.type}:</Typography>
                                    <Typography variant="body2">{error.message}</Typography>
                                </Box>
                            ))}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Network Test Results */}
                        <Grid item xs={12} md={6}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {diagnostics.networkTest ? 
                                            <CheckCircleIcon color="success" sx={{ mr: 1 }} /> :
                                            <ErrorIcon color="error" sx={{ mr: 1 }} />
                                        }
                                        <Typography>Backend Connectivity</Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {diagnostics.networkTest ? (
                                        <Box>
                                            <Chip 
                                                label={diagnostics.networkTest.status} 
                                                color={getStatusColor(diagnostics.networkTest.status)} 
                                                sx={{ mb: 1 }}
                                            />
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                {diagnostics.networkTest.message}
                                            </Typography>
                                            <Typography variant="caption">
                                                Server: {diagnostics.networkTest.server_info?.hostname} 
                                                ({diagnostics.networkTest.server_info?.local_ip})
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography color="error">Backend connectivity test failed</Typography>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </Grid>

                        {/* VPN Detection */}
                        <Grid item xs={12} md={6}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <NetworkCheckIcon sx={{ mr: 1 }} />
                                        <Typography>VPN Detection</Typography>
                                        <Chip 
                                            label={diagnostics.vpnDetection?.detectedEnvironment || 'Unknown'} 
                                            size="small" 
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {diagnostics.vpnDetection && (
                                        <Box>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                Environment: <strong>{diagnostics.vpnDetection.detectedEnvironment}</strong>
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                <Chip 
                                                    label="VPN Hostname" 
                                                    color={getStatusColor(diagnostics.vpnDetection.isVPNHostname)}
                                                    size="small"
                                                />
                                                <Chip 
                                                    label="VPN Path" 
                                                    color={getStatusColor(diagnostics.vpnDetection.hasVPNPath)}
                                                    size="small"
                                                />
                                                <Chip 
                                                    label="HTTPS" 
                                                    color={getStatusColor(diagnostics.vpnDetection.isHTTPS)}
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </Grid>

                        {/* Browser Information */}
                        <Grid item xs={12} md={6}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>Browser Information</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {diagnostics.browserInfo && (
                                        <Box>
                                            <Typography variant="body2">Platform: {diagnostics.browserInfo.platform}</Typography>
                                            <Typography variant="body2">Language: {diagnostics.browserInfo.language}</Typography>
                                            <Typography variant="body2">Online: {diagnostics.browserInfo.onLine ? 'Yes' : 'No'}</Typography>
                                            <Typography variant="body2">Cookies: {diagnostics.browserInfo.cookieEnabled ? 'Enabled' : 'Disabled'}</Typography>
                                            {diagnostics.browserInfo.connection && (
                                                <Typography variant="body2">
                                                    Connection: {diagnostics.browserInfo.connection.effectiveType} 
                                                    ({diagnostics.browserInfo.connection.downlink} Mbps)
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </Grid>

                        {/* Connection Details */}
                        <Grid item xs={12} md={6}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>Connection Details</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {diagnostics.connectionInfo && (
                                        <Box>
                                            <Typography variant="body2">Hostname: {diagnostics.connectionInfo.hostname}</Typography>
                                            <Typography variant="body2">Protocol: {diagnostics.connectionInfo.protocol}</Typography>
                                            <Typography variant="body2">Port: {diagnostics.connectionInfo.port || 'default'}</Typography>
                                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                                URL: {diagnostics.connectionInfo.href}
                                            </Typography>
                                            {diagnostics.connectionInfo.referrer && (
                                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                                    Referrer: {diagnostics.connectionInfo.referrer}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default NetworkDiagnostics;
