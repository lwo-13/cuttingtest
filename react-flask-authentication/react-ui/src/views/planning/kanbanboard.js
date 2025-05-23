import React, { useEffect, useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Paper, Box, Grid, Button, Typography } from "@mui/material"; 
import MainCard from "../../ui-component/cards/MainCard"; 
import axios from 'utils/axiosInstance';
import Tooltip from '@mui/material/Tooltip';
import { useSelector } from "react-redux";

const devices = ["SP0", "SP1", "SP2", "SP3", "MS"];

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
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  
  const handleDragScroll = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const baseSpeed = 5; // Lower base speed for smoother scrolling
    
    // Calculate distances from top and bottom of container
    const distanceFromTop = e.clientY - containerRect.top;
    const distanceFromBottom = containerRect.bottom - e.clientY;
    const threshold = 150; // Increased threshold for earlier activation
    
    const animate = () => {
      if (!container) return;
      
      let scrollDelta = 0;
      
      // Calculate scroll speed based on distance from edges
      if (distanceFromTop < threshold) {
        const intensity = 1 - (distanceFromTop / threshold);
        scrollDelta = -baseSpeed * intensity * intensity; // Quadratic easing
      } else if (distanceFromBottom < threshold) {
        const intensity = 1 - (distanceFromBottom / threshold);
        scrollDelta = baseSpeed * intensity * intensity; // Quadratic easing
      }
      
      if (scrollDelta !== 0) {
        const newScrollTop = Math.max(0, Math.min(
          container.scrollHeight - container.clientHeight,
          container.scrollTop + scrollDelta
        ));
        container.scrollTop = newScrollTop;
        scrollAnimationRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Cancel any existing animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    
    // Start new animation if we're in the scroll zones
    if (distanceFromTop < threshold || distanceFromBottom < threshold) {
      scrollAnimationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    fetchMattresses();
  }, [selectedDay]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, []);

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

  // Add event listeners for drag scroll
  useEffect(() => {
    window.addEventListener('dragover', handleDragScroll);
    return () => {
      window.removeEventListener('dragover', handleDragScroll);
    };
  }, []);

  return (
    <>
      <FilterBar selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
      <DndProvider backend={HTML5Backend}>
        <Box 
          ref={scrollContainerRef}
          display="flex" 
          gap={2} 
          p={2} 
          sx={{ 
            width: '100%', 
            height: 'calc(100vh - 180px)', // Adjust based on your layout
            overflowX: 'auto',
            overflowY: 'auto',
            alignItems: 'start', 
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { 
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px'
            }
          }}
        >
          {devices.map((device) => (
            <KanbanColumn
              key={device}
              device={device}
              mattresses={
                device === "SP0"
                  ? mattresses
                      .filter((m) => m.status === "0 - NOT SET")
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  : mattresses
                      .filter(
                        (m) =>
                          m.device === device &&
                          (m.status === "1 - TO LOAD" || m.status === "2 - ON SPREAD")
                      )
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
  const [searchTerm, setSearchTerm] = useState("");
  
  const sortedMattresses = [...mattresses].sort((a, b) => a.position - b.position);
  const firstShift = sortedMattresses.filter(m => m.shift === '1shift');
  const secondShift = sortedMattresses.filter(m => m.shift === '2shift');

  // Filter mattresses based on search term for SP0
  const filteredMattresses = device === "SP0" 
    ? sortedMattresses.filter(m => 
        m.mattress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.order_commessa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.fabric_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.marker?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedMattresses;  const [{ isOverFirst }, dropFirst] = useDrop({
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
  });  const [{ isOverSecond }, dropSecond] = useDrop({
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
  });return (
    <Box sx={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', minWidth: '300px', maxWidth: '100%' }}>
      <Paper sx={{ p: 1, bgcolor: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 2, mb: 2 }}>
        {device === "SP0" ? "To Assign" : device}
        {device === "SP0" && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <input
              type="text"
              placeholder="Search by order, fabric, marker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '0.9rem',
                width: '90%', // or a fixed width like '250px'
                textAlign: 'center'
              }}
            />
          </Box>
        )}
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
          {filteredMattresses.map((m, index) => <KanbanItem key={m.id} mattress={m} index={index} />)}
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
    hover: (item, monitor) => {
      if (!ref.current || item.id === mattress.id) {
        return;
      }

      // Only handle hover if in same column/shift
      if (item.fromDevice === mattress.device && item.fromShift === mattress.shift) {
        const dragIndex = item.index;
        const hoverIndex = index;

        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // Moving downwards
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        // Moving upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }

        item.index = hoverIndex;
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
      {mattress.sizes && mattress.sizes !== '--' && (<Box><strong>Sizes:</strong> {mattress.sizes}</Box>)}
      <strong>Consumption:</strong> {mattress.consumption} m<br />
      <strong>Spreading Method:</strong> {mattress.spreading_method} <br />
    </Box>
  );

  const content = (
    <MainCard ref={ref} sx={{ mb: 1, opacity: isDragging ? 0.5 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <strong>Mattress:</strong> {mattress.mattress} <br />
      {mattress.marker && mattress.marker !== '--' && (<><strong>Marker:</strong> {mattress.marker} <br /></>)}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
        {mattress.total_pcs > 0 && (
          <Box sx={{
            display: 'flex',
            alignItems: 'baseline',
            bgcolor: '#e3f2fd',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            minWidth: 80,
            justifyContent: 'center'
          }}>
            <Typography variant="h4" color="#2196f3" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
              {mattress.total_pcs}
            </Typography>
            <Typography sx={{ ml: 1, fontSize: '0.9rem', color: '#1976d2' }}>pcs</Typography>
          </Box>
        )}

        <Box sx={{
          display: 'flex',
          alignItems: 'baseline',
          bgcolor: '#f3e5f5',
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          minWidth: 80,
          justifyContent: 'center'
        }}>
          <Typography variant="h4" color="#9c27b0" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
            {mattress.layers || 0}
          </Typography>
          <Typography sx={{ ml: 1, fontSize: '0.9rem', color: '#7b1fa2' }}>layers</Typography>
        </Box>
      </Box>
    </MainCard>
  );

  return isDragging ? content : <Tooltip title={tooltipContent} arrow placement="right" enterDelay={300}>{content}</Tooltip>;
};

export default KanbanBoard;
