import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axios from 'utils/axiosInstance';
import { useBadgeCount } from '../../contexts/BadgeCountContext';

const WidthValidation = () => {
  const [validationData, setValidationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedHandlingUnits, setExpandedHandlingUnits] = useState({});

  const { refreshWidthValidationCount } = useBadgeCount();

  const fetchWidthValidation = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching width validation data...');

      // Try the Flask-RESTX endpoint first, then fallback to basic Flask route
      let response;
      try {
        console.log('Trying Flask-RESTX endpoint: /navision/width_validation');
        response = await axios.get('/navision/width_validation');
        console.log('Flask-RESTX response received:', response);
      } catch (restxError) {
        console.log('Flask-RESTX failed:', restxError);
        console.log('Trying basic Flask route: /navision/width_validation_basic');
        response = await axios.get('/navision/width_validation_basic');
        console.log('Basic Flask response received:', response);
      }

      if (response.data.success) {
        setValidationData(response.data.data);
        console.log('Data loaded successfully:', response.data);

        // Refresh badge count after loading data
        refreshWidthValidationCount();
      } else {
        const errorMsg = response.data.message || 'Failed to fetch width validation data';
        console.error('API returned error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error fetching width validation data';
      console.error('Request failed:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidthValidation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const getStatusIcon = (status) => {
    switch (status) {
      case 'no_change':
        return <CheckCircleIcon sx={{ color: 'green', mr: 1 }} />;
      case 'width_error':
        return <ErrorIcon sx={{ color: 'red', mr: 1 }} />;
      case 'width_warning':
        return <ErrorIcon sx={{ color: 'orange', mr: 1 }} />;
      case 'width_changed':
        return <ErrorIcon sx={{ color: 'red', mr: 1 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'no_change':
        return 'success';
      case 'width_error':
        return 'error';
      case 'width_warning':
        return 'warning';
      case 'width_changed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'no_change':
        return 'No Width Change';
      case 'width_error':
        return 'Width Error';
      case 'width_warning':
        return 'Width Warning';
      case 'width_changed':
        return 'Width Changed';
      default:
        return status;
    }
  };

  const toggleHandlingUnits = (batchKey) => {
    setExpandedHandlingUnits(prev => ({
      ...prev,
      [batchKey]: !prev[batchKey]
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#673ab7' }} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading width validation data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#673ab7', fontWeight: 'bold' }}>
          Width Validation
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchWidthValidation}
          startIcon={<RefreshIcon />}
          sx={{ bgcolor: '#673ab7', '&:hover': { bgcolor: '#5e35b1' } }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ color: 'secondary.main', fontWeight: 'bold', mb: 2 }}>
        Width Change Notifications
      </Typography>





      {/* Validation Results */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Validation Results
          </Typography>

          {validationData.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              No validation data available
            </Typography>
          ) : (
            validationData.map((item, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {getStatusIcon(item.status)}
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2, fontSize: '1.1rem' }}>
                      {item.order_commessa}
                    </Typography>
                    <Chip
                      label={getStatusText(item.status)}
                      color={getStatusColor(item.status)}
                      size="small"
                    />

                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Width Changes Summary */}
                  {item.width_changes && item.width_changes.length > 0 && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        Width Changes Detected - Planner Action Required
                      </Typography>
                      {item.width_changes.map((change, idx) => (
                        <Box key={idx} sx={{
                          mb: 1,
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: change.severity === 'warning' ? '#ff9800' : '#f44336',
                          bgcolor: change.severity === 'warning' ? '#fff3e0' : '#ffebee'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Chip
                              label={change.severity === 'warning' ? 'WARNING' : 'ERROR'}
                              size="small"
                              color={change.severity === 'warning' ? 'warning' : 'error'}
                              sx={{ mr: 1, fontWeight: 'bold' }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Bagno {change.bagno} ({change.fabric_code})
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Planned:</strong> {change.planned}cm → <strong>Measured:</strong> {change.actual}cm
                            <span style={{
                              color: change.difference > 0 ? '#00e676' : '#f44336',
                              fontWeight: 'bold',
                              marginLeft: '8px'
                            }}>
                              ({change.difference > 0 ? '+' : ''}{change.difference}cm difference)
                            </span>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Match Rate:</strong> {change.matching_measurements}/{change.total_measurements} rolls ({change.match_percentage}%)
                          </Typography>
                          <Typography variant="body2" sx={{
                            fontSize: '0.9em',
                            color: change.severity === 'warning' ? '#e65100' : '#c62828',
                            fontStyle: 'italic',
                            fontWeight: 500
                          }}>
                            {change.message}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Batch Summary - Who What Where */}
                  {item.batch_summary && item.batch_summary.length > 0 && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        Batch Information - Who Measured What Where
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Batch/Dye Lot</strong></TableCell>
                              <TableCell><strong>Avg Width</strong></TableCell>
                              <TableCell><strong>Width Range</strong></TableCell>
                              <TableCell><strong>Measurements</strong></TableCell>
                              <TableCell><strong>Total Qty</strong></TableCell>
                              <TableCell><strong>Locations</strong></TableCell>
                              <TableCell><strong>Handling Units</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {item.batch_summary.map((batch, idx) => {
                              const batchKey = `${item.order_commessa}-${idx}`;
                              const isExpanded = expandedHandlingUnits[batchKey];
                              return (
                                <React.Fragment key={idx}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{batch.batch}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{batch.avg_width}cm</TableCell>
                                    <TableCell>{batch.width_range}cm</TableCell>
                                    <TableCell>{batch.measurements_count}</TableCell>
                                    <TableCell>{batch.total_quantity}</TableCell>
                                    <TableCell>{batch.locations.join(', ')}</TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2">
                                          {batch.handling_units.length} units
                                        </Typography>
                                        <IconButton
                                          size="small"
                                          onClick={() => toggleHandlingUnits(batchKey)}
                                          sx={{ color: 'text.secondary' }}
                                        >
                                          {isExpanded ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ margin: 1, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                            Handling Units for {batch.batch}:
                                          </Typography>
                                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {batch.handling_units.join(', ')}
                                          </Typography>
                                        </Box>
                                      </Collapse>
                                    </TableCell>
                                  </TableRow>
                                </React.Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Actual Widths (Specula Measurements)
                      </Typography>
                      {item.navision_items && item.navision_items.length > 0 ? (
                        (() => {
                          // Group measurements by width
                          const widthGroups = {};
                          item.navision_items.forEach(navItem => {
                            const width = navItem.width;
                            if (!widthGroups[width]) {
                              widthGroups[width] = {
                                width: width,
                                count: 0,
                                total_quantity: 0,
                                item_no: navItem.item_no,
                                batch_dye_lot: navItem.batch_dye_lot,
                                locations: new Set(),
                                statuses: new Set()
                              };
                            }
                            widthGroups[width].count += 1;
                            widthGroups[width].total_quantity += (navItem.quantity || 0);
                            widthGroups[width].locations.add(navItem.bin_code || 'N/A');
                            widthGroups[width].statuses.add(navItem.status || 'Unknown');
                          });

                          // Convert to array and sort by width
                          const sortedGroups = Object.values(widthGroups).sort((a, b) => a.width - b.width);

                          return (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Width (cm)</TableCell>
                                    <TableCell>Number of Rolls</TableCell>
                                    <TableCell>Total Length</TableCell>
                                    <TableCell>Item No</TableCell>
                                    <TableCell>Batch/Dye Lot</TableCell>
                                    <TableCell>Locations</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sortedGroups.map((group, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                                        {group.width}
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>
                                        {group.count} rolls
                                      </TableCell>
                                      <TableCell>
                                        {group.total_quantity.toFixed(2)}
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>{group.item_no}</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>{group.batch_dye_lot || 'N/A'}</TableCell>
                                      <TableCell>{Array.from(group.locations).join(', ')}</TableCell>
                                      <TableCell>
                                        {Array.from(group.statuses).map((status, statusIdx) => (
                                          <Chip
                                            key={statusIdx}
                                            label={status}
                                            size="small"
                                            color={status === 'Picked' ? 'success' : 'default'}
                                            sx={{ mr: 0.5, mb: 0.5 }}
                                          />
                                        ))}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        })()
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          No Specula measurements found
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Planned Widths (Cutting Room)
                      </Typography>
                      {item.cutting_room_items && item.cutting_room_items.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Width (cm)</TableCell>
                                <TableCell>Mattress</TableCell>
                                <TableCell>Fabric Code</TableCell>
                                <TableCell>Fabric Color</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {item.cutting_room_items.map((crItem, idx) => (
                                <TableRow key={idx}>
                                  <TableCell sx={{ fontWeight: 'bold' }}>{crItem.width}</TableCell>
                                  <TableCell>{crItem.mattress}</TableCell>
                                  <TableCell>{crItem.fabric_code}</TableCell>
                                  <TableCell>{crItem.fabric_color}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          No cutting room planning found
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WidthValidation;
