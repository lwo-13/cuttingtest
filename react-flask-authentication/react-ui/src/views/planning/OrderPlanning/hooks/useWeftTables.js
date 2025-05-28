import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const useWeftTables = ({
  setUnsavedChanges,
  setDeletedWeft
}) => {
  const [weftTables, setWeftTables] = useState([]);

  const handleAddWeft = () => {
    const tableId = uuidv4();
    const rowId = uuidv4();

    setWeftTables(prev => [
      ...prev,
      {
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
            panelLength: "",
            collarettoWidth: "",
            scrapRoll: "",
            rolls: "",
            panels: "",
            consumption: "",
            bagno: "",
            isEditable: true
          }
        ]
      }
    ]);
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
            panelLength: "",
            collarettoWidth: "",
            scrapRoll: "",
            rolls: "",
            panels: "",
            consumption: "",
            bagno: "",
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

          const panelLength = parseFloat(field === "panelLength" ? value : row.panelLength);
          const collWidthMM = parseFloat(field === "collarettoWidth" ? value : row.collarettoWidth);
          const scrap = parseFloat(field === "scrapRoll" ? value : row.scrapRoll);
          const collWidthM = collWidthMM / 1000;

          updatedRow.rolls = !isNaN(panelLength) && !isNaN(collWidthM) && !isNaN(scrap)
            ? Math.floor(panelLength / collWidthM) - scrap
            : "";

          const pieces = parseFloat(field === "pieces" ? value : row.pieces);
          const rolls = parseFloat(updatedRow.rolls);
          const extra = parseFloat(table.weftExtra) || 0;
          const pcsSeam = Math.floor(parseFloat(updatedRow.pcsSeamtoSeam)) || 0;

          updatedRow.panels = !isNaN(pieces) && !isNaN(rolls) && rolls > 0 && pcsSeam > 0
            ? Math.round((pieces * (1 + extra / 100)) / (rolls * pcsSeam))
            : "";

          const panels = parseFloat(updatedRow.panels);
          updatedRow.consumption = !isNaN(panels) && !isNaN(panelLength)
            ? (panels * panelLength).toFixed(2)
            : "";

          return updatedRow;
        });

        return { ...table, rows: updatedRows };
      })
    );
    setUnsavedChanges(true);
  };


  const handleExtraChange = (tableId, value) => {
    const extra = parseFloat(value) / 100 || 0;

    setWeftTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;

      const updatedRows = table.rows.map(row => {
        const pieces = parseFloat(row.pieces);
        const rolls = parseFloat(row.rolls);
        const panelLength = parseFloat(row.panelLength);
        const pcsSeam = Math.floor(parseFloat(row.pcsSeamtoSeam)) || 0;

        const panels = !isNaN(pieces) && !isNaN(rolls) && rolls > 0 && pcsSeam > 0
          ? Math.round((pieces * (1 + extra)) / (rolls * pcsSeam))
          : "";

        const consumption = !isNaN(panels) && !isNaN(panelLength)
          ? (panels * panelLength).toFixed(2)
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
