import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

const useAlongTables = ({ setUnsavedChanges, setDeletedAlong, setDeletedTableIds }) => {
  const [alongTables, setAlongTables] = useState([]);

  const handleAddTable = () => {
    const tableId = uuidv4();
    const rowId = uuidv4();

    let newTable = {
      id: tableId,
      fabricType: "",
      fabricCode: "",
      fabricColor: "",
      alongExtra: "3",
      rows: [
        {
          id: rowId,
          sequenceNumber: 1,
          pieces: "",
          usableWidth: "",
          theoreticalConsumption: "",
          collarettoWidth: "",
          scrapRoll: "",
          rolls: "",
          metersCollaretto: "",
          consumption: "",
          bagno: "",
          sizes: "ALL",
          isEditable: true
        }
      ]
    };



    setAlongTables(prev => [...prev, newTable]);
    setUnsavedChanges(true);
  };

  const handleRemoveTable = (tableId) => {
    setAlongTables(prev => {
      const tableToRemove = prev.find(t => t.id === tableId);
      if (!tableToRemove) return prev;

      tableToRemove.rows.forEach(row => {
        if (row.collarettoName) {
          setDeletedAlong(prevDeleted => [...prevDeleted, row.collarettoName]);
        }
      });

      // Track deleted table ID for production center cleanup
      if (setDeletedTableIds) {
        setDeletedTableIds(prev => prev.includes(tableId) ? prev : [...prev, tableId]);
      }

      setUnsavedChanges(true);
      return prev.filter(t => t.id !== tableId);
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

    setAlongTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;

      const nextSequence = getNextSequenceNumber(t.rows);

      return {
        ...t,
        rows: [
          ...t.rows,
          {
            id: newRowId,
            sequenceNumber: nextSequence,
            pieces: "",
            usableWidth: "",
            theoreticalConsumption: "",
            collarettoWidth: "",
            scrapRoll: "",
            rolls: "",
            metersCollaretto: "",
            consumption: "",
            bagno: "",
            sizes: "ALL",
            isEditable: true
          }
        ]
      };
    }));

    setUnsavedChanges(true);
  };

  const handleRemoveRow = (tableId, rowId) => {
    setAlongTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const rowToRemove = t.rows.find(r => r.id === rowId);
      if (rowToRemove?.collarettoName) {
        setDeletedAlong(prevDeleted => [...prevDeleted, rowToRemove.collarettoName]);
      }
      return {
        ...t,
        rows: t.rows.filter(r => r.id !== rowId)
      };
    }));
    setUnsavedChanges(true);
  };

  const handleInputChange = (tableId, rowId, field, value) => {
    setAlongTables(prev => {
      return prev.map(table => {
        if (table.id !== tableId) return table;

        const updatedRows = table.rows.map(row => {
          if (row.id !== rowId) return row;

          const updatedRow = { ...row, [field]: value };

          const pieces = parseFloat(updatedRow.pieces) || 0;
          const width = parseFloat(updatedRow.usableWidth) || 0;
          const collWidth = (parseFloat(updatedRow.collarettoWidth) || 1) / 10;
          const scrap = parseFloat(updatedRow.scrapRoll) || 0;
          const theoCons = parseFloat(updatedRow.theoreticalConsumption) || 0;
          const extra = 1 + (parseFloat(table.alongExtra) / 100 || 0);

          updatedRow.rolls = collWidth > 0 ? Math.floor(width / collWidth) - scrap : 0;
          updatedRow.metersCollaretto = (pieces * theoCons * extra).toFixed(2);
          updatedRow.consumption = updatedRow.rolls > 0
            ? (updatedRow.metersCollaretto / updatedRow.rolls).toFixed(2)
            : "0";

          return updatedRow;
        });

        return { ...table, rows: updatedRows };
      });
    });

    // Dispatch event when bagno is changed to auto-fetch pieces from mattress tables
    if (field === "bagno" && value && value !== 'Unknown') {
      // Clear any existing timeout for this row's bagno
      if (window.collarettoBagnoChangeTimeouts && window.collarettoBagnoChangeTimeouts[rowId]) {
        clearTimeout(window.collarettoBagnoChangeTimeouts[rowId]);
      }

      // Initialize the timeouts object if it doesn't exist
      if (!window.collarettoBagnoChangeTimeouts) {
        window.collarettoBagnoChangeTimeouts = {};
      }

      // Set a timeout to dispatch the event after a delay (1500ms)
      // This waits until you stop typing before auto-fetching
      window.collarettoBagnoChangeTimeouts[rowId] = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('collarettoBagnoChanged', {
          detail: {
            bagno: value,
            tableId: tableId,
            rowId: rowId,
            tableType: 'along'
          }
        }));

        // Remove the timeout reference
        delete window.collarettoBagnoChangeTimeouts[rowId];
      }, 1500);
    }

    // ✅ Dispatch event when sizes field is changed to auto-update pieces based on new size selection
    if (field === "sizes" && value) {
      // Get the current bagno for this row to trigger auto-fetch with new sizes
      const currentRow = alongTables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);
      const currentBagno = currentRow?.bagno;

      if (currentBagno && currentBagno !== 'Unknown') {
        console.log(`🎯 Sizes changed to "${value}" for row with bagno "${currentBagno}" - triggering auto-fetch`);

        // Add a small delay to ensure state has been updated before dispatching the event
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('collarettoBagnoChanged', {
            detail: {
              bagno: currentBagno,
              tableId: tableId,
              rowId: rowId,
              tableType: 'along'
            }
          }));
        }, 100); // 100ms delay to allow state update
      }
    }

    setUnsavedChanges(true);
  };

  const handleExtraChange = (tableId, value) => {
    const extra = parseFloat(value) / 100 || 0;

    setAlongTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;

      const updatedRows = table.rows.map(row => {
        const pieces = parseFloat(row.pieces) || 0;
        const theoCons = parseFloat(row.theoreticalConsumption) || 0;
        const rolls = parseFloat(row.rolls) || 0;

        const meters = pieces * theoCons * (1 + extra);
        return {
          ...row,
          metersCollaretto: meters.toFixed(1),
          consumption: rolls > 0 ? (meters / rolls).toFixed(2) : "0"
        };
      });

      return {
        ...table,
        alongExtra: value,
        rows: updatedRows
      };
    }));

    setUnsavedChanges(true);
  };

  return {
    alongTables,
    setAlongTables,
    handleAddTable,
    handleRemoveTable,
    handleAddRow,
    handleRemoveRow,
    handleInputChange,
    handleExtraChange
  };
};

export default useAlongTables;
