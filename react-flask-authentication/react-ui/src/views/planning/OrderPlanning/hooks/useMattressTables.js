import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

const addToDeletedIfNotExists = (name, setter) => {
  setter(prev => (prev.includes(name) ? prev : [...prev, name]));
};

const useMattressTables = ({ orderSizeNames, setUnsavedChanges, setDeletedMattresses, setDeletedTableIds }) => {
    const [tables, setTables] = useState([]);

    // Add Mattress Table
    const handleAddTable = () => {
      const newTableId = uuidv4();
      const newRowId = uuidv4();

      let newTable = {
        id: newTableId,
        // Production center fields (before fabric info)
        productionCenter: "",
        cuttingRoom: "",
        destination: "",
        fabricType: "",
        fabricCode: "",
        fabricColor: "",
        spreadingMethod: "",
        allowance: 0.02,
        spreading: "AUTOMATIC",
        rows: [
          {
            id: newRowId,
            width: "",
            markerName: "",
            piecesPerSize: orderSizeNames.reduce((acc, size) => {
              acc[size] = "";
              return acc;
            }, {}),
            markerLength: "",
            efficiency: "",
            layers: "",
            expectedConsumption: "",
            bagno: "",
            status: "not_ready",
            isEditable: true,
            sequenceNumber: 1
          }
        ]
      };



      setTables(prev => [...prev, newTable]);
      setUnsavedChanges(true);
  };


  const handleRemoveTable = (id) => {
    setTables(prevTables => {
      const tableToRemove = prevTables.find(table => table.id === id);
      if (!tableToRemove) return prevTables;

      const hasLockedRow = tableToRemove.rows.some(row => !row.isEditable);
      if (hasLockedRow) {
        console.warn("❌ Cannot delete table: contains locked rows");
        return prevTables;
      }

      // Delete mattress records
      tableToRemove.rows.forEach((row) => {
        if (row.mattressName) {
          addToDeletedIfNotExists(row.mattressName, setDeletedMattresses);
        }
      });

      // ✅ Trigger auto-fetching for collaretto tables when mattress table is deleted
      const uniqueBagnos = [...new Set(tableToRemove.rows
        .filter(row => row.bagno && row.bagno !== 'Unknown')
        .map(row => row.bagno))];

      if (uniqueBagnos.length > 0) {


        // Dispatch events for each unique bagno after table deletion
        setTimeout(() => {
          uniqueBagnos.forEach(bagno => {
            window.dispatchEvent(new CustomEvent('mattressPiecesChanged', {
              detail: {
                bagno: bagno
                // ✅ Removed piecesPerSize - let the handler recalculate from remaining tables
              }
            }));
          });
        }, 100); // Small delay to ensure state update is complete
      }

      // Track deleted table ID for production center cleanup
      if (setDeletedTableIds) {
        setDeletedTableIds(prev => prev.includes(id) ? prev : [...prev, id]);
      }

      setUnsavedChanges(true);
      return prevTables.filter(table => table.id !== id);
    });
  };

  const getNextSequenceNumber = (rows, table = null) => {
    // Extract sequence numbers from sequenceNumber field
    const sequencesFromField = rows
      .map(row => parseInt(row.sequenceNumber))
      .filter(n => !isNaN(n));

    // Extract sequence numbers from existing mattress names
    let sequencesFromNames = [];
    if (table) {
      // If we have table context, filter mattress names that match this table's pattern
      // This is more accurate for mixed scenarios
      const itemTypeCode = table.spreading === "MANUAL" ? "MS" : "AS";
      const fabricType = table.fabricType || "";

      sequencesFromNames = rows
        .filter(row => row.mattressName)
        .map(row => {
          // Check if this mattress name belongs to the same table configuration
          const nameContainsItemType = row.mattressName.includes(`-${itemTypeCode}-`);
          const nameContainsFabricType = fabricType ? row.mattressName.includes(`-${fabricType}-`) : true;

          if (nameContainsItemType && nameContainsFabricType) {
            // Extract the sequence number from the end of the mattress name (last 3 digits)
            const match = row.mattressName.match(/-(\d{3})$/);
            return match ? parseInt(match[1]) : null;
          }
          return null;
        })
        .filter(n => n !== null);
    } else {
      // Fallback: extract from all mattress names without filtering
      sequencesFromNames = rows
        .filter(row => row.mattressName)
        .map(row => {
          const match = row.mattressName.match(/-(\d{3})$/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(n => n !== null);
    }

    // Combine both sources and find the maximum
    const allSequences = [...sequencesFromField, ...sequencesFromNames];
    return allSequences.length > 0 ? Math.max(...allSequences) + 1 : 1;
  };

  const handleAddRow = (tableId) => {
    const newRowId = uuidv4();

    setTables(prevTables => {
      return prevTables.map(table => {
        if (table.id !== tableId) return table;

        // Pass table context to getNextSequenceNumber for more accurate sequence detection
        const nextSequence = getNextSequenceNumber(table.rows, table);

        return {
          ...table,
          rows: [
            ...table.rows,
            {
              id: newRowId,
              width: "",
              markerName: "",
              piecesPerSize: orderSizeNames.reduce((acc, size) => {
                acc[size] = "";
                return acc;
              }, {}),
              markerLength: "",
              efficiency: "",
              layers: "",
              layers_a: "", // Add layers_a field for new rows
              expectedConsumption: "",
              cons_actual: "", // Add cons_actual field for new rows
              bagno: "",
              status: "not_ready",
              isEditable: true,
              sequenceNumber: nextSequence
            }
          ]
        };
      });
    });

    // Trigger an event to notify that a row was added
    // This will allow other components to update if needed
    window.dispatchEvent(new CustomEvent('mattressRowAdded', {
      detail: {
        tableId: tableId,
        rowId: newRowId
      }
    }));

    setUnsavedChanges(true);
  };

  const handleBulkAddRows = (tableId, bulkAddData) => {
    const {
      layerPackageNr,
      width,
      selectedMarker,
      planLayersDirectly,
      totalLayers,
      layersPerRow,
      batch,
      mattressNames = [] // New: array of pre-generated mattress names
    } = bulkAddData;

    const newRowIds = [];

    // Calculate layer distribution if planning layers directly
    let layerDistribution = [];
    if (planLayersDirectly && totalLayers && layersPerRow) {
      const fullRows = Math.floor(totalLayers / layersPerRow);
      const remainder = totalLayers % layersPerRow;

      // Create array with layers for each row
      for (let i = 0; i < fullRows; i++) {
        layerDistribution.push(layersPerRow);
      }
      if (remainder > 0) {
        layerDistribution.push(remainder);
      }
    }

    setTables(prevTables => {
      return prevTables.map(table => {
        if (table.id !== tableId) return table;

        const newRows = [];
        // Pass table context to getNextSequenceNumber for more accurate sequence detection
        let currentSequence = getNextSequenceNumber(table.rows, table);

        // Create the specified number of rows
        for (let i = 0; i < layerPackageNr; i++) {
          const newRowId = uuidv4();
          newRowIds.push(newRowId);

          // Determine layers for this row
          let rowLayers = "";
          if (planLayersDirectly && layerDistribution.length > i) {
            rowLayers = layerDistribution[i].toString();
          }

          const newRow = {
            id: newRowId,
            width: width.toString(),
            markerName: selectedMarker.marker_name,
            piecesPerSize: selectedMarker.size_quantities || orderSizeNames.reduce((acc, size) => {
              acc[size] = "";
              return acc;
            }, {}),
            markerLength: selectedMarker.marker_length.toString(),
            efficiency: selectedMarker.efficiency.toString(),
            layers: rowLayers,
            layers_a: "", // Add layers_a field for new rows
            expectedConsumption: "",
            cons_actual: "", // Add cons_actual field for new rows
            bagno: batch || "", // Use provided batch or empty string
            status: "not_ready",
            isEditable: true,
            sequenceNumber: currentSequence + i,
            mattressName: mattressNames[i] || "" // Add the pre-generated mattress name
          };

          // Calculate expected consumption if layers are provided
          if (rowLayers && selectedMarker.marker_length) {
            const tableAllowance = parseFloat(table.allowance) || 0;
            const markerLength = parseFloat(selectedMarker.marker_length);
            const layers = parseInt(rowLayers);

            if (!isNaN(markerLength) && !isNaN(layers) && markerLength > 0 && layers > 0) {
              const lengthWithAllowance = markerLength + tableAllowance;
              newRow.expectedConsumption = (lengthWithAllowance * layers).toFixed(2);
            }
          }

          newRows.push(newRow);
        }

        return {
          ...table,
          rows: [...table.rows, ...newRows]
        };
      });
    });

    // Trigger events for each added row
    newRowIds.forEach((rowId, index) => {
      window.dispatchEvent(new CustomEvent('mattressRowAdded', {
        detail: {
          tableId: tableId,
          rowId: rowId
        }
      }));

      // If layers were pre-populated, trigger layer change event after a short delay
      if (planLayersDirectly && layerDistribution && layerDistribution.length > index && batch) {
        setTimeout(() => {
          // Use the provided batch for the event since we know it was set
          window.dispatchEvent(new CustomEvent('mattressLayersChanged', {
            detail: {
              bagno: batch,
              tableId: tableId,
              rowId: rowId,
              newLayers: layerDistribution[index]
            }
          }));
        }, 100); // Small delay to ensure the row is fully added to the DOM
      }
    });

    setUnsavedChanges(true);
  };

  const handleRemoveRow = (tableId, rowId) => {
    setTables(prevTables => {
      return prevTables.map(table => {
        if (table.id !== tableId) return table;

        const rowToDelete = table.rows.find(row => row.id === rowId);
        if (!rowToDelete || !rowToDelete.isEditable) return table;

        if (rowToDelete.mattressName) {
          addToDeletedIfNotExists(rowToDelete.mattressName, setDeletedMattresses);
        }

        // ✅ Trigger auto-fetching for collaretto tables when a mattress row is deleted
        if (rowToDelete.bagno && rowToDelete.bagno !== 'Unknown') {


          // Dispatch event to recalculate collaretto pieces after this mattress row is removed
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('mattressPiecesChanged', {
              detail: {
                bagno: rowToDelete.bagno
                // ✅ Removed piecesPerSize - let the handler recalculate from remaining tables
              }
            }));
          }, 100); // Small delay to ensure state update is complete
        }

        setUnsavedChanges(true);

        return {
          ...table,
          rows: table.rows.filter(row => row.id !== rowId)
        };
      });
    });
  };

  const handleInputChange = (tableId, rowId, field, value) => {
    setTables(prevTables => {
      return prevTables.map(table => {
        if (table.id !== tableId) return table;

        const tableAllowance = parseFloat(table.allowance) || 0;

        const updatedRows = table.rows.map(row => {
          if (row.id !== rowId) return row;

          const updatedRow = {
            ...row,
            [field]: value
          };

          if (field === "layers" || field === "markerLength") {
            const markerLength = parseFloat(field === "markerLength" ? value : row.markerLength);
            const layers = parseInt(field === "layers" ? value : row.layers);

            if (!isNaN(markerLength) && markerLength > 0 && !isNaN(layers) && layers > 0) {
              const lengthWithAllowance = markerLength + tableAllowance;
              updatedRow.expectedConsumption = (lengthWithAllowance * layers).toFixed(2);
            } else {
              updatedRow.expectedConsumption = "";
            }
          }

          return updatedRow;
        });

        return {
          ...table,
          rows: updatedRows
        };
      });
    });

    // If the layers field is changed, we need to trigger an update for any collaretto rows
    // that have the same bagno as the mattress row being changed
    if (field === "layers") {
      // We need to find the bagno of the row being changed
      const changedRow = tables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);

      // Only dispatch event if the row has a valid bagno and the layers value is valid
      if (changedRow && changedRow.bagno && changedRow.bagno !== 'Unknown') {
        // Store the row ID and bagno in a closure for the timeout
        const rowBagno = changedRow.bagno;

        // Clear any existing timeout for this row
        if (window.layersChangeTimeouts && window.layersChangeTimeouts[rowId]) {
          clearTimeout(window.layersChangeTimeouts[rowId]);
        }

        // Initialize the timeouts object if it doesn't exist
        if (!window.layersChangeTimeouts) {
          window.layersChangeTimeouts = {};
        }

        // Set a timeout to dispatch the event after a delay (1500ms)
        // This gives the user time to finish typing before we update
        window.layersChangeTimeouts[rowId] = setTimeout(() => {
          const updatedRow = tables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);
          if (updatedRow) {
            const finalLayersValue = parseInt(updatedRow.layers);
            if (!isNaN(finalLayersValue) && finalLayersValue > 0) {
              // This is a custom event that will be caught in orderplanning.js to update collaretto pieces
              window.dispatchEvent(new CustomEvent('mattressLayersChanged', {
                detail: {
                  bagno: rowBagno,
                  tableId: tableId,
                  rowId: rowId,
                  newLayers: finalLayersValue
                }
              }));
            }
          }
          // Remove the timeout reference
          delete window.layersChangeTimeouts[rowId];
        }, 1500);
      }
    }

    // Also trigger the event if the bagno field is changed (including when cleared) and there are valid layers
    if (field === "bagno") {
      const changedRow = tables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);
      if (changedRow) {
        const layers = parseInt(changedRow.layers);
        if (!isNaN(layers) && layers > 0) {
          // ✅ Capture the OLD bagno value before state update
          const oldBagnoValue = changedRow.bagno;
          const newBagnoValue = value || ""; // Handle empty values

          // Clear any existing timeout for this row's bagno
          if (window.bagnoChangeTimeouts && window.bagnoChangeTimeouts[rowId]) {
            clearTimeout(window.bagnoChangeTimeouts[rowId]);
          }

          // Initialize the timeouts object if it doesn't exist
          if (!window.bagnoChangeTimeouts) {
            window.bagnoChangeTimeouts = {};
          }

          // ✅ Track the ORIGINAL bagno value (before any changes in this typing session)
          if (!window.originalBagnoValues) {
            window.originalBagnoValues = {};
          }

          // If this is the first change for this row, store the original value
          // Only store if the old value is not empty/unknown
          if (!window.originalBagnoValues[rowId] && oldBagnoValue && oldBagnoValue !== 'Unknown') {
            window.originalBagnoValues[rowId] = oldBagnoValue;
          }

          // Set a timeout to dispatch the event after a delay (1500ms)
          // This gives the user time to finish typing before we update
          const finalBagnoValueFromInput = newBagnoValue;

          window.bagnoChangeTimeouts[rowId] = setTimeout(() => {
            const updatedRow = tables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);
            if (updatedRow) {
              const finalLayers = parseInt(updatedRow.layers);

              if (!isNaN(finalLayers) && finalLayers > 0) {
                // Dispatch event for NEW bagno (to add pieces) - only if final bagno is valid
                if (finalBagnoValueFromInput && finalBagnoValueFromInput !== 'Unknown') {
                  window.dispatchEvent(new CustomEvent('mattressLayersChanged', {
                    detail: {
                      bagno: finalBagnoValueFromInput,
                      tableId: tableId,
                      rowId: rowId,
                      newLayers: finalLayers
                    }
                  }));
                }

                // Dispatch event for ORIGINAL bagno (to recalculate remaining pieces)
                const originalBagnoValue = window.originalBagnoValues[rowId];
                if (originalBagnoValue && originalBagnoValue !== 'Unknown' && originalBagnoValue !== finalBagnoValueFromInput) {
                  window.dispatchEvent(new CustomEvent('mattressPiecesChanged', {
                    detail: {
                      bagno: originalBagnoValue
                    }
                  }));
                }
              }
            }
            // Remove the timeout reference and original bagno tracking
            delete window.bagnoChangeTimeouts[rowId];
            delete window.originalBagnoValues[rowId];
          }, 1500);
        }
      }
    }

    // Trigger an event when piecesPerSize is changed (happens when a marker is selected)
    if (field === "piecesPerSize" && value) {
      const changedRow = tables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);
      if (changedRow && changedRow.bagno && changedRow.bagno !== 'Unknown') {
        const layers = parseInt(changedRow.layers);
        if (!isNaN(layers) && layers > 0) {
          // Store the bagno value in a closure for the timeout
          const rowBagno = changedRow.bagno;



          // For marker selection, we don't need a delay since it's not a typing operation
          // The event handler will recalculate total pieces from all mattress tables
          window.dispatchEvent(new CustomEvent('mattressPiecesChanged', {
            detail: {
              bagno: rowBagno,
              tableId: tableId,
              rowId: rowId
              // ✅ Removed piecesPerSize - let the handler recalculate from all tables
            }
          }));
        }
      }
    }

    setUnsavedChanges(true);
  };

  const updateExpectedConsumption = (tableId, rowId) => {
    setTables(prevTables => {
      return prevTables.map(table => {
        if (table.id !== tableId) return table;

        const updatedRows = table.rows.map(row => {
          if (row.id !== rowId) return row;

          if (row.timeout) clearTimeout(row.timeout);

          const timeout = setTimeout(() => {
            const tableAllowance = parseFloat(table.allowance) || 0;
            const markerLength = parseFloat(row.markerLength);
            const layers = parseInt(row.layers);

            // 🛑 Don't calculate until both values are valid
            if (isNaN(markerLength) || isNaN(layers) || markerLength <= 0 || layers <= 0) return;

            const expectedConsumption = markerLength + tableAllowance;
            const total = Number((expectedConsumption * layers).toFixed(2));

            setTables(currentTables => {
              return currentTables.map(t =>
                t.id !== tableId
                  ? t
                  : {
                      ...t,
                      rows: t.rows.map(r =>
                        r.id === rowId ? { ...r, expectedConsumption: total } : r
                      )
                    }
              );
            });
          }, 500);

          return { ...row, timeout };
        });

        return { ...table, rows: updatedRows };
      });
    });
  };

  return {
    tables,
    setTables,
    handleAddTable,
    handleRemoveTable,
    handleAddRow,
    handleBulkAddRows,
    handleRemoveRow,
    handleInputChange,
    updateExpectedConsumption
  };
};

export default useMattressTables;