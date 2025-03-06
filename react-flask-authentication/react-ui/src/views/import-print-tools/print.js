import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Print = () => {
    const [mattresses, setMattresses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://127.0.0.1:5000/api/mattress/all') // Updated API route
            .then(response => {
                if (response.data.success) {
                    setMattresses(response.data.data);
                } else {
                    console.error("Failed to fetch mattresses");
                }
            })
            .catch(error => {
                console.error("Error fetching mattress data:", error);
            })
            .finally(() => setLoading(false));
    }, []);

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text("Mattress Report", 14, 10);

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
            head: [["#", "Mattress", "Order", "Fabric Type", "Fabric Code", "Color", "Dye Lot", "Item Type", "Spreading", "Created At"]],
            body: tableData,
            startY: 20,
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 40 }, 2: { cellWidth: 40 } }
        });

        doc.save("mattresses_report.pdf");
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Mattress Report</Typography>
            <Button variant="contained" color="primary" onClick={generatePDF} sx={{ mb: 2 }}>Generate PDF</Button>
            {loading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Mattress</TableCell>
                                <TableCell>Order</TableCell>
                                <TableCell>Fabric Type</TableCell>
                                <TableCell>Fabric Code</TableCell>
                                <TableCell>Color</TableCell>
                                <TableCell>Dye Lot</TableCell>
                                <TableCell>Item Type</TableCell>
                                <TableCell>Spreading</TableCell>
                                <TableCell>Created At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mattresses.map((mattress, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{mattress.mattress}</TableCell>
                                    <TableCell>{mattress.order_commessa}</TableCell>
                                    <TableCell>{mattress.fabric_type}</TableCell>
                                    <TableCell>{mattress.fabric_code}</TableCell>
                                    <TableCell>{mattress.fabric_color}</TableCell>
                                    <TableCell>{mattress.dye_lot}</TableCell>
                                    <TableCell>{mattress.item_type}</TableCell>
                                    <TableCell>{mattress.spreading_method}</TableCell>
                                    <TableCell>{mattress.created_at}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default Print;