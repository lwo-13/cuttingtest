import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  useTheme,
  Chip
} from '@mui/material';
import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';
import { sortSizes } from 'views/planning/OrderPlanning/utils/sortSizes';
import { useTranslation } from 'react-i18next';

const evaluateRatioShift = (italianRatios, zalliRatios, orderedSizes) => {
  const sizeWeights = orderedSizes.reduce((acc, size, index) => {
    acc[size] = index + 1;
    return acc;
  }, {});

  // Normalize both ratios to include all sizes
  const normalizedItalian = {};
  const normalizedZalli = {};
  orderedSizes.forEach(size => {
    normalizedItalian[size] = italianRatios[size] ?? 0;
    normalizedZalli[size] = zalliRatios[size] ?? 0;
  });

  const getWeightedAvg = (ratios) => {
    let total = 0;
    for (const size of orderedSizes) {
      const weight = sizeWeights[size] || 0;
      const percent = ratios[size] || 0;
      total += percent * weight;
    }
    return total / 100;
  };

  const italianAvg = getWeightedAvg(normalizedItalian);
  const zalliAvg = getWeightedAvg(normalizedZalli);
  const diff = zalliAvg - italianAvg;

  let status = 'Balanced';
  if (diff > 0.2) status = 'Disadvantage';
  else if (diff < -0.2) status = 'Advantage';

  return {
    italianAvg: italianAvg.toFixed(2),
    zalliAvg: zalliAvg.toFixed(2),
    diff: diff.toFixed(2),
    status
  };
};

const OrderQuantities = ({ orderSizes, italianRatios }) => {
  const { t } = useTranslation();
  const [openPopup, setOpenPopup] = useState(false);

  const theme = useTheme();
  if (!orderSizes.length) return null;

  const totalQty = orderSizes.reduce((sum, size) => sum + size.qty, 0);

  let chartSeries = [];
  let chartOptions = {};
  let evaluation = null;

  if (italianRatios && Object.keys(italianRatios).length > 0) {
    const zalliRatios = orderSizes.reduce((acc, size) => {
      const percent = totalQty ? (size.qty / totalQty) * 100 : 0;
      acc[size.size] = percent;
      return acc;
    }, {});

    const allSizes = Array.from(
      new Set([
        ...orderSizes.map(s => s.size),
        ...Object.keys(italianRatios || {})
      ])
    );
    const sortedSizes = sortSizes(allSizes.map(size => ({ size }))).map(s => s.size);

    // Ensure we have valid data for the chart
    if (sortedSizes.length > 0) {
      chartSeries = [
        {
          name: 'Italy',
          data: sortedSizes.map(size => {
            const value = italianRatios[size];
            return value ? parseFloat(value) : 0;
          })
        },
        {
          name: 'ZALLI',
          data: sortedSizes.map(size => {
            const match = orderSizes.find(s => s.size === size);
            return match ? Math.round((match.qty / totalQty) * 100) : 0;
          })
        }
      ];

      chartOptions = {
        chart: {
          type: 'bar',
          height: 350,
          id: 'italian-ratio-bar',
          toolbar: {
            show: false
          },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
          }
        },
        colors: [theme?.palette?.primary?.main || '#1976d2', '#12239e'],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded',
            dataLabels: {
              position: 'top'
            }
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return val ? val + '%' : '0%';
          },
          offsetY: -22,
          style: {
            fontSize: '14px',
            fontWeight: 'normal',
            colors: ['#000']
          }
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: sortedSizes,
          title: {
            text: 'Sizes'
          }
        },
        yaxis: {
          title: {
            text: 'Percentage %'
          },
          min: 0,
          max: 100,
          labels: {
            formatter: function (val) {
              return val + '%';
            }
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: (val) => `${val}%`
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'center'
        }
      };

      evaluation = evaluateRatioShift(italianRatios, zalliRatios, sortedSizes);
    }
  }

  return (
    <>
      {/* Print spacer */}
      <Box sx={{
        '@media print': {
          height: '2mm',
          display: 'block'
        },
        '@media screen': {
          display: 'none'
        }
      }} />

      <Box mt={3} p={2} sx={{
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
      <Box sx={{
        '@media print': {
          width: '100% !important',
          maxWidth: '100% !important',
          overflow: 'visible !important',
          '& .MuiGrid-container': {
            flexWrap: 'nowrap !important',
            width: '100% !important',
            maxWidth: '100% !important'
          },
          '& .MuiGrid-item': {
            flexShrink: 1,
            minWidth: 0
          }
        }
      }}>
        <Grid container spacing={1} alignItems="stretch" sx={{
          '@media print': {
            flexWrap: 'nowrap !important',
            width: '100% !important',
            maxWidth: '100% !important',
            '& .MuiGrid-item': {
              flexShrink: 1,
              minWidth: 0,
              maxWidth: 'none !important'
            }
          }
        }}>

        {/* Total Field */}
        <Grid item xs={4} sm={3} md={1.4}>
          <TextField
            label={t('orderPlanning.total', 'Total')}
            variant="outlined"
            value={totalQty}
            slotProps={{ input: { readOnly: true } }}
            sx={{ width: '100%' }}
          />
        </Grid>

        {orderSizes.map((size, index) => {
          const percentage = totalQty ? Math.round((size.qty / totalQty) * 100) : 0;

          return (
            <Grid item xs={4} sm={3} md={1.4} key={index}>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  label={`${t('orderPlanning.size', 'Size')}: ${size.size}`}
                  variant="outlined"
                  value={size.qty}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ width: '100%' }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 12,
                    fontWeight: 'bold',
                    color: '#12239e',
                    pointerEvents: 'none',
                  }}
                >
                  {percentage}%
                </Typography>
              </Box>
            </Grid>
          );
        })}

        {/* 🇮🇹 Button shown inline if ratios exist */}
        {italianRatios && Object.keys(italianRatios).length > 0 && (
          <Grid item xs="auto" sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setOpenPopup(true)}
              sx={{
                fontSize: '1.5rem',
                minWidth: 48,
                borderColor:
                  evaluation?.status === 'Disadvantage'
                    ? theme?.palette?.error?.main || '#f44336'
                    : evaluation?.status === 'Advantage'
                    ? theme?.palette?.success?.main || '#4caf50'
                    : undefined,
                color:
                  evaluation?.status === 'Disadvantage'
                    ? theme?.palette?.error?.main || '#f44336'
                    : evaluation?.status === 'Advantage'
                    ? theme?.palette?.success?.main || '#4caf50'
                    : undefined
              }}
              title={t('orderPlanning.italianRatio', 'Italian Ratio')}
            >
              🇮🇹
            </Button>
          </Grid>
        )}

        <Dialog open={openPopup} onClose={() => setOpenPopup(false)} maxWidth="md" fullWidth>
          <DialogContent>
            <Typography
              variant="subtitle1"
              gutterBottom
              align="center"
              sx={{ fontWeight: 'normal' }}
            >
              {t('orderPlanning.orderRatioAnalysis', 'Order Ratio Analysis')}
            </Typography>

            {/* 📊 Chart */}
            {chartSeries.length > 0 && chartOptions.xaxis ? (
              <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  No chart data available
                </Typography>
              </Box>
            )}

            {/* ✅ Evaluation Summary */}
            {evaluation && (
              <Box mt={2} textAlign="center">
                <Box mt={1}>
                  {parseFloat(evaluation.diff) > 0.2 && (
                    <Chip label={`🔴 High Disadvantage`} color="error" />
                  )}
                  {parseFloat(evaluation.diff) < -0.2 && (
                    <Chip label={`✅ High Advantage`} color="success" />
                  )}
                  {Math.abs(parseFloat(evaluation.diff)) <= 0.2 && (
                    <Chip
                      label={
                        Math.abs(parseFloat(evaluation.diff)) <= 0.03
                          ? `⚖️ Balanced`
                          : parseFloat(evaluation.diff) > 0
                          ? `⚠️ Slight Disadvantage`
                          : `🟢 Slight Advantage`
                      }
                      color={
                        Math.abs(parseFloat(evaluation.diff)) <= 0.03
                          ? 'default'
                          : parseFloat(evaluation.diff) > 0
                          ? 'warning'
                          : 'success'
                      }
                    />
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenPopup(false)}>{t('common.close', 'Close')}</Button>
          </DialogActions>
        </Dialog>

      </Grid>
      </Box>
    </Box>
    </>
  );
};

OrderQuantities.propTypes = {
  orderSizes: PropTypes.arrayOf(
    PropTypes.shape({
      size: PropTypes.string.isRequired,
      qty: PropTypes.number.isRequired
    })
  ).isRequired,
  italianRatios: PropTypes.object
};

export default OrderQuantities;