import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const useBiasTables = ({
  setUnsavedChanges,
  setDeletedBias,
  setDeletedTableIds
}) => {
  const [biasTables, setBiasTables] = useState([]);

  const handleAddBias = () => {
    const tableId = uuidv4();
    const rowId = uuidv4();

    let newTable = {
      id: tableId,
      fabricType: "",
      fabricCode: "",
      fabricColor: "",
      biasExtra: "0",
      rows: [
        {
          id: rowId,
          sequenceNumber: 1,
          pieces: "",
          usableWidth: "",
          grossLength: "",
          pcsSeamtoSeam: "",
          collarettoWidth: "",
          scrapRoll: "",
          rolls: "",
          panels: "",
          panelLength: "",
          consumption: "",
          bagno: "",
          sizes: "ALL",
          status: "not_ready",
          isEditable: true
        }
      ]
    };



    setBiasTables(prev => [...prev, newTable]);
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
            usableWidth: "",
            grossLength: "",
            pcsSeamtoSeam: "",
            collarettoWidth: "",
            scrapRoll: "",
            rolls: "",
            panels: "",
            panelLength: "",
            consumption: "",
            bagno: "",
            sizes: "ALL",
            status: "not_ready",
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
          const usableWidth = parseFloat(field === "usableWidth" ? value : row.usableWidth) || 0;
          const grossLength = parseFloat(field === "grossLength" ? value : row.grossLength) || 0;
          const collWidthMM = parseFloat(field === "collarettoWidth" ? value : row.collarettoWidth) || 0;
          const collWidthM = collWidthMM / 1000;

          // pcsSeamtoSeam logic
          if (field === "pcsSeamtoSeam") {
            updatedRow.pcsSeamtoSeam = value;
            updatedRow.isPcsSeamCalculated = false;
          } else {
            if (!row.pcsSeamtoSeam || row.isPcsSeamCalculated) {
              const seamTotal = (usableWidth / 100) * Math.SQRT2;
              updatedRow.pcsSeamtoSeam = seamTotal > 0 && grossLength > 0
                ? (seamTotal / grossLength).toFixed(1)
                : "";
              updatedRow.isPcsSeamCalculated = true;
            }
          }

          const scrap = parseFloat(field === "scrapRoll" ? value : row.scrapRoll) || 0;

          // NEW CALCULATIONS BASED ON USABLE WIDTH

          // Panel length = usable width converted to meters
          const panelLength = usableWidth / 100; // Convert cm to meters
          updatedRow.panelLength = panelLength.toFixed(2);

          // N° Rolls = rewound width ÷ collaretto width - scrap
          // Hardcoded rewound width = 90 cm, convert to mm for calculation
          const rewoundWidthMM = 90 * 10; // Convert cm to mm
          const rollsCalc = !isNaN(collWidthMM) && collWidthMM > 0
            ? Math.floor(rewoundWidthMM / collWidthMM) - scrap
            : 0;
          updatedRow.rolls = rollsCalc > 0 ? rollsCalc.toString() : "";

          const pieces = parseFloat(field === "pieces" ? value : row.pieces);
          const rolls = parseFloat(updatedRow.rolls);
          const pcsSeam = parseFloat(updatedRow.pcsSeamtoSeam);

          // Get the table to access biasExtra
          const currentTable = prevTables.find(t => t.id === tableId);
          const extra = parseFloat(currentTable?.biasExtra) / 100 || 0;
          const panelsCalculation = (pieces * (1 + extra)) / (rolls * pcsSeam);
          if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
            const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
            updatedRow.panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
          } else {
            updatedRow.panels = "";
          }

          const panels = parseFloat(updatedRow.panels);

          // NEW Consumption calculation: usable width × number of panels
          // Convert usable width from cm to meters for calculation
          const usableWidthM = usableWidth / 100;
          updatedRow.consumption = !isNaN(panels) && !isNaN(usableWidthM) && panels > 0 && usableWidthM > 0
            ? (usableWidthM * panels).toFixed(2)
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
            tableType: 'bias'
          }
        }));

        // Remove the timeout reference
        delete window.collarettoBagnoChangeTimeouts[rowId];
      }, 500);
    }

    // ✅ Dispatch event when sizes field is changed to auto-update pieces based on new size selection
    if (field === "sizes" && value) {
      // Get the current bagno for this row to trigger auto-fetch with new sizes
      const currentRow = biasTables.find(t => t.id === tableId)?.rows.find(r => r.id === rowId);
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
              tableType: 'bias'
            }
          }));
        }, 100); // 100ms delay to allow state update
      }
    }

    setUnsavedChanges(true);
  };

  const handleExtraChange = (tableId, value) => {
    const extra = parseFloat(value) / 100 || 0;

    setBiasTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;

      const updatedRows = table.rows.map(row => {
        const pieces = parseFloat(row.pieces);
        const pcsSeam = parseFloat(row.pcsSeamtoSeam);
        const usableWidth = parseFloat(row.usableWidth);
        const collWidthMM = parseFloat(row.collarettoWidth);
        const scrap = parseFloat(row.scrapRoll) || 0;

        // Panel length = usable width converted to meters
        const panelLength = usableWidth / 100;

        // Recalculate N° Rolls = rewound width ÷ collaretto width - scrap
        // Hardcoded rewound width = 90 cm, convert to mm for calculation
        const rewoundWidthMM = 90 * 10; // Convert cm to mm
        const rollsCalc = !isNaN(collWidthMM) && collWidthMM > 0
          ? Math.floor(rewoundWidthMM / collWidthMM) - scrap
          : 0;
        const rolls = rollsCalc > 0 ? rollsCalc : 0;

        // Calculate panels with extra percentage
        const panelsCalculation = (pieces * (1 + extra)) / (rolls * pcsSeam);
        let panels = "";
        if (!isNaN(pieces) && !isNaN(rolls) && !isNaN(pcsSeam) && rolls > 0 && pcsSeam > 0) {
          const decimalPart = panelsCalculation - Math.floor(panelsCalculation);
          panels = decimalPart > 0.15 ? Math.ceil(panelsCalculation) : Math.floor(panelsCalculation);
        }

        // NEW Consumption calculation: usable width × number of panels
        const rowUsableWidth = parseFloat(row.usableWidth);
        const usableWidthM = rowUsableWidth / 100; // Convert cm to meters
        const consumption = !isNaN(panels) && !isNaN(usableWidthM) && panels > 0 && usableWidthM > 0
          ? (usableWidthM * panels).toFixed(2)
          : "";

        return {
          ...row,
          rolls: rolls > 0 ? rolls.toString() : "",
          panels: panels,
          panelLength: panelLength.toFixed(2),
          consumption: consumption
        };
      });

      return { ...table, biasExtra: value, rows: updatedRows };
    }));

    setUnsavedChanges(true);
  };

  return {
    biasTables,
    setBiasTables,
    handleAddBias,
    handleRemoveBias,
    handleAddRow,
    handleRemoveRow,
    handleInputChange,
    handleExtraChange
  };
};

export default useBiasTables;
