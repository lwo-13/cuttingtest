import { useEffect, useState } from 'react';

const useAvgConsumption = (tables, getTablePlannedQuantities) => {
  const [avgConsumption, setAvgConsumption] = useState({});

  useEffect(() => {
    if (!tables || tables.length === 0) return;

    const newAvgConsumption = {};
    tables.forEach(table => {
      newAvgConsumption[table.id] = calculateTableAverageConsumption(table, getTablePlannedQuantities);
    });

    setAvgConsumption(newAvgConsumption);
  }, [tables, getTablePlannedQuantities]);

  return avgConsumption;
};

const calculateTableAverageConsumption = (table, getTablePlannedQuantities) => {
  if (!table || !table.rows || table.rows.length === 0) return 0;

  const plannedQuantities = getTablePlannedQuantities(table) || {};
  const totalPlannedPcs = Object.values(plannedQuantities)
    .reduce((sum, qty) => sum + (parseFloat(qty) || 0), 0);

  const totalConsPlanned = table.rows
    .filter(row => !isNaN(parseFloat(row.expectedConsumption)) && parseFloat(row.expectedConsumption) > 0)
    .reduce((sum, row) => sum + parseFloat(row.expectedConsumption), 0);

  if (totalPlannedPcs === 0) return 0;

  const avgConsumption = totalConsPlanned / totalPlannedPcs;
  return Number(avgConsumption.toFixed(2));
};

export default useAvgConsumption;
