import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const useBiasTables = ({
  setUnsavedChanges,
  setDeletedBias
}) => {
  const [biasTables, setBiasTables] = useState([]);

  const handleAddBias = () => {
    const tableId = uuidv4();
    const rowId = uuidv4();

    setBiasTables(prev => [
      ...prev,
      {
        id: tableId,
        fabricType: "",
        fabricCode: "",
        fabricColor: "",
        rows: [
          {
            id: rowId,
            sequenceNumber: 1,
            pieces: "",
            totalWidth: "",
            grossLength: "",
            pcsSeamtoSeam: "",
            rewoundWidth: "",
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

  const handleRemoveBias = (tableId) => {
    setBiasTables(prev => {
      const removed = prev.find(t => t.id === tableId);
      if (removed) {
        removed.rows.forEach(row => {
          if (row.collarettoName) {
            setDeletedBias(prevDeleted => [...prevDeleted, row.collarettoName]);
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
    setBiasTables(prev => prev.map(table => {
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
            totalWidth: "",
            grossLength: "",
            pcsSeamtoSeam: "",
            rewoundWidth: "",
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
    setBiasTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;

      const deletedRow = table.rows.find(row => row.id === rowId);
      if (deletedRow?.collarettoName) {
        setDeletedBias(prev => [...prev, deletedRow.collarettoName]);
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
    setBiasTables(prevTables =>
      prevTables.map(table => {
        if (table.id !== tableId) return table;

        const updatedRows = table.rows.map(row => {
          if (row.id !== rowId) return row;

          const updatedRow = { ...row, [field]: value };

          // Parse relevant fields
          const totalWidth = parseFloat(field === "totalWidth" ? value : row.totalWidth) || 0;
          const grossLength = parseFloat(field === "grossLength" ? value : row.grossLength) || 0;
          const collWidthMM = parseFloat(field === "collarettoWidth" ? value : row.collarettoWidth) || 0;
          const collWidthM = collWidthMM / 1000;

          // pcsSeamtoSeam logic
          if (field === "pcsSeamtoSeam") {
            updatedRow.pcsSeamtoSeam = value;
            updatedRow.isPcsSeamCalculated = false;
          } else {
            if (!row.pcsSeamtoSeam || row.isPcsSeamCalculated) {
              const seamTotal = (totalWidth / 100) * Math.SQRT2;
              const seamUsable = seamTotal - (collWidthMM / 1000);
              updatedRow.pcsSeamtoSeam = seamUsable > 0 && grossLength > 0
                ? (seamUsable / grossLength).toFixed(1)
                : "";
              updatedRow.isPcsSeamCalculated = true;
            }
          }

          const rewoundWidth = parseFloat(field === "rewoundWidth" ? value : row.rewoundWidth);
          const scrap = parseFloat(field === "scrapRoll" ? value : row.scrapRoll);

          updatedRow.rolls = !isNaN(rewoundWidth) && !isNaN(collWidthM) && !isNaN(scrap)
            ? Math.floor(rewoundWidth / collWidthM) - scrap
            : "";

          const pieces = parseFloat(field === "pieces" ? value : row.pieces);
          const rolls = parseFloat(updatedRow.rolls);
          const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

          updatedRow.panels = !isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0
            ? Math.round(pieces / (rolls * pcsSeam))
            : "";

          const panels = parseFloat(updatedRow.panels);
          const panelLength = !isNaN(rewoundWidth) ? rewoundWidth * Math.SQRT2 : null;

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

  return {
    biasTables,
    setBiasTables,
    handleAddBias,
    handleRemoveBias,
    handleAddRow,
    handleRemoveRow,
    handleInputChange
  };
};

export default useBiasTables;
