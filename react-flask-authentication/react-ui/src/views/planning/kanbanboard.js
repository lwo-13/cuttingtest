import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Paper, Box, Grid, Button } from "@mui/material"; 
import MainCard from "../../ui-component/cards/MainCard"; 
import axios from "axios";
import Tooltip from '@mui/material/Tooltip';

// Devices as columns
const devices = ["SP0", "SP1", "SP2", "SP3"];

const FilterBar = ({ selectedDay, setSelectedDay }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        bgcolor: "white",  // ✅ White background
        p: 2,
        borderRadius: 2,
        mb: 2
      }}
    >
      <Button
        variant={selectedDay === "Today" ? "contained" : "outlined"}
        color="primary"
        onClick={() => setSelectedDay("Today")}
        sx={{ mr: 2 }}
      >
        Today
      </Button>
      <Button
        variant={selectedDay === "Tomorrow" ? "contained" : "outlined"}
        color="secondary"  // ✅ Now uses the secondary color
        onClick={() => setSelectedDay("Tomorrow")}
      >
        Tomorrow
      </Button>
    </Box>
  );
};

const KanbanBoard = () => {
  const [mattresses, setMattresses] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Today");

  useEffect(() => {
    axios.get(`/mattress/kanban?day=${selectedDay.toLowerCase()}`)
      .then((res) => {
        if (res.data.success) {
          console.log("Kanban Data:", res.data.data); // Debugging
          setMattresses(res.data.data);
        } else {
          console.error("Error fetching data:", res.data.message);
        }
      })
      .catch((err) => console.error("API Error:", err));
  }, [selectedDay]);  // <-- Re-run every time day changes

  const moveMattress = (id, newDevice, shift) => {
    const prevMattresses = [...mattresses]; // Store previous state

    // Optimistically update UI
    setMattresses((prev) =>
      prev.map((m) => (m.id === id ? { ...m, device: newDevice, shift: shift } : m))
    );

    // API call — now passing shift and selectedDay
    axios.put(`/mattress/update_device/${id}`, {
      device: newDevice,
      shift: shift,
      day: selectedDay.toLowerCase()  // 'today' or 'tomorrow'
    })
    .then(() => console.log("Device and Kanban updated successfully"))
    .catch((err) => {
      console.error("Failed to update:", err);
      // Revert only if the API call fails
      setMattresses(prevMattresses);
    });
  };

  return (
    <>
      <FilterBar selectedDay={selectedDay} setSelectedDay={setSelectedDay} />

      <DndProvider backend={HTML5Backend}>
        <Box
          display="flex"
          gap={2}                                // ✅ This is the space between columns (padding effect)
          p={0}
          sx={{
            width: '100%', 
            overflowX: 'auto',
            alignItems: 'start',
            scrollbarWidth: 'thin',               // Optional: nicer scrollbar on Firefox
            '&::-webkit-scrollbar': { height: '8px' }, // Optional: custom scrollbar height for Chrome
          }}
        >
          {devices.map((device) => (
            <KanbanColumn
              key={device}
              device={device}
              mattresses={mattresses.filter((m) => m.device === device)}
              moveMattress={moveMattress}
              selectedDay={selectedDay} // Pass selected day
            />
          ))}
        </Box>
      </DndProvider>
    </>
    );
  };

  const KanbanColumn = ({ device, mattresses, moveMattress }) => {
    const isSpreader = device !== "SP0";
    const firstShift = mattresses.filter(m => m.shift === '1shift');
    const secondShift = mattresses.filter(m => m.shift === '2shift');
  
    // Add separate drop handlers for each shift box
    const [{ isOverFirst }, dropFirst] = useDrop({
      accept: "MATTRESS",
      drop: (item) => moveMattress(item.id, device, '1shift'),
      collect: (monitor) => ({ isOverFirst: !!monitor.isOver() }),
    });
  
    const [{ isOverSecond }, dropSecond] = useDrop({
      accept: "MATTRESS",
      drop: (item) => moveMattress(item.id, device, '2shift'),
      collect: (monitor) => ({ isOverSecond: !!monitor.isOver() }),
    });
  
    return (
      <Box sx={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', minWidth: '300px', maxWidth: '100%' }}>
        <Paper 
          sx={{ 
            p: 1, 
            bgcolor: 'white', 
            textAlign: 'center', 
            fontWeight: 'bold', 
            fontSize: '1.1rem', 
            borderRadius: 2, 
            mb: 2,
            height: 60,           // ✅ Fixed height in pixels
            display: 'flex',      // ✅ Center vertically
            alignItems: 'center', // ✅ Center vertically
            justifyContent: 'center' // ✅ Center horizontally (optional)
          }}
        >
          {device === "SP0" ? "To Assign" : device}
        </Paper>
  
        {isSpreader ? (
          <>
            {/* ✅ 1st Shift Box */}
            <Paper 
              ref={dropFirst} 
              sx={{ p: 2, bgcolor: isOverFirst ? "green.200" : "#f5f5f5", flexGrow: 1, borderRadius: 2, minHeight: 200, mb: 2 }} 
            >
              <Box sx={{ fontWeight: 'bold', mb: 1 }}>1st Shift</Box>
              {firstShift.map((m) => <KanbanItem key={m.id} mattress={m} />)}
            </Paper>

            {/* ✅ 2nd Shift Box */}
            <Paper 
              ref={dropSecond} 
              sx={{ p: 2, bgcolor: isOverSecond ? "green.200" : "#f5f5f5", flexGrow: 1, borderRadius: 2, minHeight: 200 }} 
            >
              <Box sx={{ fontWeight: 'bold', mb: 1 }}>2nd Shift</Box>
              {secondShift.map((m) => <KanbanItem key={m.id} mattress={m} />)}
            </Paper>
          </>
        ) : (
          <Paper 
            ref={dropFirst} 
            sx={{ p: 2, bgcolor: isOverFirst ? "green.200" : "#f5f5f5", flexGrow: 1, borderRadius: 2, minHeight: 300 }} 
          >
            {mattresses.map((m) => <KanbanItem key={m.id} mattress={m} />)}
          </Paper>
        )}
      </Box>
    );
  };

  const KanbanItem = ({ mattress }) => {
    const [{ isDragging }, drag] = useDrag({
      type: "MATTRESS",
      item: { id: mattress.id },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    });
  
    const tooltipContent = (
      <Box>
        <strong>Order:</strong> {mattress.order_commessa} <br />
        <strong>Fabric:</strong> {mattress.fabric_code} &nbsp;&nbsp; {mattress.fabric_color} <br />
        <strong>Bagno:</strong> {mattress.dye_lot} <br />
        <strong>Marker Length:</strong> {mattress.marker_length} m<br />
        <strong>Marker Width:</strong> {mattress.width} cm<br />
        <strong>Layers:</strong> {mattress.layers} <br />

        {mattress.sizes && mattress.sizes !== '--' && (
          <Box><strong>Sizes:</strong> {mattress.sizes}</Box>
        )}

        {(mattress.total_pcs && mattress.total_pcs !== 0) 
          ? <><strong>Total pcs:</strong> {mattress.total_pcs} <br /></> 
          : null}

        <strong> Consumption:</strong> {mattress.consumption} m<br />
        <strong>Spreading Method:</strong> {mattress.spreading_method} <br />
      </Box>
    );
  
    const content = (
      <MainCard
        ref={drag}
        sx={{
          p: 2,
          mb: 2,
          opacity: isDragging ? 0.5 : 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <strong>Mattress:</strong> {mattress.mattress} <br />
        {mattress.marker && mattress.marker !== '--' && (
          <>
            <strong>Marker:</strong> {mattress.marker} <br />
          </>
        )}
      </MainCard>
    );
  
    // Disable tooltip while dragging
    return isDragging ? content : (
      <Tooltip title={tooltipContent} arrow placement="right" enterDelay={300}>
        {content}
      </Tooltip>
    );
  };
  
  export default KanbanBoard;
