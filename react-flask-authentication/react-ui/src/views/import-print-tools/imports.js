import React, { useState } from 'react';
import axios from 'axios';

// material-ui
import { Typography, Button, Card, CardContent, Grid, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField,
  Select, MenuItem, InputLabel, FormControl
} from '@mui/material';

// project imports
import MainCard from '../../ui-component/cards/MainCard';

//==============================|| IMPORT PAGE ||==============================//

const CombinedImports = () => {
  const [selectedXML, setSelectedXML] = useState(null);
  const [selectedMattress, setSelectedMattress] = useState(null);
  const [markerInfo, setMarkerInfo] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [hasEdits, setHasEdits] = useState(false);
  const [creationType, setCreationType] = useState('');

  // Handle XML File Selection
  const handleXMLChange = (event) => {
    setSelectedXML(event.target.files[0]);
  };

  // Parse XML and Open Dialog
  const handleOpenDialog = () => {
    if (!selectedXML) {
      alert('Please select an XML file first.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const xmlString = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // Extract data from <NewVariant> elements inside <MarkerContent>
      const newVariants = Array.from(xmlDoc.getElementsByTagName("NewVariant"));
      const extractedData = newVariants.map((variant) => ({
        style: variant.getElementsByTagName("Model")[0]?.getAttribute("Value") || "N/A", // Extract Model as Style
        size: variant.getElementsByTagName("Size")[0]?.getAttribute("Value") || "N/A",
        qty: variant.getElementsByTagName("Quantity")[0]?.getAttribute("Value") || "0"
      }));

      setMarkerInfo(extractedData);
      setDialogOpen(true);
    };

    reader.readAsText(selectedXML);
  };

  // Handle updates to editable fields
  const handleFieldChange = (index, field, value) => {
    const updatedMarkerInfo = [...markerInfo];
    updatedMarkerInfo[index][field] = value;
    setMarkerInfo(updatedMarkerInfo);
    setHasEdits(true);
  };

  // Handle Creation Type Change
  const handleCreationTypeChange = (event) => {
    setCreationType(event.target.value);
  };

  // Perform the actual import when clicking "Import" inside the dialog
  const handleXMLImport = async () => {
    if (!selectedXML) {
      alert('Please select an XML file first.');
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedXML);
    formData.append("updatedData", JSON.stringify(markerInfo)); // Send updated data
    formData.append("hasEdits", hasEdits); // Indicate if there were edits
    formData.append("creationType", creationType);

    try {
      const response = await axios.post("http://127.0.0.1:5000/api/markers/import_marker", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setImportStatus("✅ XML imported successfully!");
        setTimeout(() => {
          handleDialogClose(); 
        }, 3000);
      } else {
        setImportStatus(`⚠️ Error: ${response.data.msg}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // ✅ Marker already exists
        setImportStatus(`⚠️ ${error.response.data.msg}`);
      } else {
        setImportStatus(`❌ Upload failed: ${error.response?.data?.msg || error.message}`);
      }
    }
  };

  // Handle Mattress File Selection
  const handleMattressChange = (event) => {
    setSelectedMattress(event.target.files[0]);
  };

  const handleMattressImport = () => {
    if (selectedMattress) {
      console.log('Mattress Excel File:', selectedMattress);
      alert(`Mattress Excel File "${selectedMattress.name}" selected for import!`);
    } else {
      alert('Please select a Mattress Excel file first.');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setMarkerInfo([]);
    setImportStatus("");
    setHasEdits(false); // Reset edit flag
    setSelectedXML(null);
    setCreationType('');
  };

  return (
    <MainCard>
      <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2 }}>
        Import Files
      </Typography>
      <Grid container spacing={4}>
        {/* XML Import Section */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" style={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Import Marker (<strong>XML</strong> file)
              </Typography>

              <input
                type="file"
                accept=".xml"
                id="xml-file-input"
                onChange={handleXMLChange}
                style={{ display: 'none' }}
                key={selectedXML ? selectedXML.name : ''} 
              />

              <Button
                variant="outlined"
                component="label"
                htmlFor="xml-file-input"
                style={{ marginTop: '8px' }}
              >
                Choose File
              </Button>

              <Box mt={2}>
                <Typography variant="body2" align="center">
                  {selectedXML ? `${selectedXML.name}` : 'No file chosen'}
                </Typography>
              </Box>

              {/* ✅ This button now opens the dialog after parsing XML */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenDialog}
                disabled={!selectedXML}
                style={{ marginTop: '8px' }}
              >
                Import
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Excel Import Section */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" style={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Import Mattress Plan (<strong>Excel</strong> file)
              </Typography>

              <input
                type="file"
                accept=".xlsx, .xls"
                id="mattress-file-input"
                onChange={handleMattressChange}
                style={{ display: 'none' }}
              />

              <Button
                variant="outlined"
                component="label"
                htmlFor="mattress-file-input"
                style={{ marginTop: '8px' }}
              >
                Choose File
              </Button>

              <Box mt={2}>
                <Typography variant="body2" align="center">
                  {selectedMattress ? `${selectedMattress.name}` : 'No file chosen'}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleMattressImport}
                disabled={!selectedMattress}
                style={{ marginTop: '8px' }}
              >
                Import
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog with Editable Table and Import Button */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogContent>
          {importStatus && (
            <Typography color={importStatus.includes('✅') ? 'green' : 'red'}>
              {importStatus}
            </Typography>
          )}
          {/* Creation Type Dropdown */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Select
              value={creationType}
              onChange={(e) => setCreationType(e.target.value)}
              displayEmpty
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="">
                <em>Select Creation Type</em>
              </MenuItem>
              <MenuItem value="Cloud">Cloud</MenuItem>
              <MenuItem value="Cloud Urgent">Cloud Urgent</MenuItem>
              <MenuItem value="Local">Local</MenuItem>
              <MenuItem value="Manual">Manual</MenuItem>
            </Select>
          </FormControl>

          {markerInfo.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '40%' }}><strong>Style</strong></TableCell>
                    <TableCell sx={{ width: '30%' }}><strong>Size</strong></TableCell>
                    <TableCell sx={{ width: '30%' }}><strong>Quantity</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {markerInfo.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          value={item.style}
                          onChange={(e) => handleFieldChange(index, 'style', e.target.value)}
                          variant="standard"
                          sx={{ width: '150px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 60 }}>
                        <TextField
                          value={item.size}
                          onChange={(e) => handleFieldChange(index, 'size', e.target.value)}
                          variant="standard"
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 60 }}>
                        <TextField
                          value={item.qty}
                          type="number"
                          onChange={(e) => handleFieldChange(index, 'qty', e.target.value)}
                          variant="standard"
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ mt: 2 }}>No data extracted yet.</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', mb: 2  }}>
          {/* Actual Import happens here */}
          <Button
            onClick={handleXMLImport}
            color="primary"
            variant="contained"
            sx={{ mx: 1 }}
            disabled={!creationType || importStatus.includes("already exists")}
          >
            Import
          </Button>

          <Button
            onClick={handleDialogClose}
            color="secondary"
            variant="outlined"
            sx={{ mx: 1 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default CombinedImports;
