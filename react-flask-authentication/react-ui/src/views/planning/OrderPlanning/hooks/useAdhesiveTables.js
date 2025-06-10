import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

const addToDeletedIfNotExists = (name, setter) => {
  setter(prev => (prev.includes(name) ? prev : [...prev, name]));
};

const useAdhesiveTables = ({ orderSizeNames, setDeletedMattresses, setUnsavedChanges }) => {
    const [tables, setTables] = useState([]);

    const getNextSequenceNumber = (rows) => {
        if (!rows || rows.length === 0) return 1;
        return Math.max(...rows.map(row => row.sequenceNumber || 0)) + 1;
    };

    // Add Adhesive Table
    const handleAddTable = () => {
      const newTableId = uuidv4();
      const newRowId = uuidv4();

      const newTable = {
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
