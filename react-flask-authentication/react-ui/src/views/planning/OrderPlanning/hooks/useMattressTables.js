import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

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
      allowance: "",
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
          isEditable: true
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

      tableToRemove.rows.forEach(row => {
        if (row.mattressName) {
          setDeletedMattresses(prev => [...prev, row.mattressName]);
        }
      });

      setUnsavedChanges(true);
      return prevTables.filter(table => table.id !== id);
    });
  };

  const handleAddRow = (tableId) => {
    const newRowId = uuidv4();

    setTables(prevTables => {
      return prevTables.map(table => {
        if (table.id !== tableId) return table;

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
              isEditable: true
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
          setDeletedMattresses(prev => [...prev, rowToDelete.mattressName]);
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

        const updatedRows = table.rows.map(row => {
          if (row.id !== rowId) return row;

          const updatedRow = {
            ...row,
            [field]: value
          };

          if (field === "layers" || field === "markerLength") {
            const markerLength = parseFloat(
              field === "markerLength" ? value : row.markerLength
            ) || 0;
            const layers = parseInt(
              field === "layers" ? value : row.layers
            ) || 0;

            updatedRow.expectedConsumption = (markerLength * layers).toFixed(2);
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
            const markerLength = (parseFloat(row.markerLength) || 0) + tableAllowance;
            const layers = parseInt(row.layers) || 0;
            const expectedConsumption = (markerLength * layers).toFixed(1);
  
            setTables(currentTables => {
              return currentTables.map(t =>
                t.id !== tableId
                  ? t
                  : {
                      ...t,
                      rows: t.rows.map(r =>
                        r.id === rowId ? { ...r, expectedConsumption } : r
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