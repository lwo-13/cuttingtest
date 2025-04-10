import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

const addToDeletedIfNotExists = (name, setter) => {
  setter(prev => (prev.includes(name) ? prev : [...prev, name]));
};

const useMattressTables = ({ orderSizeNames, setUnsavedChanges, setDeletedMattresses }) => {
    const [tables, setTables] = useState([]);

    // Add Mattress Table
    const handleAddTable = () => {
      const newTableId = uuidv4();
      const newRowId = uuidv4();

      const newTable = {
        id: newTableId,
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

      tableToRemove.rows.forEach((row) => {
        if (row.mattressName) {
          addToDeletedIfNotExists(row.mattressName, setDeletedMattresses);
        }
      });

      setUnsavedChanges(true);
      return prevTables.filter(table => table.id !== id);
    });
  };

  const getNextSequenceNumber = (rows) => {
    const existing = rows
      .map(row => parseInt(row.sequenceNumber))
      .filter(n => !isNaN(n));
    return existing.length > 0 ? Math.max(...existing) + 1 : 1;
  };

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
              isEditable: true,
              sequenceNumber: nextSequence
            }
          ]
        };
      });
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
    handleRemoveRow,
    handleInputChange,
    updateExpectedConsumption
  };
};

export default useMattressTables;