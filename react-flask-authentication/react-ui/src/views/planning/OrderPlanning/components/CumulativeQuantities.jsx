import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const CumulativeQuantities = ({
  orderSizes,
  combinations: _combinations,
  currentTabIndex: _currentTabIndex,
  tables
}) => {
  const { t } = useTranslation();
  const [cumulativeQuantities, setCumulativeQuantities] = useState([]);
  const [partIndices, setPartIndices] = useState([]);
  const [segmentTotals, setSegmentTotals] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showPerSize, setShowPerSize] = useState(false);

  const getSafePartIndex = (table) => {
    if (!table || table.partIndex === undefined || table.partIndex === null) {
      return 1;
    }
    const parsed = parseInt(table.partIndex, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  // Calculate cumulative quantities across ALL combinations and ALL Parts
  // Remaining = Original order quantity - sum(planned across all Parts & combinations)
  useEffect(() => {
    if (!orderSizes || !orderSizes.length) {
      setCumulativeQuantities([]);
      setPartIndices([]);
      setSegmentTotals([]);
      return;
    }

    // Initialize size totals (all Parts combined)
    const sizeTotalsAllParts = {};
    orderSizes.forEach((size) => {
      sizeTotalsAllParts[size.size] = 0;
    });

    // Track quantities per Part to show detailed breakdown
    const sizeTotalsByPart = {};
    const partsSet = new Set();
    const segmentTotalsMap = {};

    // Use all mattress tables for this order with fabric type "01" (all combinations, all Parts)
    const relevantTables = (tables || []).filter((table) => table.fabricType === '01');

    relevantTables.forEach((table) => {
      const partIndex = getSafePartIndex(table);
      partsSet.add(partIndex);

      const segmentKey = [
        table.productionCenter || '',
        table.cuttingRoom || '',
        table.destination || '',
        partIndex,
      ].join('|');

      if (!segmentTotalsMap[segmentKey]) {
        segmentTotalsMap[segmentKey] = {
          productionCenter: table.productionCenter,
          cuttingRoom: table.cuttingRoom,
          destination: table.destination,
          partIndex,
          totalPlanned: 0,
        };
      }

      if (table.rows && table.rows.length > 0) {
        // Ensure we have a per-Part bucket for this table's Part
        if (!sizeTotalsByPart[partIndex]) {
          sizeTotalsByPart[partIndex] = {};
          orderSizes.forEach((size) => {
            sizeTotalsByPart[partIndex][size.size] = 0;
          });
        }

        table.rows.forEach((row) => {
          // The size quantities are stored in the piecesPerSize object and need to be multiplied by layers
          if (row.piecesPerSize && typeof row.piecesPerSize === 'object') {
            const layers = parseInt(row.layers, 10) || 1; // Default to 1 if no layers specified

            orderSizes.forEach((size) => {
              const sizeKey = size.size;
              const piecesForSize = parseInt(row.piecesPerSize[sizeKey], 10) || 0;
              const totalQuantity = piecesForSize * layers; // Multiply by layers

              sizeTotalsAllParts[sizeKey] += totalQuantity;
              sizeTotalsByPart[partIndex][sizeKey] += totalQuantity;
              segmentTotalsMap[segmentKey].totalPlanned += totalQuantity;
            });
          }
        });
      }
    });

    const sortedParts = Array.from(partsSet).sort((a, b) => a - b);

    const segmentTotalsArray = Object.values(segmentTotalsMap).sort((a, b) => {
      const pcA = a.productionCenter || '';
      const pcB = b.productionCenter || '';
      if (pcA !== pcB) {
        return pcA.localeCompare(pcB);
      }
      const crA = a.cuttingRoom || '';
      const crB = b.cuttingRoom || '';
      if (crA !== crB) {
        return crA.localeCompare(crB);
      }
      const destA = a.destination || '';
      const destB = b.destination || '';
      if (destA !== destB) {
        return destA.localeCompare(destB);
      }
      return (a.partIndex || 0) - (b.partIndex || 0);
    });

    // Convert to array format for display - show remaining quantities (original - planned)
    const remainingArray = orderSizes.map((size) => {
      const plannedQty = sizeTotalsAllParts[size.size] || 0;

      // Build per-Part breakdown for this size
      const plannedByPart = {};
      sortedParts.forEach((partIndex) => {
        const partQty = sizeTotalsByPart[partIndex]?.[size.size] || 0;
        plannedByPart[partIndex] = partQty;
      });

      return {
        size: size.size,
        originalQty: size.qty,
        plannedQty,
        remainingQty: size.qty - plannedQty, // Original - Already Planned (all Parts & combinations)
        plannedByPart,
      };
    });

    setCumulativeQuantities(remainingArray);
    setPartIndices(sortedParts);
    setSegmentTotals(segmentTotalsArray);
  }, [orderSizes, tables]);

  // Calculate totals
  const totalOriginal = cumulativeQuantities.reduce((sum, size) => sum + size.originalQty, 0);
  const totalPlanned = cumulativeQuantities.reduce((sum, size) => sum + size.plannedQty, 0);
  const totalRemaining = cumulativeQuantities.reduce((sum, size) => sum + size.remainingQty, 0);


  const segmentGroups = Object.values(
    segmentTotals.reduce((acc, segment) => {
      const key = [
        segment.productionCenter || '',
        segment.cuttingRoom || '',
        segment.destination || '',
      ].join('|');

      if (!acc[key]) {
        acc[key] = {
          key,
          productionCenter: segment.productionCenter,
          cuttingRoom: segment.cuttingRoom,
          destination: segment.destination,
          parts: [],
        };
      }

      acc[key].parts.push({
        partIndex: segment.partIndex,
        totalPlanned: segment.totalPlanned,
      });

      return acc;
    }, {})
  );

  // Check if there are any parts > 1 across all groups (show Part label only if there are multiple parts)
  const hasMultipleParts = segmentGroups.some(group =>
    group.parts.some(part => part.partIndex > 1) || group.parts.length > 1
  );

  if (!cumulativeQuantities.length) {
    return null;
  }

  return (
    <Box mt={1}>
      <Box
        p={1}
        sx={{
          backgroundColor: (theme) => theme.palette.grey[50],
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Compact summary row with inline details */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 0.25,
            columnGap: 1,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              {t('orderPlanning.remainingHeaderOverline', 'Order coverage')}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mt: 0.25,
              }}
            >
              {[
                {
                  key: 'remaining',
                  label: t('orderPlanning.remainingLabel', 'Remaining'),
                  value: `${totalRemaining.toLocaleString()} pcs`,
                  color: totalRemaining >= 0 ? 'success.main' : 'error.main',
                  fontWeight: 600,
                },
                {
                  key: 'original',
                  label: t('orderPlanning.originalLabel', 'Original'),
                  value: `${totalOriginal.toLocaleString()} pcs`,
                },
                {
                  key: 'planned',
                  label: t('orderPlanning.plannedLabel', 'Planned'),
                  value: `${totalPlanned.toLocaleString()} pcs`,
                },
              ].map((item) => (
                <Box
                  key={item.key}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    backgroundColor: 'background.paper',
                    minWidth: 150,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.25,
                      fontWeight: item.fontWeight || 500,
                      color: item.color || 'text.primary',
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              {showDetails
                ? t('orderPlanning.remainingDetailsHide', 'Hide details')
                : t('orderPlanning.remainingDetailsShow', 'Show details')}
            </Button>
          </Box>
        </Box>

        {/* Full details (per-size + distribution) in a single collapsible block */}
        {showDetails && (
          <Box mt={1}>
            {/* Per-size remaining as chips */}
            {cumulativeQuantities.length > 0 && (
              <Box mb={1.25}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {t('orderPlanning.remainingPerSizeTitle', 'Remaining per size')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {cumulativeQuantities.map((size) => (
                    <Chip
                      key={size.size}
                      size="small"
                      variant="outlined"
                      color={size.remainingQty < 0 ? 'error' : 'default'}
                      sx={{
                        '& .MuiChip-label': {
                          fontWeight: 500,
                        },
                      }}
                      label={t(
                        'orderPlanning.remainingPerSizeChip',
                        'Size {{size}} · {{remaining}} pcs',
                        {
                          size: size.size,
                          remaining: size.remainingQty,
                        }
                      )}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Breakdown by Production Center / Cutting Room / Part */}
            {segmentGroups.length > 0 && (
              <Box>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {hasMultipleParts
                    ? t(
                        'orderPlanning.plannedBySegmentTitle',
                        'Distribution by Production Center / Cutting room / Part'
                      )
                    : t(
                        'orderPlanning.plannedBySegmentTitleNoPart',
                        'Distribution by Production Center / Cutting room'
                      )
                  }
                </Typography>
                <Grid container spacing={0.75}>
                  {segmentGroups.map((group) => (
                    <Grid item xs={12} md={6} key={group.key}>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.75,
                          borderRadius: 1.5,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          {t(
                            'orderPlanning.plannedBySegmentGroupHeader',
                            'PC: {{pc}} · Room: {{room}} · Dest: {{dest}}',
                            {
                              pc: group.productionCenter || '-',
                              room: group.cuttingRoom || '-',
                              dest: group.destination || '-',
                            }
                          )}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {group.parts.map((part) => (
                            <Chip
                              key={`${group.key}-part-${part.partIndex}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{
                                '& .MuiChip-label': {
                                  fontWeight: 500,
                                },
                              }}
                              label={hasMultipleParts
                                ? t(
                                    'orderPlanning.plannedBySegmentPartChip',
                                    'Part {{part}} · {{qty}} pcs',
                                    {
                                      part: part.partIndex,
                                      qty: part.totalPlanned,
                                    }
                                  )
                                : t(
                                    'orderPlanning.plannedBySegmentQtyChip',
                                    '{{qty}} pcs',
                                    {
                                      qty: part.totalPlanned,
                                    }
                                  )
                              }
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

CumulativeQuantities.propTypes = {
  orderSizes: PropTypes.arrayOf(
    PropTypes.shape({
      size: PropTypes.string.isRequired,
      qty: PropTypes.number.isRequired
    })
  ).isRequired,
  combinations: PropTypes.array.isRequired,
  currentTabIndex: PropTypes.number.isRequired,
  tables: PropTypes.array.isRequired
};

export default CumulativeQuantities;
