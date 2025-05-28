import { useState } from 'react';
import axios from 'utils/axiosInstance';

const useHandleSave = ({
  tables,
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
  selectedProductionCenter,
  selectedCuttingRoom,
  selectedDestination,
  username,
  brand,
  deletedMattresses,
  deletedAlong,
  deletedWeft,
  deletedBias,
  setDeletedMattresses,
  setDeletedAlong,
  setDeletedWeft,
  setDeletedBias,
  setErrorMessage,
  setOpenError,
  setSuccessMessage,
  setOpenSuccess,
  setUnsavedChanges
}) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newMattressNames = new Set();
      const newAlongNames = new Set();
      const newWeftNames = new Set();
      const newBiasNames = new Set();
      const payloads = [];
      const allongPayloads = [];
      const weftPayloads = [];
      const biasPayloads = [];
      let invalidRow = null;
      let invalidAlongRow = null;
      let invalidWeftRow = null;
      let invalidBiasRow = null;

      // ✅ Check for missing mandatory fields
      const hasInvalidData = tables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.spreadingMethod) {
          invalidRow = `Mattress Group ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color, or Spreading Method)`;
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

      // 🚨 Show Error Message If Validation Fails
      if (hasInvalidData) {
        setErrorMessage(invalidRow);
        setOpenError(true);
        return; // ✅ Prevents saving invalid data
      }

      const hasInvalidAlongData = alongTables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.alongExtra) {
          invalidAlongRow = `Collaretto Along ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color or Extra)`;
          return true;
        }

        return table.rows.some((row, rowIndex) => {
          if (!row.pieces || !row.usableWidth || !row.theoreticalConsumption || !row.collarettoWidth || !row.scrapRoll) {
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
        return;
      }

      const hasInvalidWeftData = weftTables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor || !table.weftExtra) {
          invalidWeftRow = `Collaretto Weft ${tableIndex + 1} is missing required fields (Fabric Type, Code, Color, or Extra)`;
          return true;
        }

        return table.rows.some((row, rowIndex) => {
          if (!row.pieces || !row.usableWidth || !row.grossLength || !row.rewoundWidth || !row.collarettoWidth || !row.scrapRoll || !row.pcsSeamtoSeam) {
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
        return;
      }

      const hasInvalidBiasData = biasTables.some((table, tableIndex) => {
        if (!table.fabricType || !table.fabricCode || !table.fabricColor) {
          invalidBiasRow = `Collaretto Bias ${tableIndex + 1} is missing required fields (Fabric Type, Code, or Color)`;
          return true;
        }

        return table.rows.some((row, rowIndex) => {
          if (
            !row.pieces || !row.totalWidth || !row.grossLength ||
            !row.rewoundWidth || !row.collarettoWidth || !row.scrapRoll || !row.pcsSeamtoSeam
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

      // ❗ Require Production Center and Cutting Room Info
      if (!selectedProductionCenter || !selectedCuttingRoom) {
        setErrorMessage("Please select the Production Center and Cutting Room.");
        setOpenError(true);
        return;
      }


      // ✅ Proceed with valid mattress processing
      tables.forEach((table) => {
        table.rows.forEach((row) => {

          // ✅ Generate Mattress Name (ORDER-AS-FABRICTYPE-001, 002, ...)
          const itemTypeCode = table.spreading === "MANUAL" ? "MS" : "AS";
          const mattressName = `${selectedOrder}-${itemTypeCode}-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`;

          newMattressNames.add(mattressName); // ✅ Track UI rows

          // ✅ Ensure numerical values are properly handled (convert empty strings to 0)
          const layers = parseFloat(row.layers) || 0;
          const markerLength = parseFloat(row.markerLength) || 0;
          const lengthMattress = markerLength + (parseFloat(table.allowance) || 0); // ✅ Corrected calculation
          const consPlanned = (lengthMattress * layers).toFixed(2); // ✅ Auto-calculated

          const mattressData = {
            mattress: mattressName,
            order_commessa: selectedOrder,
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
            marker_name: row.markerName,
            marker_width: parseFloat(row.width) || 0,
            marker_length: markerLength,
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

      alongTables.forEach((table) => {
        table.rows.forEach((row) => {
          // ✅ Build unique collaretto (along) name WITH padded index
          const collarettoName = `${selectedOrder}-CA-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`;
          newAlongNames.add(collarettoName);

          // ✅ Build the payload for this row
          const payload = {
            collaretto: collarettoName,
            order_commessa: selectedOrder,
            fabric_type: table.fabricType,
            fabric_code: table.fabricCode,
            fabric_color: table.fabricColor,
            dye_lot: row.bagno || null,
            item_type: "CA",
            extra: parseFloat(table.alongExtra),

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
          // ✅ Build unique collaretto (weft) name WITH padded index
          const collarettoWeftName = `${selectedOrder}-CW-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`;
          newWeftNames.add(collarettoWeftName);

          const mattressName = `${selectedOrder}-ASW-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`;

          // ✅ Build the payload for this weft row
          const payload = {
            collaretto: collarettoWeftName,
            mattress: mattressName,
            order_commessa: selectedOrder,
            fabric_type: table.fabricType,
            fabric_code: table.fabricCode,
            fabric_color: table.fabricColor,
            dye_lot: row.bagno || null,
            item_type: "CW",

            table_id: table.id,
            row_id: row.id,
            sequence_number: row.sequenceNumber,
            operator: username,

            details: [
              {
                pieces: parseFloat(row.pieces) || 0,
                usable_width: parseFloat(row.usableWidth) || 0,
                gross_length: parseFloat(row.grossLength) || 0,
                pcs_seam: Math.floor(parseFloat(row.pcsSeamtoSeam) || 0),
                rewound_width: parseFloat(row.rewoundWidth) || 0,
                roll_width: parseFloat(row.collarettoWidth) || 0,
                scrap_rolls: parseFloat(row.scrapRoll) || 0,
                rolls_planned: parseFloat(row.rolls) || null,
                rolls_actual: null,
                panels_planned: parseFloat(row.panels) || null,
                cons_planned: parseFloat(row.consumption) || null,
                cons_actual: null,
                extra: parseFloat(table.weftExtra) || 0
              }
            ]
          };

          weftPayloads.push(payload);
        });
      });

      biasTables.forEach((table) => {
        table.rows.forEach((row) => {
          const collarettoBiasName = `${selectedOrder}-CB-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`;
          newBiasNames.add(collarettoBiasName);

          const mattressName = `${selectedOrder}-ASB-${table.fabricType}-${String(row.sequenceNumber).padStart(3, '0')}`;

          const payload = {
            collaretto: collarettoBiasName,
            mattress: mattressName,
            order_commessa: selectedOrder,
            fabric_type: table.fabricType,
            fabric_code: table.fabricCode,
            fabric_color: table.fabricColor,
            dye_lot: row.bagno || null,
            item_type: "CB",

            table_id: table.id,
            row_id: row.id,
            sequence_number: row.sequenceNumber,
            operator: username,

            details: [
              {
                pieces: parseFloat(row.pieces) || 0,
                total_width: parseFloat(row.totalWidth) || 0,
                gross_length: parseFloat(row.grossLength) || 0,
                pcs_seam: parseFloat(row.pcsSeamtoSeam) || 0,
                rewound_width: parseFloat(row.rewoundWidth) || 0,
                roll_width: parseFloat(row.collarettoWidth) || 0,
                scrap_rolls: parseFloat(row.scrapRoll) || 0,
                rolls_planned: parseFloat(row.rolls) || null,
                rolls_actual: null,
                panels_planned: parseFloat(row.panels) || null,
                cons_planned: parseFloat(row.consumption) || null,
                cons_actual: null
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
                console.log(`✅ Mattress ${payload.mattress} saved successfully.`);
                return true;
              } else {
                console.warn(`⚠️ Failed to save mattress ${payload.mattress}:`, response.data.message);
                return false;
              }
            })
            .catch(error => {
              console.error(`❌ Error saving mattress ${payload.mattress}:`, error.response?.data || error.message);
              console.log("💥 Full payload that caused failure:", payload);
              return false;
            })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("❌ Some mattresses failed to save.");
        });
      };

      // ✅ Send Along Update Requests
      const saveAlongRows = () => {
        return Promise.all(allongPayloads.map(payload =>
          axios.post('/collaretto/add_along_row', payload)
            .then(response => {
              if (response.data.success) {
                console.log(`✅ Along Row ${payload.collaretto} saved successfully.`);
                return true;
              } else {
                console.warn(`⚠️ Failed to save along row ${payload.collaretto}:`, response.data.message);
                return false;
              }
            })
            .catch(error => {
              console.error(`❌ Error saving along row ${payload.collaretto}:`, error);
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
                console.log(`✅ Weft Row ${payload.collaretto} saved successfully.`);
                return true;
              } else {
                console.warn(`⚠️ Failed to save weft row ${payload.collaretto}:`, response.data.message);
                return false;
              }
            })
            .catch(error => {
              console.error(`❌ Error saving weft row ${payload.collaretto}:`, error);
              return false;
            })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("❌ Some weft rows failed to save.");
        });
      };

      const saveBiasRows = () => {
        return Promise.all(biasPayloads.map(payload =>
          axios.post('/collaretto/add_bias_row', payload)
            .then(response => {
              if (response.data.success) {
                console.log(`✅ Bias Row ${payload.collaretto} saved successfully.`);
                return true;
              } else {
                console.warn(`⚠️ Failed to save bias row ${payload.collaretto}:`, response.data.message);
                return false;
              }
            })
            .catch(error => {
              console.error(`❌ Error saving bias row ${payload.collaretto}:`, error);
              return false;
            })
        )).then(results => {
          const allSucceeded = results.every(result => result === true);
          if (!allSucceeded) throw new Error("❌ Some bias rows failed to save.");
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
            console.warn('⚠️ Pad Print entry already exists. Skipping creation.');
          } else {
            console.error('❌ Failed to save manual Pad Print info:', error);
            setErrorMessage("⚠️ Failed to save manual Pad Print info. Please try again.");
            setOpenError(true);
            return;
          }
        }
      }

      try {
        await axios.post('/orders/production_center/save', {
          order_commessa: selectedOrder,
          production_center: selectedProductionCenter,
          cutting_room: selectedCuttingRoom,
          destination: selectedDestination || null
        });
      } catch (error) {
        console.error("❌ Failed to save Production Center info:", error);
        setErrorMessage("⚠️ Failed to save Production Center info. Please try again.");
        setOpenError(true);
        return;
      }

      saveMattresses()
        .then(() => saveAlongRows())
        .then(() => saveWeftRows())
        .then(() => saveBiasRows())
        .then(() => {
          // ✅ Delete Only Rows That Were Removed from UI
          console.log("🗑️ Mattresses to delete:", deletedMattresses);
          const mattressesToDelete = deletedMattresses.filter(mattress => !newMattressNames.has(mattress));

          return Promise.allSettled(mattressesToDelete.map(mattress =>
              axios.delete(`/mattress/delete/${mattress}`)
                .then(() => {
                  console.log(`🗑️ Deleted mattress: ${mattress}`);
                  return { mattress, success: true };
                })
                .catch(error => {
                  console.error(`❌ Error deleting mattress: ${mattress}`, error);
                  return { mattress, success: false };
                })
            )).then(results => {
              const successfulDeletes = results
                .filter(r => r.status === 'fulfilled' && r.value.success)
                .map(r => r.value.mattress);

              setDeletedMattresses(prev =>
                prev.filter(name => !successfulDeletes.includes(name))
              );
          });
        })
        .then(() => {
          // ✅ Delete Only Along Rows Removed from the UI
          console.log("🗑️ Along Rows to delete:", deletedAlong);
          const alongToDelete = deletedAlong.filter(along => !newAlongNames.has(along));

          return Promise.allSettled(alongToDelete.map(along =>
            axios.delete(`/collaretto/delete/${along}`)
              .then(() => {
                console.log(`🗑️ Deleted along row: ${along}`);
                return { along, success: true };
              })
              .catch(error => {
                console.error(`❌ Error deleting along row: ${along}`, error);
                return { along, success: false };
              })
          )).then(results => {
            const successfulDeletes = results
              .filter(r => r.status === 'fulfilled' && r.value.success)
              .map(r => r.value.along);

            setDeletedAlong(prev =>
              prev.filter(name => !successfulDeletes.includes(name))
            );
          });
        })
        .then(() => {
          // ✅ Delete Only Weft Rows Removed from the UI
          console.log("🗑️ Weft Rows to delete:", deletedWeft);
          const weftToDelete = deletedWeft.filter(weft => !newWeftNames.has(weft));

          return Promise.allSettled(weftToDelete.map(weft =>
            axios.delete(`/collaretto/delete_weft_bias/${weft}`)
              .then(() => {
                console.log(`🗑️ Deleted weft row: ${weft}`);
                return { weft, success: true };
              })
              .catch(error => {
                console.error(`❌ Error deleting weft row: ${weft}`, error);
                return { weft, success: false };
              })
          )).then(results => {
            const successfulDeletes = results
              .filter(r => r.status === 'fulfilled' && r.value.success)
              .map(r => r.value.weft);

            setDeletedWeft(prev =>
              prev.filter(name => !successfulDeletes.includes(name))
            );
          });
        })
        .then(() => {
          console.log("🗑️ Bias Rows to delete:", deletedBias);
          const biasToDelete = deletedBias.filter(bias => !newBiasNames.has(bias));

          return Promise.allSettled(biasToDelete.map(bias =>
            axios.delete(`/collaretto/delete_weft_bias/${bias}`)
              .then(() => {
                console.log(`🗑️ Deleted bias row: ${bias}`);
                return { bias, success: true };
              })
              .catch(error => {
                console.error(`❌ Error deleting bias row: ${bias}`, error);
                return { bias, success: false };
              })
          )).then(results => {
            const successfulDeletes = results
              .filter(r => r.status === 'fulfilled' && r.value.success)
              .map(r => r.value.bias);

            setDeletedBias(prev =>
              prev.filter(name => !successfulDeletes.includes(name))
            );
          });
        })
        .then(() => {
          setDeletedAlong([]);
          setDeletedWeft([]);
          setDeletedBias([]);
          setUnsavedChanges(false);

          setSuccessMessage("Saving completed successfully!");
          setOpenSuccess(true);
        })
        .catch((error) => {
          console.error("🚨 Final Save Error:", error);
          setErrorMessage("⚠️ An error occurred while saving. Please try again.");
          setOpenError(true);
        });

    } catch (error) {
      console.error("\uD83D\uDEA8 Final Save Error:", error);
      setErrorMessage("\u26A0\uFE0F An error occurred while saving. Please try again.");
      setOpenError(true);
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    handleSave
  };
};

export default useHandleSave;