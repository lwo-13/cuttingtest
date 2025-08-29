import React, { useState } from 'react';
import { Grid, Autocomplete, TextField, Box, IconButton } from '@mui/material';
import { AutoFixHigh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AlongAutoPopulateDialog from './AlongAutoPopulateDialog';
import ColorFieldWithDescription from 'components/ColorFieldWithDescription';

const AlongGroupCard = ({
  table,
  tables,
  fabricTypeOptions,
  isTableEditable,
  setTables,
  setUnsavedChanges,
  handleAlongExtraChange,
  mattressTables = [], // Add mattress tables for bagno splitting logic
  orderSizes = [], // Add order sizes for size splitting checkboxes
  handleAddRowAlong // Add function to create new rows
}) => {
  const { t } = useTranslation();
  const [autoPopulateDialogOpen, setAutoPopulateDialogOpen] = useState(false);

  // Check if there's a matching destination, fabric code and color in mattress tables
  const hasMatchingFabric = mattressTables.some(mattressTable =>
    mattressTable.destination === table.destination &&
    mattressTable.fabricCode === table.fabricCode &&
    mattressTable.fabricColor === table.fabricColor
  );

  // Calculate automatic fields (rolls, metersCollaretto, consumption) for an along row
  const calculateAlongFields = (row, alongExtra) => {
    const pieces = parseFloat(row.pieces) || 0;
    const width = parseFloat(row.usableWidth) || 0;
    const collWidth = (parseFloat(row.collarettoWidth) || 1) / 10;
    const scrap = parseFloat(row.scrapRoll) || 0;
    const theoCons = parseFloat(row.theoreticalConsumption) || 0;
    const extra = 1 + (parseFloat(alongExtra) / 100 || 0);

    const rolls = collWidth > 0 ? Math.floor(width / collWidth) - scrap : 0;
    const metersCollaretto = parseFloat((pieces * theoCons * extra).toFixed(2));
    const consumption = rolls > 0 ? parseFloat((metersCollaretto / rolls).toFixed(2)) : 0;

    return {
      rolls: rolls.toString(),
      metersCollaretto: metersCollaretto.toString(),
      consumption: consumption.toString()
    };
  };

  // Auto populate logic for bagno splitting
  const handleAutoPopulate = (data) => {
    const { collarettoTypes, sizeSplitting } = data;

    // First, remove any completely empty rows from the current table
    setTables(prev => prev.map(t => {
      if (t.id !== table.id) return t;

      // Check if we have multiple rows or if the single row is empty
      if (t.rows.length === 1) {
        const singleRow = t.rows[0];
        const hasData = singleRow.pieces || singleRow.usableWidth || singleRow.theoreticalConsumption ||
                       singleRow.collarettoWidth || singleRow.scrapRoll || singleRow.bagno;

        if (!hasData) {
          // Single empty row - we'll replace it with auto-generated rows
          console.log('Single empty row detected - will be replaced with auto-generated rows');
          return { ...t, rows: [] }; // Temporarily empty, will be filled by auto-populate
        } else {
          // Single row with data - keep it
          console.log('Single row with data - keeping it');
          return t;
        }
      } else {
        // Multiple rows - filter out empty ones
        const filteredRows = t.rows.filter(row => {
          const hasData = row.pieces || row.usableWidth || row.theoreticalConsumption ||
                         row.collarettoWidth || row.scrapRoll || row.bagno;
          return hasData;
        });

        // Keep at least one row to maintain table structure
        const finalRows = filteredRows.length > 0 ? filteredRows : [t.rows[0]];

        console.log(`Removed ${t.rows.length - finalRows.length} empty rows from along table`);

        return { ...t, rows: finalRows };
      }
    }));

    // Find matching mattress tables with same destination, fabric code and color
    const matchingMattressTables = mattressTables.filter(mattressTable =>
      mattressTable.destination === table.destination &&
      mattressTable.fabricCode === table.fabricCode &&
      mattressTable.fabricColor === table.fabricColor
    );

    console.log('Matching criteria:', {
      destination: table.destination,
      fabricCode: table.fabricCode,
      fabricColor: table.fabricColor
    });
    console.log('Found matching mattress tables:', matchingMattressTables.length);

    // Get selected sizes
    const selectedSizes = Object.keys(sizeSplitting).filter(size => sizeSplitting[size]);

    // Convert selected sizes to the format expected by the sizes field
    const applicableSizes = selectedSizes.length > 0 ? selectedSizes.join('-') : 'ALL';

    // Collect all unique bagnos from matching mattress tables in order of appearance
    const bagnoData = {};
    const bagnoOrder = []; // Track the order of bagno appearance

    matchingMattressTables.forEach(mattressTable => {
      mattressTable.rows.forEach(row => {
        if (row.bagno && row.bagno.trim() !== '') {
          if (!bagnoData[row.bagno]) {
            bagnoData[row.bagno] = {
              bagno: row.bagno,
              totalPieces: 0,
              sizes: {}
            };
            // Add to order list when first encountered
            bagnoOrder.push(row.bagno);
          }

          // Debug logging
          console.log('Processing row:', {
            bagno: row.bagno,
            piecesPerSize: row.piecesPerSize,
            layers: row.layers,
            selectedSizes
          });

          const layers = parseInt(row.layers) || 0;

          // Calculate pieces: if no sizes selected, use ALL sizes
          const sizesToProcess = selectedSizes.length > 0 ? selectedSizes : Object.keys(row.piecesPerSize || {});

          console.log(`Processing ${sizesToProcess.length > 0 ? sizesToProcess.join(', ') : 'no'} sizes for bagno ${row.bagno}`);

          sizesToProcess.forEach(size => {
            const piecesPerLayer = parseInt(row.piecesPerSize?.[size] || 0);
            const totalPiecesForSize = piecesPerLayer * layers;

            console.log(`Size ${size}: ${piecesPerLayer} pieces/layer × ${layers} layers = ${totalPiecesForSize} total pieces`);

            if (totalPiecesForSize > 0) {
              bagnoData[row.bagno].totalPieces += totalPiecesForSize;
              if (!bagnoData[row.bagno].sizes[size]) {
                bagnoData[row.bagno].sizes[size] = 0;
              }
              bagnoData[row.bagno].sizes[size] += totalPiecesForSize;
            }
          });
        }
      });
    });

    // Create new along rows for each bagno in order of appearance
    bagnoOrder.forEach((bagno, index) => {
      const bagnoInfo = bagnoData[bagno];
      if (bagnoInfo.totalPieces > 0) {
        // Add a new row for this bagno
        handleAddRowAlong(table.id);

        // Update the newly created row with bagno data and collaretto types
        setTables(prev => prev.map(t => {
          if (t.id !== table.id) return t;

          const updatedRows = [...t.rows];
          const lastRowIndex = updatedRows.length - 1;

          if (lastRowIndex >= 0) {
            const baseRow = {
              ...updatedRows[lastRowIndex],
              pieces: bagnoInfo.totalPieces.toString(),
              usableWidth: collarettoTypes.usableWidth,
              theoreticalConsumption: collarettoTypes.grossLength, // Note: grossLength maps to theoreticalConsumption
              collarettoWidth: collarettoTypes.collarettoWidth,
              scrapRoll: collarettoTypes.scrapRolls,
              bagno: bagnoInfo.bagno,
              sizes: applicableSizes // ✅ Apply selected sizes from size splitting
            };

            // Calculate automatic fields
            const calculatedFields = calculateAlongFields(baseRow, t.alongExtra);

            updatedRows[lastRowIndex] = {
              ...baseRow,
              ...calculatedFields
            };
          }

          return { ...t, rows: updatedRows };
        }));
      }
    });

    // If we had no rows after cleanup, make sure we have at least one row
    setTables(prev => prev.map(t => {
      if (t.id !== table.id) return t;

      if (t.rows.length === 0) {
        // Add a basic empty row to maintain table structure
        handleAddRowAlong(table.id);
      }

      return t;
    }));

    setUnsavedChanges(true);
    console.log('Created along rows for bagnos in order:', bagnoOrder);
    console.log('Bagno data summary:', bagnoData);
  };



  return (
    <Box p={1}>
      {/* Fabric Information */}
      <Grid container spacing={2}>
        {/* Fabric Type */}
        <Grid item xs={3} sm={2} md={1.2}>
          <Autocomplete
            options={fabricTypeOptions}
            getOptionLabel={(option) => option}
            value={table.fabricType || null}
            disabled={!isTableEditable(table)}
            onChange={(event, newValue) => {
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricType: newValue } : t
                )
              );
              setUnsavedChanges(true);
            }}
            renderInput={(params) => <TextField {...params} label={t('orderPlanning.fabricType', 'Fabric Type')} variant="outlined" />}
            sx={{ width: '100%', minWidth: '60px', "& .MuiAutocomplete-input": { fontWeight: 'normal' } }}
          />
        </Grid>

        {/* Fabric Code */}
        <Grid item xs={3} sm={2} md={1.8}>
          <TextField
            label={t('orderPlanning.fabricCode', 'Fabric Code')}
            variant="outlined"
            value={table.fabricCode || ""}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().slice(0, 8);
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricCode: value } : t
                )
              );
              setUnsavedChanges(true);
            }}
            sx={{ width: '100%', minWidth: '60px', "& input": { fontWeight: "normal" } }}
          />
        </Grid>

        {/* Fabric Color */}
        <Grid item xs={3} sm={2} md={1.5}>
          <ColorFieldWithDescription
            label={t('orderPlanning.fabricColor', 'Fabric Color')}
            value={table.fabricColor || ""}
            readOnly={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
              setTables(prev =>
                prev.map(t =>
                  t.id === table.id ? { ...t, fabricColor: value } : t
                )
              );
              setUnsavedChanges(true);
            }}
            debounceMs={400}
            minCharsForSearch={3}
            sx={{ width: '100%', minWidth: '60px' }}
          />
        </Grid>

        {/* Extra % */}
        <Grid item xs={2} sm={1.5} md={1}>
          <TextField
            label="Extra %"
            variant="outlined"
            value={table.alongExtra || "3"}
            disabled={!isTableEditable(table)}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 2);
              handleAlongExtraChange(table.id, value);
              setUnsavedChanges(true);
            }}
            sx={{ width: '100%', minWidth: '60px', "& input": { fontWeight: "normal" } }}
          />
        </Grid>

        {/* Magic Wand Auto Populate Icon */}
        {hasMatchingFabric && isTableEditable(table) && (
          <Grid item xs={1} sm={0.5} md={0.5}>
            <IconButton
              onClick={() => setAutoPopulateDialogOpen(true)}
              sx={{
                color: 'secondary.main',
                '&:hover': {
                  color: 'secondary.dark',
                  backgroundColor: 'secondary.light',
                  opacity: 0.1
                }
              }}
            >
              <AutoFixHigh />
            </IconButton>
          </Grid>
        )}
      </Grid>

      {/* Auto Populate Dialog */}
      <AlongAutoPopulateDialog
        open={autoPopulateDialogOpen}
        onClose={() => setAutoPopulateDialogOpen(false)}
        orderSizes={orderSizes}
        onApply={(data) => {
          // Handle the auto populate logic here
          handleAutoPopulate(data);
          setAutoPopulateDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default AlongGroupCard;
