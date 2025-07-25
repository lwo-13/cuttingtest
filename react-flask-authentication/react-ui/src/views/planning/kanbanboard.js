import React, { useEffect, useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Paper, Box, Grid, Button, Typography, Alert, Snackbar } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import MainCard from "../../ui-component/cards/MainCard";
import axios from 'utils/axiosInstance';
import Tooltip from '@mui/material/Tooltip';
import { useSelector } from "react-redux";
import { useTranslation } from 'react-i18next';

const devices = ["SP0", "SP1", "SP2", "SP3", "MS"];

const FilterBar = ({ selectedDay, setSelectedDay }) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "white", p: 2, borderRadius: 2, mb: 2, gap: 2 }}>
      <Button variant={selectedDay === "Today" ? "contained" : "outlined"} color="primary" onClick={() => setSelectedDay("Today")}>
        {t('common.today', 'Today')}
      </Button>
      <Button variant={selectedDay === "Tomorrow" ? "contained" : "outlined"} color="secondary" onClick={() => setSelectedDay("Tomorrow")}>
        {t('common.tomorrow', 'Tomorrow')}
      </Button>
      {/* Manual transition button - commented out as requested
      <Button
        variant="outlined"
        color="warning"
        onClick={onTransitionDay}
        disabled={isTransitioning}
        sx={{ ml: 2 }}
      >
        {isTransitioning ? t('common.processing') : "Move Tomorrow → Today"}
      </Button>
      */}
    </Box>
  );
};

const KanbanBoard = () => {
  const { t } = useTranslation();
  const [mattresses, setMattresses] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Today");
  const username = useSelector((state) => state.account?.user?.username) || "Unknown";
  const scrollContainerRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");
  const [showTransitionAlert, setShowTransitionAlert] = useState(false);

  const handleDragScroll = (e) => {
    const container = scrollContainerRef.current;
    // Only scroll if we're actually dragging something
    if (!container || !isDragging) return;

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
      .catch((err) => {
        console.error("API Error:", err);
        console.error("Error details:", err.response?.data);
      });
  };

  // Function to check if day transition is needed (database-based)
  const checkForDayTransition = async () => {
    try {
      const response = await axios.post('/mattress/check_day_transition');
      if (response.data.success) {
        if (!response.data.already_done && response.data.moved_count > 0) {
          // Show notification only if transition actually happened
          setTransitionMessage(`Automatic day transition: moved ${response.data.moved_count} items from tomorrow to today`);
          setShowTransitionAlert(true);
          // Refresh the current view to show the changes
          fetchMattresses();
        }
      } else {
        console.error('Day transition check failed:', response.data.message);
      }
    } catch (error) {
      console.error('Day transition check error:', error);
    }
  };

  // Check for day transition on component mount and periodically
  useEffect(() => {
    checkForDayTransition();

    // Check every hour for day changes
    const interval = setInterval(checkForDayTransition, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const moveMattress = async (id, targetDevice, targetShift, targetPosition = null) => {
    const prevMattresses = [...mattresses];

    // MS validation: Check if trying to move AS mattress to MS device
    const mattressToMove = mattresses.find(m => m.id === id);
    if (mattressToMove && targetDevice === "MS" && mattressToMove.spreading_method !== "MANUAL") {
      setTransitionMessage("ERROR: Only Manual Spreading (MS) mattresses can be assigned to MS device");
      setShowTransitionAlert(true);
      return;
    }

    // AS validation: Check if trying to move MS mattress to AS device
    if (mattressToMove && ["SP1", "SP2", "SP3"].includes(targetDevice) && mattressToMove.spreading_method === "MANUAL") {
      setTransitionMessage("ERROR: Manual Spreading (MS) mattresses cannot be assigned to automatic spreader devices. Use MS device instead.");
      setShowTransitionAlert(true);
      return;
    }

    // Immediate optimistic update for better UX
    setMattresses((prev) => {
      const mattressToMove = prev.find(m => m.id === id);
      if (!mattressToMove) return prev;

      // Check if this is a same-column move
      const isSameColumn = mattressToMove.device === targetDevice && mattressToMove.shift === targetShift;

      if (isSameColumn && targetPosition !== null) {
        // Same column reordering - handle precisely
        const columnItems = prev.filter(m =>
          m.device === targetDevice && m.shift === targetShift
        ).sort((a, b) => a.position - b.position);

        const otherItems = prev.filter(m =>
          !(m.device === targetDevice && m.shift === targetShift)
        );

        // Remove the item being moved
        const filteredColumnItems = columnItems.filter(m => m.id !== id);

        // Insert at target position
        const updatedMattress = { ...mattressToMove, device: targetDevice, shift: targetShift };
        filteredColumnItems.splice(targetPosition, 0, updatedMattress);

        return [...otherItems, ...filteredColumnItems];
      } else {
        // Cross-column move or move to SP0/MS
        const updatedMattress = {
          ...mattressToMove,
          device: targetDevice,
          shift: targetDevice === "MS" ? null : targetShift // MS doesn't use shifts
        };

        // Remove from current position
        let result = prev.filter(m => m.id !== id);

        // Add to new position
        if (targetDevice === "SP0" || targetDevice === "MS") {
          // Moving to unassigned or MS - just add to the list
          result.push(updatedMattress);
        } else {
          // Moving to spreader column
          const targetColumnItems = result.filter(m =>
            m.device === targetDevice && m.shift === targetShift
          ).sort((a, b) => a.position - b.position);

          if (targetPosition !== null && targetPosition <= targetColumnItems.length) {
            // Insert at specific position
            const otherItems = result.filter(m =>
              !(m.device === targetDevice && m.shift === targetShift)
            );

            // Insert at target position
            targetColumnItems.splice(targetPosition, 0, updatedMattress);
            result = [...otherItems, ...targetColumnItems];
          } else {
            // Add to end
            result.push(updatedMattress);
          }
        }

        return result;
      }
    });

    // API call using axios instance (respects REACT_APP_BACKEND_SERVER)
    const payload = {
      device: targetDevice,
      shift: targetShift,
      day: selectedDay.toLowerCase(),
      operator: username,
      position: targetPosition
    };

    try {
      const response = await axios.put(`/mattress/move_mattress/${id}`, payload);

      if (response.data.success) {
        // Refresh after short delay to show the movement
        setTimeout(() => {
          fetchMattresses();
        }, 300);
      } else {
        throw new Error(response.data.message || 'Move failed');
      }
    } catch (err) {
      console.error("Failed to move mattress:", err);

      // Try fallback to old endpoint
      try {
        const fallbackResponse = await axios.put(`/mattress/update_device/${id}`, payload);

        if (fallbackResponse.data.success) {
          setTimeout(() => {
            fetchMattresses();
          }, 300);
        } else {
          throw new Error('Fallback also failed');
        }
      } catch (fallbackErr) {
        console.error("Both endpoints failed:", fallbackErr);
        // Rollback optimistic update
        setMattresses(prevMattresses);
      }
    }
  };

  // Add event listeners for drag scroll
  useEffect(() => {
    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => setIsDragging(false);

    window.addEventListener('dragover', handleDragScroll);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drop', handleDragEnd);

    return () => {
      window.removeEventListener('dragover', handleDragScroll);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDragEnd);
    };
  }, [isDragging]);

  return (
    <>
      <FilterBar
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />
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
                      .sort((a, b) => {
                        // First sort by order_commessa
                        const orderComparison = (a.order_commessa || '').localeCompare(b.order_commessa || '');
                        if (orderComparison !== 0) return orderComparison;

                        // Then sort by bagno (dye_lot)
                        return (a.dye_lot || '').localeCompare(b.dye_lot || '');
                      })
                  : mattresses
                      .filter(
                        (m) =>
                          m.device === device &&
                          (m.status === "1 - TO LOAD" || m.status === "2 - ON SPREAD" || m.status === "PENDING APPROVAL")
                      )
              }
              moveMattress={moveMattress}
              selectedDay={selectedDay}
            />
          ))}
        </Box>
      </DndProvider>

      {/* Notification Snackbar */}
      <Snackbar
        open={showTransitionAlert}
        autoHideDuration={6000}
        onClose={() => setShowTransitionAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowTransitionAlert(false)}
          severity={transitionMessage.includes('Error') || transitionMessage.includes('Failed') || transitionMessage.includes('ERROR') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {transitionMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

const KanbanColumn = ({ device, mattresses, moveMattress, selectedDay }) => {
  const { t } = useTranslation();
  const isSpreader = device !== "SP0" && device !== "MS"; // MS is treated like SP0 (single column)
  const [searchTerm, setSearchTerm] = useState("");

  // Show More functionality for SP0 (not set) column
  const [visibleCount, setVisibleCount] = useState(20); // Show first 20 mattresses
  const incrementCount = 10; // Show 10 more each time

  const sortedMattresses = [...mattresses].sort((a, b) => a.position - b.position);
  const firstShift = sortedMattresses.filter(m => m.shift === '1shift');
  const secondShift = sortedMattresses.filter(m => m.shift === '2shift');

  // Filter mattresses based on search term for SP0 only
  const filteredMattresses = device === "SP0"
    ? sortedMattresses.filter(m =>
        m.mattress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.order_commessa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.fabric_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.marker?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedMattresses;

  // Visible mattresses for SP0 column (with Show More functionality)
  const visibleMattresses = device === "SP0" ? filteredMattresses.slice(0, visibleCount) : filteredMattresses;
  const hasMoreMattresses = device === "SP0" && filteredMattresses.length > visibleCount;

  // Reset visible count when search term changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (device === "SP0") {
      setVisibleCount(20); // Reset to initial count when searching
    }
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + incrementCount);
  };

  const [{ isOverFirst }, dropFirst] = useDrop({
    accept: "MATTRESS",
    drop: (item, monitor) => {
      // Always use target position if available (from hover over specific cards)
      const targetPosition = item.targetPosition !== undefined ? item.targetPosition : null;
      moveMattress(item.id, device, '1shift', targetPosition);
    },
    collect: (monitor) => ({ isOverFirst: !!monitor.isOver() })
  });

  const [{ isOverSecond }, dropSecond] = useDrop({
    accept: "MATTRESS",
    drop: (item, monitor) => {
      // Always use target position if available (from hover over specific cards)
      const targetPosition = item.targetPosition !== undefined ? item.targetPosition : null;
      moveMattress(item.id, device, '2shift', targetPosition);
    },
    collect: (monitor) => ({ isOverSecond: !!monitor.isOver() })
  });

  // For SP0 (unassigned) column
  const [{ isOverUnassigned }, dropUnassigned] = useDrop({
    accept: "MATTRESS",
    drop: (item, monitor) => {
      moveMattress(item.id, "SP0", null, null);
    },
    collect: (monitor) => ({ isOverUnassigned: !!monitor.isOver() })
  });

  // For MS (manual spreading) column
  const [{ isOverMS }, dropMS] = useDrop({
    accept: "MATTRESS",
    drop: (item, monitor) => {
      moveMattress(item.id, "MS", null, null);
    },
    collect: (monitor) => ({ isOverMS: !!monitor.isOver() })
  });

  return (
    <Box sx={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', minWidth: '300px', maxWidth: '300px' }}>
      <Paper sx={{ p: 1, bgcolor: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 2, mb: 2 }}>
        {device === "SP0" ? t('kanban.toAssign') : device === "MS" ? t('kanban.manualSpreading') : device}
        {device === "SP0" && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <input
              type="text"
              placeholder={t('kanban.searchPlaceholder')}
              value={searchTerm}
              onChange={handleSearchChange}
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
          <Paper ref={dropFirst} sx={{ p: 2, bgcolor: isOverFirst ? "#e1bee7" : "#f5f5f5", flexGrow: 1, borderRadius: 2, minHeight: 200, mb: 2, border: isOverFirst ? "2px dashed #9c27b0" : "2px solid transparent" }}>
            <Box sx={{ fontWeight: 'bold', mb: 1 }}>{t('kanban.firstShift')}</Box>
            {firstShift.map((m, index) => <KanbanItem key={m.id} mattress={m} index={index} shift="1shift" device={device} />)}
          </Paper>
          <Paper ref={dropSecond} sx={{ p: 2, bgcolor: isOverSecond ? "#e1bee7" : "#f5f5f5", flexGrow: 1, borderRadius: 2, minHeight: 200, border: isOverSecond ? "2px dashed #9c27b0" : "2px solid transparent" }}>
            <Box sx={{ fontWeight: 'bold', mb: 1 }}>{t('kanban.secondShift')}</Box>
            {secondShift.map((m, index) => <KanbanItem key={m.id} mattress={m} index={index} shift="2shift" device={device} />)}
          </Paper>
        </>
      ) : (
        <Paper
          ref={device === "SP0" ? dropUnassigned : device === "MS" ? dropMS : dropFirst}
          sx={{
            p: 2,
            bgcolor: (device === "SP0" ? isOverUnassigned : device === "MS" ? isOverMS : isOverFirst) ? "#e1bee7" : "#f5f5f5",
            flexGrow: 1,
            borderRadius: 2,
            minHeight: 300,
            border: (device === "SP0" ? isOverUnassigned : device === "MS" ? isOverMS : isOverFirst) ? "2px dashed #9c27b0" : "2px solid transparent"
          }}
        >
          {visibleMattresses.map((m, index) => <KanbanItem key={m.id} mattress={m} index={index} shift={null} device={device} />)}
          {hasMoreMattresses && (
            <Box
              onClick={handleShowMore}
              sx={{
                p: 2,
                mb: 1,
                bgcolor: '#f0f0f0',
                border: '2px dashed #9c27b0',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#e1bee7',
                  transform: 'scale(1.02)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold' }}>
                📦 {t('kanban.showMore') || 'Show More'} ({filteredMattresses.length - visibleCount} {t('kanban.remaining') || 'remaining'})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('kanban.clickToLoad') || 'Click to load'} {Math.min(incrementCount, filteredMattresses.length - visibleCount)} {t('kanban.more') || 'more'}
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

const KanbanItem = ({ mattress, index, shift, device }) => {
  const { t } = useTranslation();
  const ref = useRef(null);

  // Check if mattress is locked (pending approval or on spread)
  const isLocked = mattress.status === "PENDING APPROVAL" || mattress.status === "2 - ON SPREAD";

  const [{ isDragging }, drag] = useDrag({
    type: "MATTRESS",
    canDrag: !isLocked, // Disable dragging for locked mattresses
    item: () => {
      if (isLocked) return null; // Prevent drag if locked
      return {
        id: mattress.id,
        index,
        fromDevice: mattress.device || device,
        fromShift: mattress.shift || shift,
        targetPosition: undefined
      };
    },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() })
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "MATTRESS",
    canDrop: () => !isLocked, // Prevent dropping on locked mattresses
    hover: (item, monitor) => {
      if (!ref.current || item.id === mattress.id || isLocked) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;
      const fromDevice = item.fromDevice;
      const fromShift = item.fromShift;
      const currentDevice = mattress.device || device;
      const currentShift = mattress.shift || shift;

      // Handle position updates for both same column and cross-column moves
      const isSameColumn = fromDevice === currentDevice && fromShift === currentShift;

      if (isSameColumn && dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // For same column moves, use precise logic
      if (isSameColumn) {
        let targetPosition = hoverIndex;

        // Determine if we're inserting before or after the hovered item
        if (dragIndex < hoverIndex) {
          // Moving down: if mouse is in bottom half, insert after (position = hoverIndex)
          // if mouse is in top half, insert before (position = hoverIndex - 1)
          if (hoverClientY < hoverMiddleY) {
            targetPosition = Math.max(0, hoverIndex - 1);
          } else {
            targetPosition = hoverIndex;
          }
        } else {
          // Moving up: if mouse is in top half, insert before (position = hoverIndex)
          // if mouse is in bottom half, insert after (position = hoverIndex + 1)
          if (hoverClientY < hoverMiddleY) {
            targetPosition = hoverIndex;
          } else {
            targetPosition = hoverIndex + 1;
          }
        }

        // Prevent unnecessary updates
        if (item.targetPosition === targetPosition) {
          return;
        }

        item.targetPosition = targetPosition;
        item.index = targetPosition;
        return;
      }

      // For cross-column moves, always use hover index
      item.targetPosition = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  });

  // Only connect drag/drop if not locked
  if (!isLocked) {
    drag(drop(ref));
  } else {
    // For locked items, only connect the ref without drag/drop
    drop(ref);
  }

  const tooltipContent = (
    <Box>
      <strong>{t('common.order', 'Order')}:</strong> {mattress.order_commessa} <br />
      {mattress.destination && mattress.destination !== 'Not Assigned' && (
        <><strong>{t('common.destination', 'Destination')}:</strong> {mattress.destination} <br /></>
      )}
      <strong>{t('common.fabric', 'Fabric')}:</strong> {mattress.fabric_code} &nbsp;&nbsp; {mattress.fabric_color} <br />
      <strong>{t('table.bagno')}:</strong> {mattress.dye_lot} <br />
      {mattress.marker && mattress.marker !== '--' && (<><strong>{t('kanban.marker')}:</strong> {mattress.marker} <br /></>)}
      <strong>{t('common.markerLength', 'Marker Length')}:</strong> {mattress.marker_length} m<br />
      <strong>{t('common.markerWidth', 'Marker Width')}:</strong> {mattress.width} cm<br />
      {mattress.sizes && mattress.sizes !== '--' && (<Box><strong>{t('common.sizes', 'Sizes')}:</strong> {mattress.sizes}</Box>)}
      <strong>{t('table.consumption')}:</strong> {mattress.consumption} m<br />
      <strong>{t('common.spreadingMethod', 'Spreading Method')}:</strong> {mattress.spreading_method} <br />
    </Box>
  );

  const content = (
    <Box sx={{ position: 'relative' }}>
      {/* Drop indicator line */}
      {isOver && (
        <Box sx={{
          position: 'absolute',
          top: -2,
          left: 0,
          right: 0,
          height: '4px',
          bgcolor: '#9c27b0',
          borderRadius: '2px',
          zIndex: 1000,
          boxShadow: '0 0 8px rgba(156, 39, 176, 0.6)',
          animation: 'pulse 1s infinite'
        }} />
      )}

      <MainCard
        ref={ref}
        border={false}
        sx={{
          mb: 1,
          opacity: isDragging ? 0.5 : isLocked ? 0.8 : 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          cursor: isLocked ? 'not-allowed' : 'grab',
          transform: isDragging ? 'rotate(5deg) scale(1.05)' : isOver ? 'scale(1.02)' : 'none',
          transition: 'all 0.3s ease',
          border: isLocked ? (mattress.status === "PENDING APPROVAL" ? '2px solid #ff9800 !important' : '2px solid #2196f3 !important') : isOver ? '3px solid #9c27b0' : '1px solid #e0e0e0',
          bgcolor: isLocked ? (mattress.status === "PENDING APPROVAL" ? '#fff3e0' : '#e3f2fd') : isOver ? '#f3e5f5' : 'white',
          boxShadow: isLocked ? (mattress.status === "PENDING APPROVAL" ? '0 2px 8px rgba(255, 152, 0, 0.3)' : '0 2px 8px rgba(33, 150, 243, 0.3)') : isOver ? '0 4px 20px rgba(156, 39, 176, 0.3)' : isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : 'none',
          width: '100%',
          height: '90px',
          minHeight: '90px',
          maxHeight: '90px',
          padding: '8px',
          position: 'relative',
          '&:hover': {
            transform: isLocked ? 'none' : isDragging ? 'rotate(5deg) scale(1.05)' : 'scale(1.01)',
            boxShadow: isLocked ? (mattress.status === "PENDING APPROVAL" ? '0 2px 8px rgba(255, 152, 0, 0.3)' : '0 2px 8px rgba(33, 150, 243, 0.3)') : '0 2px 10px rgba(0,0,0,0.1)'
          }
        }}>
      {/* Status icons for locked mattresses */}
      {isLocked && (
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          alignItems: 'center',
          bgcolor: mattress.status === "PENDING APPROVAL" ? '#ff9800' : '#2196f3',
          color: 'white',
          borderRadius: '50%',
          width: 24,
          height: 24,
          justifyContent: 'center'
        }}>
          {mattress.status === "PENDING APPROVAL" ? (
            <LockIcon sx={{ fontSize: 14 }} />
          ) : (
            <ViewStreamIcon sx={{ fontSize: 14 }} />
          )}
        </Box>
      )}

      {mattress.mattress} <br />
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
        {mattress.dye_lot && mattress.dye_lot !== 'no bagno' && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#fff3e0',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            minWidth: 60,
            justifyContent: 'center'
          }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#f57c00', fontWeight: 'bold' }}>
              {mattress.dye_lot}
            </Typography>
          </Box>
        )}

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
            <Typography sx={{ ml: 1, fontSize: '0.9rem', color: '#1976d2' }}>{t('kanban.pieces')}</Typography>
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
          <Typography sx={{ ml: 1, fontSize: '0.9rem', color: '#7b1fa2' }}>{t('kanban.layers')}</Typography>
        </Box>
      </Box>
      </MainCard>
    </Box>
  );

  return isDragging ? content : <Tooltip title={tooltipContent} arrow placement="right" enterDelay={300}>{content}</Tooltip>;
};

export default KanbanBoard;
