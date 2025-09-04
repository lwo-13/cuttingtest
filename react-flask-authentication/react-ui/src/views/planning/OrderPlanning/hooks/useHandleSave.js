import { useState } from 'react';
import axios from 'utils/axiosInstance';
import { getCombinationKey } from 'utils/productionCenterConfig';

const useHandleSave = ({
  tables,
  adhesiveTables,
  alongTables,
  weftTables,
  biasTables,
  padPrintInfo,
  manualPattern,
  manualColor,
  selectedOrder,
  selectedStyle,
  selectedColorCode,
  selectedSeason,
  username,
  brand,
  deletedMattresses,
  deletedAdhesive,
  deletedAlong,
  deletedWeft,
  deletedBias,
  setDeletedMattresses,
  setDeletedAdhesive,
  setDeletedAlong,
  setDeletedWeft,
  setDeletedBias,
  deletedTableIds,
  setDeletedTableIds,
  deletedCombinations,
  setDeletedCombinations,
  deletedRowIds,
  setDeletedRowIds,
  setErrorMessage,
  setOpenError,
  setSuccessMessage,
  setOpenSuccess,
  setUnsavedChanges,
  commentData,
  auditRefetchFunctionRef,
  styleCommentData,
  productionCenterTabsRef
}) => {
  const [saving, setSaving] = useState(false);

  // Sequential delete function to avoid deadlocks
  const deleteSequentially = async (items, deleteFunction, itemType) => {
    const results = [];
    for (const item of items) {
      try {
        await deleteFunction(item);
        results.push({ item, success: true });
        // Small delay between deletes to reduce database pressure
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({ item, success: false, error });
      }
    }
    return results;
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      // Helper function to get last 6 digits of order ID
      const getOrderSuffix = (orderId) => {
        const orderStr = String(orderId);
        return orderStr.length > 6 ? orderStr.slice(-6) : orderStr;
      };

      const newMattressNames = new Set();
      const newAdhesiveNames = new Set();
      const newAlongNames = new Set();
      const newWeftNames = new Set();
      const newBiasNames = new Set();
      const payloads = [];
      const adhesivePayloads = [];
      const allongPayloads = [];
      const weftPayloads = [];
      const biasPayloads = [];
      let invalidRow = null;
      let invalidAdhesiveRow = null;
      let invalidAlongRow = null;
      let invalidWeftRow = null;
      let invalidBiasRow = null;

      // Performance tracking
      let skippedMattressRows = 0;
      let skippedAdhesiveRows = 0;

      // ✅ Check for missing mandatory fields
      const hasInvalidData = tables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.spreadingMethod) {
          invalidRow = `Mattress Group ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color, or Spreading Method)`;
          return true; // 🚨 Stop processing immediately
        }

        // ✅ Check for missing production center fields
        if (!table.productionCenter || !table.cuttingRoom || !table.destination) {
          invalidRow = `Mattress Group ${tableIndex + 1} is missing Production Center, Cutting Room, or Destination`;
          return true; // 🚨 Stop processing immediately
        }

        return table.rows.some((row, rowIndex) => {
          if (!row.markerName || !row.layers || parseInt(row.layers) <= 0) {
            invalidRow = `Mattress Group ${tableIndex + 1}, Row ${rowIndex + 1} is missing a Marker or Layers`;
            return true; // 🚨 Stops processing if invalid
          }
          return false;
        });
      });

      // ✅ Check for duplicate production center combinations within the same table type
      // Combination key includes: cutting room + destination + fabric type
      let hasDuplicateCombinations = false;

      // Check mattress tables (within mattress tables only)
      const mattressCombinations = new Set();
      hasDuplicateCombinations = tables.some((table, tableIndex) => {
        const combinationKey = `${table.cuttingRoom}+${table.destination}+${table.fabricType}`;

        if (mattressCombinations.has(combinationKey)) {
          invalidRow = `Mattress Group ${tableIndex + 1} has a duplicate Production Center combination (${table.cuttingRoom} + ${table.destination} + ${table.fabricType}). Each combination can only be used once within mattress tables.`;
          return true;
        }
        mattressCombinations.add(combinationKey);
        return false;
      });

      // Check adhesive tables (within adhesive tables only)
      if (!hasDuplicateCombinations) {
        const adhesiveCombinations = new Set();
        hasDuplicateCombinations = adhesiveTables.some((table, tableIndex) => {
          const combinationKey = `${table.cuttingRoom}+${table.destination}+${table.fabricType}`;

          if (adhesiveCombinations.has(combinationKey)) {
            invalidAdhesiveRow = `Adhesive Group ${tableIndex + 1} has a duplicate Production Center combination (${table.cuttingRoom} + ${table.destination} + ${table.fabricType}). Each combination can only be used once within adhesive tables.`;
            return true;
          }
          adhesiveCombinations.add(combinationKey);
          return false;
        });
      }

      // Check along tables (within along tables only)
      if (!hasDuplicateCombinations) {
        const alongCombinations = new Set();
        hasDuplicateCombinations = alongTables.some((table, tableIndex) => {
          const combinationKey = `${table.cuttingRoom}+${table.destination}+${table.fabricType}`;

          if (alongCombinations.has(combinationKey)) {
            invalidAlongRow = `Collaretto Along ${tableIndex + 1} has a duplicate Production Center combination (${table.cuttingRoom} + ${table.destination} + ${table.fabricType}). Each combination can only be used once within along tables.`;
            return true;
          }
          alongCombinations.add(combinationKey);
          return false;
        });
      }

      // Check weft tables (within weft tables only)
      if (!hasDuplicateCombinations) {
        const weftCombinations = new Set();
        hasDuplicateCombinations = weftTables.some((table, tableIndex) => {
          const combinationKey = `${table.cuttingRoom}+${table.destination}+${table.fabricType}`;

          if (weftCombinations.has(combinationKey)) {
            invalidWeftRow = `Collaretto Weft ${tableIndex + 1} has a duplicate Production Center combination (${table.cuttingRoom} + ${table.destination} + ${table.fabricType}). Each combination can only be used once within weft tables.`;
            return true;
          }
          weftCombinations.add(combinationKey);
          return false;
        });
      }

      // Check bias tables (within bias tables only)
      if (!hasDuplicateCombinations) {
        const biasCombinations = new Set();
        hasDuplicateCombinations = biasTables.some((table, tableIndex) => {
          const combinationKey = `${table.cuttingRoom}+${table.destination}+${table.fabricType}`;

          if (biasCombinations.has(combinationKey)) {
            invalidBiasRow = `Collaretto Bias ${tableIndex + 1} has a duplicate Production Center combination (${table.cuttingRoom} + ${table.destination} + ${table.fabricType}). Each combination can only be used once within bias tables.`;
            return true;
          }
          biasCombinations.add(combinationKey);
          return false;
        });
      }

      // 🚨 Show Error Message If Validation Fails
      if (hasInvalidData || hasDuplicateCombinations) {
        const errorMessage = invalidRow || invalidAdhesiveRow || invalidAlongRow || invalidWeftRow || invalidBiasRow;
        setErrorMessage(errorMessage);
        setOpenError(true);
        setSaving(false);
        return; // ✅ Prevents saving invalid data
      }

      // ✅ Check for missing mandatory fields in adhesive tables
      const hasInvalidAdhesiveData = adhesiveTables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.spreadingMethod) {
          invalidAdhesiveRow = `Adhesive Group ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color, or Spreading Method)`;
          return true; // 🚨 Stop processing immediately
        }

        // ✅ Check for missing production center fields
        if (!table.productionCenter || !table.cuttingRoom || !table.destination) {
          invalidAdhesiveRow = `Adhesive Group ${tableIndex + 1} is missing Production Center, Cutting Room, or Destination`;
          return true; // 🚨 Stop processing immediately
        }

        return table.rows.some((row, rowIndex) => {
          if (!row.markerName || !row.layers || parseInt(row.layers) <= 0) {
            invalidAdhesiveRow = `Adhesive Group ${tableIndex + 1}, Row ${rowIndex + 1} is missing a Marker or Layers`;
            return true; // 🚨 Stops processing if invalid
          }
          return false;
        });
      });

      // 🚨 Error Handling for Adhesive
      if (hasInvalidAdhesiveData) {
        setErrorMessage(invalidAdhesiveRow);
        setOpenError(true);
        setSaving(false);
        return;
      }

      const hasInvalidAlongData = alongTables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.alongExtra) {
          invalidAlongRow = `Collaretto Along ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color or Extra)`;
          return true;
        }

        // ✅ Check for missing production center fields
        if (!table.productionCenter || !table.cuttingRoom || !table.destination) {
          invalidAlongRow = `Collaretto Along ${tableIndex + 1} is missing Production Center, Cutting Room, or Destination`;
          return true;
        }

        return table.rows.some((row, rowIndex) => {
          if (!row.pieces || !row.usableWidth || !row.theoreticalConsumption || !row.collarettoWidth || row.scrapRoll === null || row.scrapRoll === undefined || row.scrapRoll === '') {
            invalidAlongRow = `Collaretto Along ${tableIndex + 1}, Row ${rowIndex + 1} is missing required fields)`;
            return true;
          }
          return false;
        });
      });

      // 🚨 Error Handling
      if (hasInvalidAlongData) {
        setErrorMessage(invalidAlongRow);
        setOpenError(true);
        setSaving(false);
        return;
      }

      const hasInvalidWeftData = weftTables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.weftExtra) {
          invalidWeftRow = `Collaretto Weft ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color, or Extra)`;
          return true;
        }

        // ✅ Check for missing production center fields
        if (!table.productionCenter || !table.cuttingRoom || !table.destination) {
          invalidWeftRow = `Collaretto Weft ${tableIndex + 1} is missing Production Center, Cutting Room, or Destination`;
          return true;
        }

        return table.rows.some((row, rowIndex) => {
          if (!row.pieces || !row.usableWidth || !row.grossLength || !row.rewoundWidth || !row.collarettoWidth || row.scrapRoll === null || row.scrapRoll === undefined || row.scrapRoll === '' || !row.pcsSeamtoSeam) {
            invalidWeftRow = `Collaretto Weft ${tableIndex + 1}, Row ${rowIndex + 1} is missing required fields`;
            return true;
          }
          return false;
        });
      });

      // 🚨 Error Handling for Weft
      if (hasInvalidWeftData) {
        setErrorMessage(invalidWeftRow);
        setOpenError(true);
        setSaving(false);
        return;
      }

      const hasInvalidBiasData = biasTables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor) {
          invalidBiasRow = `Collaretto Bias ${tableIndex + 1} is missing required fields (Fabric Type, Code, or Color)`;
          return true;
        }

        // ✅ Check for missing production center fields
        if (!table.productionCenter || !table.cuttingRoom || !table.destination) {
          invalidBiasRow = `Collaretto Bias ${tableIndex + 1} is missing Production Center, Cutting Room, or Destination`;
          return true;
        }

        return table.rows.some((row, rowIndex) => {
          if (
            !row.pieces || !row.usableWidth || !row.grossLength ||
            !row.collarettoWidth || row.scrapRoll === null || row.scrapRoll === undefined || row.scrapRoll === '' || !row.pcsSeamtoSeam
          ) {
            invalidBiasRow = `Collaretto Bias ${tableIndex + 1}, Row ${rowIndex + 1} is missing required fields`;
            return true;
          }
          return false;
        });
      });

      // 🚨 Error Handling for Bias
      if (hasInvalidBiasData) {
        setErrorMessage(invalidBiasRow);
        setOpenError(true);
        setSaving(false);
        return;
      }

      // ❗ Require manual pad print input if no padPrintInfo is available
      if (selectedOrder && !padPrintInfo) {
        const isPatternMissing = !manualPattern || manualPattern.trim() === '';
        const isColorMissing = !manualColor || manualColor.trim() === '';

        const isPatternNo = manualPattern?.trim().toUpperCase() === 'NO';
        const isColorNo = manualColor?.trim().toUpperCase() === 'NO';

        if ((isPatternMissing || isColorMissing) && !(isPatternNo && isColorNo)) {
          setErrorMessage("Please select a Pad Print pattern and color, or set both to 'NO'.");
          setOpenError(true);
          return;
        }
      }

      // ✅ Proceed with valid mattress processing
      tables.forEach((table) => {
        table.rows.forEach((row) => {
          // ✅ Skip locked rows (not editable) to improve performance
          if (row.isEditable === false) {
            skippedMattressRows++;
            return;
          }

          // ✅ Always generate mattress name based on current spreading to handle spreading changes
          const itemTypeCode = table.spreading === "MANUAL" ? "MS" : "AS";
          const combinationKey = getCombinationKey(table.cuttingRoom, table.destination);
          const orderSuffix = getOrderSuffix(selectedOrder.id);

          // Build mattress name: KEY-ORDER-ITEMTYPE-FABRICTYPE-SEQUENCE
          const mattressName = combinationKey
            ? `${combinationKey}-${orderSuffix}-${itemTypeCode}-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`
            : `${orderSuffix}-${itemTypeCode}-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`; // Fallback if no combination key

          newMattressNames.add(mattressName); // ✅ Track UI rows

          // ✅ Ensure numerical values are properly handled (convert empty strings to 0)
          const layers = parseFloat(row.layers) || 0;
          const markerLength = parseFloat(row.markerLength) || 0;
          const lengthMattress = markerLength + (parseFloat(table.allowance) || 0); // ✅ Corrected calculation
          const consPlanned = (lengthMattress * layers).toFixed(2); // ✅ Auto-calculated

          const mattressData = {
            mattress: mattressName,
            order_commessa: selectedOrder.id,
            fabric_type: table.fabricType,
            fabric_code: table.fabricCode,
            fabric_color: table.fabricColor,
            dye_lot: row.bagno || null,
            item_type: table.spreading === "MANUAL" ? "MS" : "AS",
            spreading_method: table.spreadingMethod,

            // ✅ New fields for structure integrity
            table_id: table.id,
            row_id: row.id,
            sequence_number: row.sequenceNumber,


            layers: layers,
            length_mattress: lengthMattress,
            cons_planned: consPlanned,
            extra: parseFloat(table.allowance) || 0,
            bagno_ready: row.status === 'ready', // Save status as boolean
            marker_name: row.markerName,
            marker_width: parseFloat(row.width) || 0,
            marker_length: markerLength,
            efficiency: row.efficiency, // Add efficiency field
            operator: username
          };

          // ✅ Generate mattress_sizes data if you have row.piecesPerSize
          if (row.piecesPerSize) {
            Object.entries(row.piecesPerSize).forEach(([size, pcs_layer]) => {
              mattressData.sizes = mattressData.sizes || []; // Initialize the sizes array if not already present
              mattressData.sizes.push({
                style : selectedStyle,
                size: size,
                pcs_layer: pcs_layer,
                pcs_planned: pcs_layer * layers, // Total planned pcs
                pcs_actual: null                // Will be filled later
              });
            });
          }

          payloads.push(mattressData);
        });
      });

      // ✅ Proceed with valid adhesive processing
      adhesiveTables.forEach((table) => {
        table.rows.forEach((row) => {
          // ✅ Skip locked rows (not editable) to improve performance
          if (row.isEditable === false) {
            skippedAdhesiveRows++;
            return;
          }

          // ✅ Generate Adhesive Name with combination key (KEY-ORDER-ASA-FABRICTYPE-001, 002, ...)
          const itemTypeCode = table.spreading === "MANUAL" ? "MSA" : "ASA"; // Use ASA for adhesive instead of AS
          const combinationKey = getCombinationKey(table.cuttingRoom, table.destination);
          const orderSuffix = getOrderSuffix(selectedOrder.id);

          // Build adhesive name: KEY-ORDER-ITEMTYPE-FABRICTYPE-SEQUENCE
          const adhesiveName = combinationKey
            ? `${combinationKey}-${orderSuffix}-${itemTypeCode}-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`
            : `${orderSuffix}-${itemTypeCode}-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`; // Fallback if no combination key

          newAdhesiveNames.add(adhesiveName); // ✅ Track UI rows

          // ✅ Ensure numerical values are properly handled (convert empty strings to 0)
          const layers = parseFloat(row.layers) || 0;
          const markerLength = parseFloat(row.markerLength) || 0;
          const lengthMattress = markerLength + (parseFloat(table.allowance) || 0); // ✅ Corrected calculation
          const consPlanned = (lengthMattress * layers).toFixed(2); // ✅ Auto-calculated

          const adhesiveData = {
            mattress: adhesiveName, // Use same endpoint but with AD item type
            order_commessa: selectedOrder.id,
            fabric_type: table.fabricType,
            fabric_code: table.fabricCode,
            fabric_color: table.fabricColor,
            dye_lot: row.bagno || null,
            item_type: table.spreading === "MANUAL" ? "MSA" : "ASA", // Use ASA for adhesive
            spreading_method: table.spreadingMethod,

            // ✅ New fields for structure integrity
            table_id: table.id,
            row_id: row.id,
            sequence_number: row.sequenceNumber,

            layers: layers,
            length_mattress: lengthMattress,
            cons_planned: consPlanned,
            extra: parseFloat(table.allowance) || 0,
            bagno_ready: row.status === 'ready', // Save status as boolean
            marker_name: row.markerName,
            marker_width: parseFloat(row.width) || 0,
            marker_length: markerLength,
            efficiency: row.efficiency, // Add efficiency field
            operator: username
          };

          // ✅ Generate mattress_sizes data if you have row.piecesPerSize
          if (row.piecesPerSize) {
            Object.entries(row.piecesPerSize).forEach(([size, pcs_layer]) => {
              adhesiveData.sizes = adhesiveData.sizes || []; // Initialize the sizes array if not already present
              adhesiveData.sizes.push({
                style : selectedStyle,
                size: size,
                pcs_layer: pcs_layer,
                pcs_planned: pcs_layer * layers, // Total planned pcs
                pcs_actual: null                // Will be filled later
              });
            });
          }

          adhesivePayloads.push(adhesiveData);
        });
      });

      alongTables.forEach((table) => {
        table.rows.forEach((row) => {
          // ✅ Build unique collaretto (along) name WITH combination key and padded index
          const combinationKey = getCombinationKey(table.cuttingRoom, table.destination);
          const orderSuffix = getOrderSuffix(selectedOrder.id);
          const collarettoName = combinationKey
            ? `${combinationKey}-${orderSuffix}-CA-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`
            : `${orderSuffix}-CA-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`; // Fallback
          newAlongNames.add(collarettoName);

          // ✅ Build the payload for this row
          const payload = {
            collaretto: collarettoName,
            order_commessa: selectedOrder.id,
            fabric_type: table.fabricType,
            fabric_code: table.fabricCode,
            fabric_color: table.fabricColor,
            dye_lot: row.bagno || null,
            item_type: "CA",
            extra: parseFloat(table.alongExtra),
            applicable_sizes: row.sizes, // ✅ Send applicable_sizes to backend

            table_id: table.id,
            row_id: row.id,
            sequence_number: row.sequenceNumber,

            details: [
              {
                mattress_id: null,
                pieces: parseFloat(row.pieces) || 0,
                usable_width: parseFloat(row.usableWidth) || 0,
                roll_width: parseFloat(row.collarettoWidth) || 0,
                gross_length: parseFloat(row.theoreticalConsumption) || 0,
                scrap_rolls: parseFloat(row.scrapRoll) || 0,
                rolls_planned: parseFloat(row.rolls) || null,
                rolls_actual: null,
                cons_planned: parseFloat(row.consumption) || null,
                cons_actual: null,
                extra: parseFloat(table.alongExtra) || 0,
                total_collaretto: parseFloat(row.metersCollaretto) || 0
              }
            ]
          };

          allongPayloads.push(payload);
        });
      });

      weftTables.forEach((table) => {
        table.rows.forEach((row) => {
          // ✅ Build unique collaretto (weft) name WITH combination key and padded index
          const combinationKey = getCombinationKey(table.cuttingRoom, table.destination);
          const orderSuffix = getOrderSuffix(selectedOrder.id);
          const collarettoWeftName = combinationKey
            ? `${combinationKey}-${orderSuffix}-CW-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`
            : `${orderSuffix}-CW-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`; // Fallback
          newWeftNames.add(collarettoWeftName);

          // ✅ Use spreading value to determine item type code: ASW for automatic, MSW for manual
          const itemTypeCode = table.spreading === "MANUAL" ? "MSW" : "ASW";
          const mattressName = combinationKey
            ? `${combinationKey}-${orderSuffix}-${itemTypeCode}-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`
            : `${orderSuffix}-${itemTypeCode}-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`; // Fallback

          // ✅ Build the payload for this weft row
          const payload = {
            collaretto: collarettoWeftName,
            mattress: mattressName,
            order_commessa: selectedOrder.id,
            fabric_type: table.fabricType,
            fabric_code: table.fabricCode,
            fabric_color: table.fabricColor,
            dye_lot: row.bagno || null,
            item_type: "CW",
            spreading: table.spreading, // ✅ Send spreading info to backend
            applicable_sizes: row.sizes, // ✅ Send applicable_sizes to backend

            table_id: table.id,
            row_id: row.id,
            sequence_number: row.sequenceNumber,
            operator: username,

            details: [
              {
                pieces: parseFloat(row.pieces) || 0,
                usable_width: parseFloat(row.usableWidth) || 0,
                gross_length: parseFloat(row.grossLength) || 0,
                pcs_seam: parseFloat(row.pcsSeamtoSeam) || 0,
                rewound_width: parseFloat(row.rewoundWidth) || 0,
                roll_width: parseFloat(row.collarettoWidth) || 0,
                scrap_rolls: parseFloat(row.scrapRoll) || 0,
                rolls_planned: parseFloat(row.rolls) || null,
                rolls_actual: null,
                panels_planned: parseFloat(row.panels) || null,
                cons_planned: parseFloat(row.consumption) || null,
                cons_actual: null,
                extra: parseFloat(table.weftExtra) || 0,
                bagno_ready: row.status === 'ready'
              }
            ]
          };

          weftPayloads.push(payload);
        });
      });

      biasTables.forEach((table) => {
        table.rows.forEach((row) => {
          // ✅ Build unique collaretto (bias) name WITH combination key and padded index
          const combinationKey = getCombinationKey(table.cuttingRoom, table.destination);
          const orderSuffix = getOrderSuffix(selectedOrder.id);
          const collarettoBiasName = combinationKey
            ? `${combinationKey}-${orderSuffix}-CB-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`
            : `${orderSuffix}-CB-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`; // Fallback
          newBiasNames.add(collarettoBiasName);

          const mattressName = combinationKey
            ? `${combinationKey}-${orderSuffix}-MSB-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`
            : `${orderSuffix}-MSB-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`; // Fallback

          const payload = {
            collaretto: collarettoBiasName,
            mattress: mattressName,
            order_commessa: selectedOrder.id,
            fabric_type: table.fabricType,
            fabric_code: table.fabricCode,
            fabric_color: table.fabricColor,
            dye_lot: row.bagno || null,
            item_type: "CB",
            applicable_sizes: row.sizes, // ✅ Send applicable_sizes to backend

            table_id: table.id,
            row_id: row.id,
            sequence_number: row.sequenceNumber,
            operator: username,

            details: [
              {
                pieces: parseFloat(row.pieces) || 0,
                total_width: parseFloat(row.usableWidth) || 0,
                gross_length: parseFloat(row.grossLength) || 0,
                pcs_seam: parseFloat(row.pcsSeamtoSeam) || 0,
                panel_length: parseFloat(row.panelLength) || 0,
                roll_width: parseFloat(row.collarettoWidth) || 0,
                scrap_rolls: parseFloat(row.scrapRoll) || 0,
                rolls_planned: parseFloat(row.rolls) || null,
                rolls_actual: null,
                panels_planned: parseFloat(row.panels) || null,
                cons_planned: parseFloat(row.consumption) || null,
                cons_actual: null,
                extra: parseFloat(table.biasExtra) || 0,
                bagno_ready: row.status === 'ready'
              }
            ]
          };

          biasPayloads.push(payload);
        });
      });

      // ✅ Send Update Requests
      const saveMattresses = () => {
        return Promise.all(payloads.map(payload =>
          axios.post('/mattress/add_mattress_row', payload)
            .then(response => {
              if (response.data.success) {
                return true;
              } else {
                return false;
              }
            })
            .catch(error => {
              return false;
            })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("❌ Some mattresses failed to save.");
        });
      };

      // ✅ Send Adhesive Update Requests
      const saveAdhesives = () => {
        return Promise.all(adhesivePayloads.map(payload =>
          axios.post('/mattress/add_mattress_row', payload) // Use same endpoint as mattress
            .then(response => {
              if (response.data.success) {
                return true;
              } else {
                return false;
              }
            })
            .catch(error => {
              return false;
            })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("❌ Some adhesives failed to save.");
        });
      };

      // ✅ Send Along Update Requests
      const saveAlongRows = () => {
        return Promise.all(allongPayloads.map(payload =>
          axios.post('/collaretto/add_along_row', payload)
            .then(response => {
              if (response.data.success) {
                return true;
              } else {
                return false;
              }
            })
            .catch(error => {
              return false;
            })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("❌ Some along rows failed to save.");
        });
      };

      // ✅ Send Weft Update Requests
      const saveWeftRows = () => {
        return Promise.all(weftPayloads.map(payload =>
          axios.post('/collaretto/add_weft_row', payload)
            .then(response => {
              if (response.data.success) {
                return true;
              } else {
                return false;
              }
            })
            .catch(error => {
              return false;
            })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("Some weft rows failed to save.");
        });
      };

      const saveBiasRows = () => {
        return Promise.all(biasPayloads.map(payload =>
          axios.post('/collaretto/add_bias_row', payload)
            .then(response => {
              if (response.data.success) {
                return true;
              } else {
                return false;
              }
            })
            .catch(error => {
              return false;
            })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("Some bias rows failed to save.");
        });
      };

      if (!padPrintInfo && manualPattern && manualColor) {
        try {
          await axios.post('/padprint/create', {
            brand: brand?.toUpperCase(),
            style: selectedStyle,
            color: selectedColorCode,
            season: selectedSeason,
            pattern: manualPattern,
            padprint_color: manualColor
          });
        } catch (error) {
          if (error.response?.status === 409) {
            // Pad Print entry already exists, skip creation
          } else {
            setErrorMessage("⚠️ Failed to save manual Pad Print info. Please try again.");
            setOpenError(true);
            return;
          }
        }
      }



      // ✅ Save production center combinations first
      const saveProductionCenterCombinations = () => {
        const combinations = productionCenterTabsRef?.current?.getCombinations?.();

        if (!combinations || combinations.length === 0) {
          return Promise.resolve();
        }

        return axios.post('/orders/production_center_combinations/save', {
          order_commessa: selectedOrder.id,
          combinations: combinations
        }).then(response => {
          if (response.data.success) {
            return true;
          } else {
            return false;
          }
        }).catch(error => {
          throw error;
        });
      };

      // ✅ Save production center data for all table types using unified endpoint
      const saveAllProductionCenters = () => {
        // Combine all tables with their respective table types
        const allTables = [
          ...tables.map(table => ({ ...table, tableType: 'MATTRESS' })),
          ...adhesiveTables.map(table => ({ ...table, tableType: 'ADHESIVE' })),
          ...alongTables.map(table => ({ ...table, tableType: 'ALONG' })),
          ...weftTables.map(table => ({ ...table, tableType: 'WEFT' })),
          ...biasTables.map(table => ({ ...table, tableType: 'BIAS' }))
        ];

        return Promise.all(allTables.map(table =>
          axios.post('/mattress/production_center/save', {
            table_id: table.id,
            table_type: table.tableType,
            production_center: table.productionCenter || null,
            cutting_room: table.cuttingRoom || null,
            destination: table.destination || null
          })
          .then(response => {
            if (response.data.success) {
              return true;
            } else {
              return false;
            }
          })
          .catch(error => {
            return false;
          })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("❌ Some table production centers failed to save.");
        });
      };

      saveProductionCenterCombinations()
        .then(() => saveAllProductionCenters())
        .then(() => saveMattresses())
        .then(() => saveAdhesives())
        .then(() => saveAlongRows())
        .then(() => saveWeftRows())
        .then(() => saveBiasRows())
        .then(async () => {
          // ✅ Delete by row_id first (more reliable)
          if (deletedRowIds && deletedRowIds.length > 0) {
            const results = await deleteSequentially(
              deletedRowIds,
              (rowId) => axios.delete(`/mattress/delete_by_row_id/${rowId}`),
              'mattress by row_id'
            );

            const successfulDeletes = results
              .filter(r => r.success)
              .map(r => r.item);

            // Remove successfully deleted row IDs from the list
            if (setDeletedRowIds) {
              setDeletedRowIds(prev =>
                prev.filter(rowId => !successfulDeletes.includes(rowId))
              );
            }
          }

          // ✅ Fallback: Delete by name for any remaining records (legacy support)
          const mattressesToDelete = deletedMattresses.filter(mattress => !newMattressNames.has(mattress));

          if (mattressesToDelete.length > 0) {
            const results = await deleteSequentially(
              mattressesToDelete,
              (mattress) => axios.delete(`/mattress/delete/${mattress}`),
              'mattress by name'
            );

            const successfulDeletes = results
              .filter(r => r.success)
              .map(r => r.item);

            setDeletedMattresses(prev =>
              prev.filter(name => !successfulDeletes.includes(name))
            );
          }
        })
        .then(async () => {
          // ✅ Delete Only Adhesives That Were Removed from UI (Sequential)
          const adhesivesToDelete = deletedAdhesive.filter(adhesive => !newAdhesiveNames.has(adhesive));

          if (adhesivesToDelete.length > 0) {
            const results = await deleteSequentially(
              adhesivesToDelete,
              (adhesive) => axios.delete(`/mattress/delete/${adhesive}`), // Use same endpoint as mattress
              'adhesive'
            );

            const successfulDeletes = results
              .filter(r => r.success)
              .map(r => r.item);

            setDeletedAdhesive(prev =>
              prev.filter(name => !successfulDeletes.includes(name))
            );
          }
        })
        .then(async () => {
          // ✅ Delete Only Along Rows Removed from the UI (Sequential)
          const alongToDelete = deletedAlong.filter(along => !newAlongNames.has(along));

          if (alongToDelete.length > 0) {
            const results = await deleteSequentially(
              alongToDelete,
              (along) => axios.delete(`/collaretto/delete/${along}`),
              'along row'
            );

            const successfulDeletes = results
              .filter(r => r.success)
              .map(r => r.item);

            setDeletedAlong(prev =>
              prev.filter(name => !successfulDeletes.includes(name))
            );
          }
        })
        .then(async () => {
          // ✅ Delete collaretto rows by row_id first (more reliable)
          // Note: deletedRowIds contains row IDs from all table types (mattress, weft, bias, along)
          // The backend endpoints will handle the appropriate deletion based on what exists
          if (deletedRowIds && deletedRowIds.length > 0) {
            const results = await deleteSequentially(
              deletedRowIds,
              (rowId) => axios.delete(`/collaretto/delete_by_row_id/${rowId}`),
              'collaretto by row_id'
            );

            const successfulDeletes = results
              .filter(r => r.success)
              .map(r => r.item);

            // Note: We already cleared deletedRowIds in the mattress section above
            // This is just for collaretto records that might exist with the same row_ids
          }

          // ✅ Fallback: Delete weft rows by name for any remaining records
          const weftToDelete = deletedWeft.filter(weft => !newWeftNames.has(weft));

          if (weftToDelete.length > 0) {
            const results = await deleteSequentially(
              weftToDelete,
              (weft) => axios.delete(`/collaretto/delete_weft_bias/${weft}`),
              'weft row by name'
            );

            const successfulDeletes = results
              .filter(r => r.success)
              .map(r => r.item);

            setDeletedWeft(prev =>
              prev.filter(name => !successfulDeletes.includes(name))
            );
          }
        })
        .then(async () => {
          // ✅ Fallback: Delete bias rows by name for any remaining records
          const biasToDelete = deletedBias.filter(bias => !newBiasNames.has(bias));

          if (biasToDelete.length > 0) {
            const results = await deleteSequentially(
              biasToDelete,
              (bias) => axios.delete(`/collaretto/delete_weft_bias/${bias}`),
              'bias row by name'
            );

            const successfulDeletes = results
              .filter(r => r.success)
              .map(r => r.item);

            setDeletedBias(prev =>
              prev.filter(name => !successfulDeletes.includes(name))
            );
          }
        })
        .then(async () => {
          // ✅ Clean up production center entries for deleted tables
          if (deletedTableIds && deletedTableIds.length > 0) {
            const cleanupResults = await deleteSequentially(
              deletedTableIds,
              (tableId) => axios.delete(`/mattress/production_center/delete/${tableId}`),
              'production center entry'
            );

            // Clear the deleted table IDs after cleanup
            if (setDeletedTableIds) {
              setDeletedTableIds([]);
            }
          }
        })
        .then(async () => {
          // ✅ Delete production center combinations from backend
          if (deletedCombinations && deletedCombinations.length > 0) {
            const combinationDeleteResults = await deleteSequentially(
              deletedCombinations,
              (combinationId) => axios.delete(`/orders/production_center_combinations/delete/${selectedOrder.id}/${combinationId}`),
              'production center combination'
            );

            const successfulDeletes = combinationDeleteResults
              .filter(r => r.success)
              .map(r => r.item);

            // Clear the deleted combinations tracking for successfully deleted items
            if (setDeletedCombinations) {
              setDeletedCombinations(prev =>
                prev.filter(combinationId => !successfulDeletes.includes(combinationId))
              );
            }
          }
        })
        .then(() => {
          // ✅ Save all comments that have changes (including deletions)
          const commentPromises = [];

          if (commentData && selectedOrder) {
            Object.values(commentData).forEach(comment => {
              if (comment && comment.hasChanges) {
                const commentPromise = axios.post('/orders/comments/save', {
                  order_commessa: selectedOrder.id,
                  combination_id: comment.combination_id,
                  comment_text: comment.comment_text  // Empty string for deletions
                }).then(response => {
                  if (response.data.success) {
                    // Reset comment state
                    if (comment.resetState) {
                      comment.resetState();
                    }
                  }
                }).catch(error => {
                  // Error handling for comment save
                });

                commentPromises.push(commentPromise);
              }
            });
          }

          return Promise.all(commentPromises);
        })
        .then(async () => {
          // ✅ Save style comment data if available
          if (styleCommentData?.saveFunction && styleCommentData?.hasUnsavedChanges) {
            try {
              const styleResult = await styleCommentData.saveFunction();
              // Don't fail the entire save operation for style comment issues
            } catch (error) {
              // Don't fail the entire save operation for style comment issues
            }
          }

          // ✅ Update audit tracking for the order
          if (selectedOrder?.id && username) {
            try {
              await axios.post('/orders/audit/update', {
                order_commessa: selectedOrder.id,
                username: username
              });

              // ✅ Refresh audit info in the UI immediately
              if (auditRefetchFunctionRef?.current) {
                auditRefetchFunctionRef.current();
              }
            } catch (error) {
              // Don't fail the entire save operation for audit tracking issues
            }
          }
        })
        .then(() => {
          setDeletedAlong([]);
          setDeletedWeft([]);
          setDeletedBias([]);
          if (setDeletedRowIds) {
            setDeletedRowIds([]);
          }
          setUnsavedChanges(false);

          setSuccessMessage("Saving completed successfully!");
          setOpenSuccess(true);
          setSaving(false);
        })
        .catch((error) => {
          setErrorMessage("⚠️ An error occurred while saving. Please try again.");
          setOpenError(true);
          setSaving(false);
        });

    } catch (error) {
      setErrorMessage("⚠️ An error occurred while saving. Please try again.");
      setOpenError(true);
      setSaving(false);
    }
  };

  return {
    saving,
    handleSave
  };
};

export default useHandleSave;