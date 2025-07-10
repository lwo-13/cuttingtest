import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import axios from 'utils/axiosInstance';

const addToDeletedIfNotExists = (name, setter) => {
  setter(prev => (prev.includes(name) ? prev : [...prev, name]));
};

const useAdhesiveTables = ({ orderSizeNames, setDeletedMattresses, setUnsavedChanges, setDeletedTableIds }) => {
    const [tables, setTables] = useState([]);

    const getNextSequenceNumber = (rows) => {
        if (!rows || rows.length === 0) return 1;
        return Math.max(...rows.map(row => row.sequenceNumber || 0)) + 1;
    };

    // Add Adhesive Table
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
        spreading: "MANUAL",
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

    // Remove Adhesive Table
    const handleRemoveTable = (tableId) => {
        setTables(prevTables => {
            const tableToRemove = prevTables.find(table => table.id === tableId);
            if (tableToRemove) {
                // Add all mattress names from this table to deleted mattresses
                tableToRemove.rows.forEach((row) => {
                    if (row.mattressName) {
                        addToDeletedIfNotExists(row.mattressName, setDeletedMattresses);
                    }
                });

                // ✅ Trigger auto-fetching for collaretto tables when adhesive table is deleted
                const uniqueBagnos = [...new Set(tableToRemove.rows
                    .filter(row => row.bagno && row.bagno !== 'Unknown')
                    .map(row => row.bagno))];

                if (uniqueBagnos.length > 0) {
                    console.log(`🗑️ Adhesive table deleted with bagnos: ${uniqueBagnos.join(', ')} - triggering collaretto pieces recalculation`);

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
                    setDeletedTableIds(prev => prev.includes(tableId) ? prev : [...prev, tableId]);
                }
            }
            return prevTables.filter(table => table.id !== tableId);
        });
        setUnsavedChanges(true);
    };

    // Add Row to Adhesive Table
    const handleAddRow = (tableId) => {
        const newRowId = uuidv4();

        setTables(prevTables => {
            return prevTables.map(table => {
                if (table.id !== tableId) return table;

                const nextSequence = getNextSequenceNumber(table.rows);

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
                            expectedConsumption: "",
                            bagno: "",
                            status: "not_ready",
                            isEditable: true,
                            sequenceNumber: nextSequence
                        }
                    ]
                };
            });
        });
        setUnsavedChanges(true);
    };

    // Remove Row from Adhesive Table
    const handleRemoveRow = (tableId, rowId) => {
        setTables(prevTables => {
            return prevTables.map(table => {
                if (table.id !== tableId) return table;

                const rowToRemove = table.rows.find(row => row.id === rowId);
                if (rowToRemove && rowToRemove.mattressName) {
                    addToDeletedIfNotExists(rowToRemove.mattressName, setDeletedMattresses);
                }

                // ✅ Trigger auto-fetching for collaretto tables when an adhesive row is deleted
                if (rowToRemove && rowToRemove.bagno && rowToRemove.bagno !== 'Unknown') {
                    console.log(`🗑️ Adhesive row deleted with bagno ${rowToRemove.bagno} - triggering collaretto pieces recalculation`);

                    // Dispatch event to recalculate collaretto pieces after this adhesive row is removed
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('mattressPiecesChanged', {
                            detail: {
                                bagno: rowToRemove.bagno
                                // ✅ Removed piecesPerSize - let the handler recalculate from remaining tables
                            }
                        }));
                    }, 100); // Small delay to ensure state update is complete
                }

                return {
                    ...table,
                    rows: table.rows.filter(row => row.id !== rowId)
                };
            });
        });
        setUnsavedChanges(true);
    };

    // Handle Input Change for Adhesive Table
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

                    // Calculate consumption when layers or markerLength changes
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

        // ✅ Handle bagno changes for adhesive tables (same logic as mattress tables)
        if (field === "bagno" && value && value !== 'Unknown') {
            const changedRow = tables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);
            if (changedRow) {
                const layers = parseInt(changedRow.layers);
                if (!isNaN(layers) && layers > 0) {
                    // ✅ Capture the OLD bagno value before state update
                    const oldBagnoValue = changedRow.bagno;
                    const newBagnoValue = value;

                    console.log(`🔄 Adhesive bagno changed from "${oldBagnoValue}" to "${newBagnoValue}" - will update both`);

                    // Clear any existing timeout for this row's bagno
                    if (window.adhesiveBagnoChangeTimeouts && window.adhesiveBagnoChangeTimeouts[rowId]) {
                        clearTimeout(window.adhesiveBagnoChangeTimeouts[rowId]);
                    }

                    // Initialize the timeouts object if it doesn't exist
                    if (!window.adhesiveBagnoChangeTimeouts) {
                        window.adhesiveBagnoChangeTimeouts = {};
                    }

                    // Set a timeout to dispatch the event after a short delay (300ms)
                    window.adhesiveBagnoChangeTimeouts[rowId] = setTimeout(() => {
                        const updatedRow = tables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);
                        if (updatedRow) {
                            const finalLayers = parseInt(updatedRow.layers);
                            if (!isNaN(finalLayers) && finalLayers > 0) {
                                // ✅ Dispatch event for NEW bagno (to add pieces)
                                window.dispatchEvent(new CustomEvent('mattressLayersChanged', {
                                    detail: {
                                        bagno: newBagnoValue,
                                        tableId: tableId,
                                        rowId: rowId,
                                        newLayers: finalLayers
                                    }
                                }));

                                // ✅ Dispatch event for OLD bagno (to recalculate remaining pieces)
                                if (oldBagnoValue && oldBagnoValue !== 'Unknown' && oldBagnoValue !== newBagnoValue) {
                                    console.log(`🔄 Recalculating pieces for old adhesive bagno: ${oldBagnoValue}`);
                                    window.dispatchEvent(new CustomEvent('mattressPiecesChanged', {
                                        detail: {
                                            bagno: oldBagnoValue
                                            // Handler will recalculate from remaining tables
                                        }
                                    }));
                                }
                            }
                        }
                        // Remove the timeout reference
                        delete window.adhesiveBagnoChangeTimeouts[rowId];
                    }, 300);
                }
            }
        }

        setUnsavedChanges(true);
    };

    // Update Expected Consumption for Adhesive Table
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

                        // Don't calculate until both values are valid
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

                return {
                    ...table,
                    rows: updatedRows
                };
            });
        });
    };

    return {
        tables,
        setTables,
        handleAddTable,
        handleRemoveTable,
        handleAddRow,
        handleRemoveRow,
        handleInputChange,
        updateExpectedConsumption
    };
};

export default useAdhesiveTables;
