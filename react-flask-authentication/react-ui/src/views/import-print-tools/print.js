import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Print = () => {
  const [mattresses, setMattresses] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/mattresses') // Update API URL if needed
      .then(response => {
        setMattresses(response.data);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Mattress Report", 10, 10);
    
    const tableData = mattresses.map((mattress, index) => [
      index + 1,
      mattress.mattress,
      mattress.order_commessa,
      mattress.fabric_type,
      mattress.fabric_code,
      mattress.fabric_color,
      mattress.dye_lot,
      mattress.item_type,
      mattress.spreading_method,
      mattress.created_at
    ]);

    autoTable(doc, {
      head: [['#', 'Mattress', 'Order', 'Fabric Type', 'Fabric Code', 'Color', 'Dye Lot', 'Item Type', 'Spreading', 'Created At']],
      body: tableData,
      startY: 20
    });

    doc.save("mattresses.pdf");
  };

  return (
    <div>
      <h1>Mattress Report</h1>
      <Button variant="contained" onClick={generatePDF}>Generate PDF</Button>
      <ul>
        {mattresses.map((mattress, index) => (
          <li key={index}>
            {mattress.mattress} - {mattress.fabric_type} - {mattress.fabric_color} - {mattress.order_commessa}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Print;
