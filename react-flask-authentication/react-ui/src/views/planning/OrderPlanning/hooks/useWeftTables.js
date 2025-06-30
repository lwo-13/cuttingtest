import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const useWeftTables = ({
  setUnsavedChanges,
  setDeletedWeft,
  setDeletedTableIds
}) => {
  const [weftTables, setWeftTables] = useState([]);

  const handleAddWeft = () => {
    const tableId = uuidv4();
    const rowId = uuidv4();

    let newTable = {
      id: tableId,
      fabricType: "",
      fabricCode: "",
      fabricColor: "",
      weftExtra: "10",
      rows: [
        {
          id: rowId,
          sequenceNumber: 1,
          pieces: "",
          usableWidth: "",
          grossLength: "",
          pcsSeamtoSeam: "",
          rewoundWidth: "",
          collarettoWidth: "",
          scrapRoll: "",
          rolls: "",
          panels: "",
          consumption: "",
          bagno: "",
          status: "not_ready",
          isEditable: true
        }
      ]
    };



    setWeftTables(prev => [...prev, newTable]);
    setUnsavedChanges(true);
  };

  const handleRemoveWeft = (tableId) => {
    setWeftTables(prev => {
      const removed = prev.find(t => t.id === tableId);
      if (removed) {
        removed.rows.forEach(row => {
          if (row.collarettoName) {
            setDeletedWeft(prevDeleted => [...prevDeleted, row.collarettoName]);
          }
        });

        // Track deleted table ID for production center cleanup
        if (setDeletedTableIds) {
          setDeletedTableIds(prev => prev.includes(tableId) ? prev : [...prev, tableId]);
        }
      }
      setUnsavedChanges(true);
      return prev.filter(t => t.id !== tableId);
    });
  };

  const getNextSequenceNumber = (rows) => {
    const nums = rows.map(r => parseInt(r.sequenceNumber)).filter(n => !isNaN(n));
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  };

  const handleAddRow = (tableId) => {
    const newRowId = uuidv4();
    setWeftTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      const nextSeq = getNextSequenceNumber(table.rows);
      return {
        ...table,
        rows: [
          ...table.rows,
          {
            id: newRowId,
            sequenceNumber: nextSeq,
            pieces: "",
            usableWidth: "",
            grossLength: "",
            pcsSeamtoSeam: "",
            rewoundWidth: "",
            collarettoWidth: "",
            scrapRoll: "",
            rolls: "",
            panels: "",
            consumption: "",
            bagno: "",
            status: "not_ready",
            isEditable: true
          }
        ]
      };
    }));
    setUnsavedChanges(true);
  };

  const handleRemoveRow = (tableId, rowId) => {
    setWeftTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;

      const deletedRow = table.rows.find(row => row.id === rowId);
      if (deletedRow?.collarettoName) {
        setDeletedWeft(prev => [...prev, deletedRow.collarettoName]);
      }

      const updatedRows = table.rows.filter(row => row.id !== rowId);

      return {
        ...table,
        rows: updatedRows
      };
    }));

    setUnsavedChanges(true);
  };

  const handleInputChange = (tableId, rowId, field, value) => {
    setWeftTables(prevTables =>
      prevTables.map(table => {
        if (table.id !== tableId) return table;

        const updatedRows = table.rows.map(row => {
          if (row.id !== rowId) return row;

          const updatedRow = { ...row, [field]: value };

          // Parse relevant fields
          const usableWidth = parseFloat(field === "usableWidth" ? value : row.usableWidth) || 0;
          const grossLength = parseFloat(field === "grossLength" ? value : row.grossLength) || 0;

          if (field === "pcsSeamtoSeam") {
            // User is overwriting, use their value and stop calculation
            updatedRow.pcsSeamtoSeam = value;
            updatedRow.isPcsSeamCalculated = false;
          } else {
            // Only recalculate if previously auto-calculated
            if (!row.pcsSeamtoSeam || row.isPcsSeamCalculated) {
              updatedRow.pcsSeamtoSeam = usableWidth && grossLength
                ? ((usableWidth / 100) / grossLength).toFixed(1)
                : "";
              updatedRow.isPcsSeamCalculated = true;
            }
          }

          const rewoundWidth = parseFloat(field === "rewoundWidth" ? value : row.rewoundWidth);
          const collWidthMM = parseFloat(field === "collarettoWidth" ? value : row.collarettoWidth);
          const scrap = parseFloat(field === "scrapRoll" ? value : row.scrapRoll);
          const collWidthM = collWidthMM / 1000;

          updatedRow.rolls = !isNaN(rewoundWidth) && !isNaN(collWidthM) && !isNaN(scrap)
            ? Math.floor(rewoundWidth / collWidthM) - scrap
            : "";

          const pieces = parseFloat(field === "pieces" ? value : row.pieces);
          const rolls = parseFloat(updatedRow.rolls);
          const extra = parseFloat(table.weftExtra) || 0;
          const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

          const panelsCalculation = (pieces * (1 + extra / 100)) / (rolls * pcsSeam);
          updatedRow.panels = !isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0
          ? Math.ceil(panelsCalculation)
          : "";

          const panels = parseFloat(updatedRow.panels);
          updatedRow.consumption = !isNaN(panels) && !isNaN(rewoundWidth)
            ? (panels * rewoundWidth).toFixed(2)
            : "";

          return updatedRow;
        });

        return { ...table, rows: updatedRows };
      })
    );

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

      // Set a timeout to dispatch the event after a short delay (300ms)
      // This waits until you stop typing before auto-fetching
      window.collarettoBagnoChangeTimeouts[rowId] = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('collarettoBagnoChanged', {
          detail: {
            bagno: value,
            tableId: tableId,
            rowId: rowId,
            tableType: 'weft'
          }
        }));

        // Remove the timeout reference
        delete window.collarettoBagnoChangeTimeouts[rowId];
      }, 300);
    }

    setUnsavedChanges(true);
  };


  const handleExtraChange = (tableId, value) => {
    const extra = parseFloat(value) / 100 || 0;

    setWeftTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;

      const updatedRows = table.rows.map(row => {
        const pieces = parseFloat(row.pieces);
        const rolls = parseFloat(row.rolls);
        const rewoundWidth = parseFloat(row.rewoundWidth);
        const pcsSeam = parseFloat(row.pcsSeamtoSeam);

        const panelsCalculation = (pieces * (1 + extra)) / (rolls * pcsSeam);
        const panels = !isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0
          ? Math.ceil(panelsCalculation)
          : "";

        const consumption = !isNaN(panels) && !isNaN(rewoundWidth)
          ? (panels * rewoundWidth).toFixed(2)
          : "";

        return { ...row, panels, consumption };
      });

      return { ...table, weftExtra: value, rows: updatedRows };
    }));

    setUnsavedChanges(true);
  };

  return {
    weftTables,
    setWeftTables,
    handleAddWeft,
    handleRemoveWeft,
    handleAddRow,
    handleRemoveRow,
    handleInputChange,
    handleExtraChange
  };
};

export default useWeftTables;
