import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { SET_MENU } from '../store/actions';

/**
 * Custom hook to automatically collapse the sidebar menu
 * @param {boolean} collapse - Whether to collapse the menu (true) or not (false)
 */
const useCollapseMenu = (collapse = true) => {
    const dispatch = useDispatch();

    useEffect(() => {
        // Collapse the menu when the component mounts
        dispatch({ type: SET_MENU, opened: !collapse });

        // No cleanup needed as we don't want to restore the previous state
        // when the component unmounts
    }, [dispatch, collapse]);
};

export default useCollapseMenu;
