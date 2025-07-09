import React from 'react';
import { Box, Tooltip } from '@mui/material';

const MattressProgressBar = ({ currentPhase }) => {
  // Define the phases in order
  const phases = [
    { id: 0, label: "NOT SET", shortLabel: "NS" },
    { id: 1, label: "TO LOAD", shortLabel: "TL" },
    { id: 2, label: "ON SPREAD", shortLabel: "OS" },
    { id: 3, label: "TO CUT", shortLabel: "TC" },
    { id: 4, label: "ON CUT", shortLabel: "OC" },
    { id: 5, label: "COMPLETED", shortLabel: "CP" }
  ];

  // Extract the phase number from the current phase string (e.g., "2 - ON SPREAD" -> 2)
  const getCurrentPhaseNumber = (phaseString) => {
    if (!phaseString) return 0;
    const match = phaseString.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const currentPhaseNumber = getCurrentPhaseNumber(currentPhase);

  // Determine if a phase should be colored (completed or current)
  const isPhaseActive = (phaseId) => {
    return phaseId <= currentPhaseNumber;
  };

  // Get color for each phase
  const getPhaseColor = (phaseId) => {
    if (phaseId < currentPhaseNumber) {
      return '#4caf50'; // Green for completed phases
    } else if (phaseId === currentPhaseNumber) {
      return '#2196f3'; // Blue for current phase
    } else {
      return '#e0e0e0'; // Gray for future phases
    }
  };

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      gap={0.5}
      sx={{ minWidth: '140px' }}
    >
      {phases.map((phase, index) => (
        <React.Fragment key={phase.id}>
          <Tooltip 
            title={`${phase.id} - ${phase.label}${phase.id === currentPhaseNumber ? ' (Current)' : phase.id < currentPhaseNumber ? ' (Completed)' : ''}`}
            arrow
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: getPhaseColor(phase.id),
                border: phase.id === currentPhaseNumber ? '2px solid #1976d2' : '1px solid #ccc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }
              }}
            />
          </Tooltip>
          
          {/* Add connector line between circles (except after the last one) */}
          {index < phases.length - 1 && (
            <Box
              sx={{
                width: 12,
                height: 2,
                backgroundColor: isPhaseActive(phase.id) ? '#4caf50' : '#e0e0e0',
                transition: 'background-color 0.2s ease'
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default MattressProgressBar;
