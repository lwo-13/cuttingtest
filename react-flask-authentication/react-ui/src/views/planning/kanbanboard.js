import React, { useEffect, useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Paper, Box, Grid, Button } from "@mui/material"; 
import MainCard from "../../ui-component/cards/MainCard"; 
import axios from 'utils/axiosInstance';
import Tooltip from '@mui/material/Tooltip';
import { useSelector } from "react-redux";

const devices = ["SP0", "SP1", "SP2", "SP3"];

const FilterBar = ({ selectedDay, setSelectedDay }) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", bgcolor: "white", p: 2, borderRadius: 2, mb: 2 }}>
      <Button variant={selectedDay === "Today" ? "contained" : "outlined"} color="primary" onClick={() => setSelectedDay("Today")} sx={{ mr: 2 }}>Today</Button>
      <Button variant={selectedDay === "Tomorrow" ? "contained" : "outlined"} color="secondary" onClick={() => setSelectedDay("Tomorrow")}>Tomorrow</Button>
    </Box>
  );
};

const KanbanBoard = () => {
  const [mattresses, setMattresses] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Today");
  const username = useSelector((state) => state.account?.user?.username) || "Unknown";

  useEffect(() => {
    fetchMattresses();
  }, [selectedDay]);

  const fetchMattresses = () => {
    axios.get(`/mattress/kanban?day=${selectedDay.toLowerCase()}`)
      .then((res) => {
        if (res.data.success) {
          setMattresses(res.data.data);
        } else {
          console.error("Error fetching data:", res.data.message);
        }
      })
      .catch((err) => console.error("API Error:", err));
  };

  const moveMattress = (id, newDevice, shift, position = null) => {
    const prevMattresses = [...mattresses];
    setMattresses((prev) => prev.map((m) => (m.id === id ? { ...m, device: newDevice, shift } : m)));

    axios.put(`/mattress/update_device/${id}`, {
      device: newDevice,
      shift,
      day: selectedDay.toLowerCase(),
      operator: username,
      position
    })
    .then(() => fetchMattresses())
    .catch((err) => {
      console.error("Failed to update:", err);
      setMattresses(prevMattresses);
    });
  };

  const updateMattressPosition = (mattressId, newPosition, shift, day) => {
    axios.put(`/mattress/update_position/${mattressId}`, {
      position: newPosition,
      shift: shift,
      day: day.toLowerCase()
    })
    .then(() => {
      console.log("Position updated");
      axios.get(`/mattress/kanban?day=${day.toLowerCase()}`)
        .then((res) => {
          if (res.data.success) {
            setMattresses(res.data.data);
          }
        });
    })
    .catch(err => console.error("Failed to update position:", err));
  };

  return (
    <>
      <FilterBar selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
      <DndProvider backend={HTML5Backend}>
        <Box display="flex" gap={2} p={0} sx={{ width: '100%', overflowX: 'auto', alignItems: 'start', scrollbarWidth: 'thin', '&::-webkit-scrollbar': { height: '8px' } }}>
          {devices.map((device) => (
            <KanbanColumn
              key={device}
              device={device}
              mattresses={device === "SP0"
                ? mattresses.filter((m) => m.status === "0 - NOT SET")
                : mattresses.filter((m) => m.device === device && (m.status === "1 - TO LOAD" || m.status === "2 - ON SPREAD"))
              }
              moveMattress={moveMattress}
              selectedDay={selectedDay}
              updateMattressPosition={updateMattressPosition} 
            />
          ))}
        </Box>
      </DndProvider>
    </>
  );
};

const KanbanColumn = ({ device, mattresses, moveMattress, selectedDay, updateMattressPosition }) => {
  const isSpreader = device !== "SP0";
  const sortedMattresses = [...mattresses].sort((a, b) => a.position - b.position);
  const firstShift = sortedMattresses.filter(m => m.shift === '1shift');
  const secondShift = sortedMattresses.filter(m => m.shift === '2shift');

  const [{ isOverFirst }, dropFirst] = useDrop({
    accept: "MATTRESS",
    drop: (item, monitor) => {
      if (item.fromDevice === device && item.fromShift === '1shift') {
        const newIndex = item.index; // ✅ Use updated drop index
        updateMattressPosition(item.id, newIndex, '1shift', selectedDay);
      } else {
        moveMattress(item.id, device, '1shift');
      }
    },
    collect: (monitor) => ({ isOverFirst: !!monitor.isOver() })
  });

  const [{ isOverSecond }, dropSecond] = useDrop({
    accept: "MATTRESS",
    drop: (item, monitor) => {
      if (item.fromDevice === device && item.fromShift === '2shift') {
        const newIndex = item.index; // ✅ Use updated drop index
        updateMattressPosition(item.id, newIndex, '2shift', selectedDay);
      } else {
        moveMattress(item.id, device, '2shift');
      }
    },
    collect: (monitor) => ({ isOverSecond: !!monitor.isOver() })
  });

  return (
    <Box sx={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', minWidth: '300px', maxWidth: '100%' }}>
      <Paper sx={{ p: 1, bgcolor: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 2, mb: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {device === "SP0" ? "To Assign" : device}
      </Paper>
      {isSpreader ? (
        <>
          <Paper ref={dropFirst} sx={{ p: 2, bgcolor: isOverFirst ? "green.200" : "#f5f5f5", flexGrow: 1, borderRadius: 2, minHeight: 200, mb: 2 }}>
            <Box sx={{ fontWeight: 'bold', mb: 1 }}>1st Shift</Box>
            {firstShift.map((m, index) => <KanbanItem key={m.id} mattress={m} index={index} />)}
          </Paper>
          <Paper ref={dropSecond} sx={{ p: 2, bgcolor: isOverSecond ? "green.200" : "#f5f5f5", flexGrow: 1, borderRadius: 2, minHeight: 200 }}>
            <Box sx={{ fontWeight: 'bold', mb: 1 }}>2nd Shift</Box>
            {secondShift.map((m, index) => <KanbanItem key={m.id} mattress={m} index={index} />)}
          </Paper>
        </>
      ) : (
        <Paper ref={dropFirst} sx={{ p: 2, bgcolor: isOverFirst ? "green.200" : "#f5f5f5", flexGrow: 1, borderRadius: 2, minHeight: 300 }}>
          {sortedMattresses.map((m, index) => <KanbanItem key={m.id} mattress={m} index={index} />)}
        </Paper>
      )}
    </Box>
  );
};

const KanbanItem = ({ mattress, index }) => {
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: "MATTRESS",
    item: {
      id: mattress.id,
      index,
      fromDevice: mattress.device,
      fromShift: mattress.shift
    },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
  });

  const [, drop] = useDrop({
    accept: "MATTRESS",
    hover: (item) => {
      if (item.id !== mattress.id) {
        item.index = index;
      }
    }
  });

  drag(drop(ref));

  const tooltipContent = (
    <Box>
      <strong>Order:</strong> {mattress.order_commessa} <br />
      <strong>Fabric:</strong> {mattress.fabric_code} &nbsp;&nbsp; {mattress.fabric_color} <br />
      <strong>Bagno:</strong> {mattress.dye_lot} <br />
      <strong>Marker Length:</strong> {mattress.marker_length} m<br />
      <strong>Marker Width:</strong> {mattress.width} cm<br />
      <strong>Layers:</strong> {mattress.layers} <br />
      {mattress.sizes && mattress.sizes !== '--' && (<Box><strong>Sizes:</strong> {mattress.sizes}</Box>)}
      <strong>Consumption:</strong> {mattress.consumption} m<br />
      <strong>Spreading Method:</strong> {mattress.spreading_method} <br />
    </Box>
  );

  const content = (
    <MainCard ref={ref} sx={{ mb: 1, opacity: isDragging ? 0.5 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <strong>Mattress:</strong> {mattress.mattress} <br />
      {mattress.marker && mattress.marker !== '--' && (<><strong>Marker:</strong> {mattress.marker} <br /></>)}
      {(mattress.total_pcs && mattress.total_pcs !== 0) ? (<><strong>{mattress.total_pcs} pcs</strong><br /></>) : null}
    </MainCard>
  );

  return isDragging ? content : <Tooltip title={tooltipContent} arrow placement="right" enterDelay={300}>{content}</Tooltip>;
};

export default KanbanBoard;
