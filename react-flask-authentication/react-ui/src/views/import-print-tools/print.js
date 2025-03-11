import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Checkbox } from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Print = () => {
    const [mattresses, setMattresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPDF, setLoadingPDF] = useState(false);  // New state for loading PDF
    const [orderFilter, setOrderFilter] = useState('');
    const [mattressFilter, setMattressFilter] = useState('');
    const [selectedItems, setSelectedItems] = useState({}); // State to track selected items (order + mattress)

    // Fetch the mattress list (without details)
    useEffect(() => {
        axios.get('http://127.0.0.1:5000/api/mattress/all') // API route to get all mattresses
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

    // Generate a unique key for each item (order + mattress)
    const getUniqueKey = (order, mattress) => `${order}-${mattress}`;

    // Handle checkbox selection
    const handleSelectItem = (order, mattress) => {
        const key = getUniqueKey(order, mattress);
        setSelectedItems((prevSelected) => ({
            ...prevSelected,
            [key]: !prevSelected[key], // Toggle selection
        }));
    };

    // Generate PDF function
  const generatePDF = () => {
    // Get selected mattress keys
    const selectedMattresses = Object.keys(selectedItems).filter(key => selectedItems[key]);

    // If no mattress is selected, show an alert and stop execution
    if (selectedMattresses.length === 0) {
        window.alert("Please select at least one mattress before generating the PDF.");
        return;
    }

    setLoadingPDF(true); // Show loading indicator while generating PDF

    axios.get('http://127.0.0.1:5000/api/mattress/all_with_details')
        .then(response => {
            if (response.data.success) {
                const mattressesWithDetails = response.data.data;
                const doc = new jsPDF();

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.text("Mattress Report", 105, 10, { align: "center" });

                doc.setLineWidth(0.5);
                doc.line(10, 15, 200, 15);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);

                // Filter mattresses based on selection
                const filteredMattresses = mattresses.filter(mattress =>
                    selectedItems[getUniqueKey(mattress.order_commessa, mattress.mattress)]
                );

                const tableData = filteredMattresses.map((mattress, index) => [
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
                    styles: { 
                        fontSize: 10, 
                        cellPadding: 3,
                        font: "helvetica", 
                        lineColor: [44, 62, 80],
                        lineWidth: 0.3,
                        fillColor: [240, 240, 240], 
                    },
                    columnStyles: { 
                        0: { cellWidth: 10 },
                        1: { cellWidth: 40 },
                        2: { cellWidth: 40 }
                    },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                });

                filteredMattresses.forEach((mattress, index) => {
                    const yOffset = doc.lastAutoTable.finalY + 10 + (index * 60);
                    doc.text(`Mattress: ${mattress.mattress} (${mattress.order_commessa})`, 10, yOffset);

                    const mattressWithDetails = mattressesWithDetails.find(m => m.mattress === mattress.mattress && m.order_commessa === mattress.order_commessa);

                    if (mattressWithDetails?.details?.length) {
                        mattressWithDetails.details.forEach((detail, i) => {
                            doc.text(`Layer: ${detail.layers}`, 10, yOffset + (i + 1) * 10);
                            doc.text(`Planned Consumption: ${detail.cons_planned}`, 10, yOffset + (i + 1) * 20);
                            doc.text(`Actual Consumption: ${detail.cons_actual}`, 10, yOffset + (i + 1) * 30);
                        });
                    }

                    if (mattressWithDetails?.markers?.length) {
                        mattressWithDetails.markers.forEach((marker, i) => {
                            doc.text(`Marker: ${marker.marker_name}`, 10, yOffset + 50 + (i + 1) * 10);
                            doc.text(`Width: ${marker.marker_width}`, 10, yOffset + 50 + (i + 1) * 20);
                            doc.text(`Length: ${marker.marker_length}`, 10, yOffset + 50 + (i + 1) * 30);
                        });
                    }
                });

                doc.setFontSize(8);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, doc.lastAutoTable.finalY + 10, { align: "center" });

                doc.save("mattresses_report_with_details.pdf");
            } else {
                console.error("Failed to fetch mattress details");
            }
        })
        .catch(error => {
            console.error("Error fetching mattress details:", error);
        })
        .finally(() => setLoadingPDF(false));
};



    const filteredMattresses = mattresses.filter(mattress =>
        mattress.order_commessa.includes(orderFilter) &&
        mattress.mattress.includes(mattressFilter)
    );

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Mattress Report</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                    label="Filter by Order"
                    variant="outlined"
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                />
                <TextField
                    label="Filter by Mattress"
                    variant="outlined"
                    value={mattressFilter}
                    onChange={(e) => setMattressFilter(e.target.value)}
                />
                <Button variant="contained" color="primary" onClick={generatePDF} disabled={loadingPDF}>
                    {loadingPDF ? "Generating PDF..." : "Generate PDF"}
                </Button>
            </Box>
            {loading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Select</TableCell>
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
                            {filteredMattresses.map((mattress, index) => {
                                const uniqueKey = getUniqueKey(mattress.order_commessa, mattress.mattress);
                                return (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Checkbox
                                                checked={!!selectedItems[uniqueKey]} // Check if item is selected
                                                onChange={() => handleSelectItem(mattress.order_commessa, mattress.mattress)} // Toggle selection
                                            />
                                        </TableCell>
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};
export default Print; 