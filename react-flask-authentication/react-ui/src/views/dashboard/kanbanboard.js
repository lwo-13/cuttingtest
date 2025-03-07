import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Paper, Box, Grid } from "@mui/material"; 
import MainCard from "../../ui-component/cards/MainCard"; 
import axios from "axios";

// Devices as columns
const devices = ["SP0", "SP1", "SP2", "SP3"];

const KanbanBoard = () => {
  const [mattresses, setMattresses] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/mattresses/kanban") // Fetch only "TO LOAD" mattresses
      .then((res) => {
        if (res.data.success) {
          console.log("Kanban Data:", res.data.data); // Debugging
          setMattresses(res.data.data);
        } else {
          console.error("Error fetching data:", res.data.message);
        }
      })
      .catch((err) => console.error("API Error:", err));
  }, []);

  const moveMattress = (id, newDevice) => {
    const prevMattresses = [...mattresses]; // Store previous state
    setMattresses((prev) =>
      prev.map((m) => (m.id === id ? { ...m, device: newDevice } : m))
    );

    axios.put(`/api/mattresses/${id}`, { device: newDevice })
      .catch((err) => {
        console.error("Failed to update:", err);
        setMattresses(prevMattresses); // Revert UI if API call fails
      });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Grid container spacing={2} p={2}>
        {devices.map((device) => (
          <Grid item xs={12} sm={6} md={3} key={device}>
            <KanbanColumn
              device={device}
              mattresses={mattresses.filter((m) => m.device === device)}
              moveMattress={moveMattress}
            />
          </Grid>
        ))}
      </Grid>
    </DndProvider>
  );
};

const KanbanColumn = ({ device, mattresses, moveMattress }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "MATTRESS",
    drop: (item) => moveMattress(item.id, device),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  });

  return (
    <Paper
      ref={drop}
      sx={{
        p: 2,
        bgcolor: isOver ? "green.200" : "grey.100",
        minHeight: 300,
        flex: 1,
      }}
    >
      <h2>{device}</h2>
      {mattresses.map((m) => (
        <KanbanItem key={m.id} mattress={m} />
      ))}
    </Paper>
  );
};

const KanbanItem = ({ mattress }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "MATTRESS",
    item: { id: mattress.id },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  return (
    <MainCard ref={drag} sx={{ p: 2, mb: 2, opacity: isDragging ? 0.5 : 1 }}>
      <strong>Mattress:</strong> {mattress.mattress} <br />
      <strong>Order:</strong> {mattress.order_commessa} <br />
      <strong>Fabric:</strong> {mattress.fabric_type} <br />
      <strong>Operator:</strong> {mattress.operator || "N/A"} <br />
    </MainCard>
  );
};

export default KanbanBoard;
