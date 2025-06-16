import { useState, useCallback, useRef } from 'react';

/**
 * Enhanced hook for tracking unsaved changes with detailed change information
 */
const useUnsavedChanges = () => {
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [changeDetails, setChangeDetails] = useState({
        mattresses: false,
        adhesives: false,
        along: false,
        weft: false,
        bias: false,
        comments: false,
        padPrint: false,
        orderInfo: false
    });
    
    // Keep track of the last saved state for comparison
    const lastSavedState = useRef(null);
    
    // Mark specific type of change
    const markChange = useCallback((changeType, hasChange = true) => {
        setChangeDetails(prev => {
            const newDetails = { ...prev, [changeType]: hasChange };
            const hasAnyChanges = Object.values(newDetails).some(Boolean);
            setUnsavedChanges(hasAnyChanges);
            return newDetails;
        });
    }, []);
    
    // Clear all changes (typically after successful save)
    const clearAllChanges = useCallback(() => {
        setUnsavedChanges(false);
        setChangeDetails({
            mattresses: false,
            adhesives: false,
            along: false,
            weft: false,
            bias: false,
            comments: false,
            padPrint: false,
            orderInfo: false
        });
    }, []);
    
    // Get a human-readable summary of changes
    const getChangeSummary = useCallback(() => {
        const changedItems = [];
        if (changeDetails.mattresses) changedItems.push('Mattresses');
        if (changeDetails.adhesives) changedItems.push('Adhesives');
        if (changeDetails.along) changedItems.push('Collaretto Along');
        if (changeDetails.weft) changedItems.push('Collaretto Weft');
        if (changeDetails.bias) changedItems.push('Collaretto Bias');
        if (changeDetails.comments) changedItems.push('Comments');
        if (changeDetails.padPrint) changedItems.push('Pad Print');
        if (changeDetails.orderInfo) changedItems.push('Order Information');
        
        if (changedItems.length === 0) return '';
        if (changedItems.length === 1) return changedItems[0];
        if (changedItems.length === 2) return `${changedItems[0]} and ${changedItems[1]}`;
        
        const lastItem = changedItems.pop();
        return `${changedItems.join(', ')}, and ${lastItem}`;
    }, [changeDetails]);
    
    // Check if specific type has changes
    const hasChanges = useCallback((changeType) => {
        return changeDetails[changeType] || false;
    }, [changeDetails]);
    
    // Set the baseline state (typically after loading or saving)
    const setBaselineState = useCallback((state) => {
        lastSavedState.current = JSON.parse(JSON.stringify(state));
    }, []);
    
    // Compare current state with baseline to detect changes
    const compareWithBaseline = useCallback((currentState) => {
        if (!lastSavedState.current) {
            setBaselineState(currentState);
            return false;
        }
        
        try {
            const currentStateStr = JSON.stringify(currentState);
            const baselineStateStr = JSON.stringify(lastSavedState.current);
            return currentStateStr !== baselineStateStr;
        } catch (error) {
            console.warn('Error comparing states:', error);
            return false;
        }
    }, [setBaselineState]);
    
    return {
        unsavedChanges,
        changeDetails,
        markChange,
        clearAllChanges,
        getChangeSummary,
        hasChanges,
        setBaselineState,
        compareWithBaseline,
        // Legacy compatibility
        setUnsavedChanges: (value) => {
            if (typeof value === 'boolean') {
                if (value) {
                    markChange('general', true);
                } else {
                    clearAllChanges();
                }
            }
        }
    };
};

export default useUnsavedChanges;
