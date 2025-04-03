import axios from 'utils/axiosInstance';
import { LOGOUT } from './actions'; // ✅ Points to your actions.js

// Async Logout Action Creator
export const logoutUser = () => {
    return async (dispatch) => {
        try {
            await axios.post('/api/users/logout');  // ✅ Your Flask logout endpoint
        } catch (error) {
            console.warn('Logout failed or session expired:', error.message);
        }

        // ✅ Always clear token and state
        dispatch({ type: LOGOUT });
    };
};
