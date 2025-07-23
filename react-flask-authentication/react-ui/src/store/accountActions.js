import axios from 'utils/axiosInstance';
import { LOGOUT } from './actions'; // ✅ Points to your actions.js

// Async Logout Action Creator
export const logoutUser = () => {
    return async (dispatch) => {
        try {
            // Get the token from localStorage
            const token = localStorage.getItem('token');

            if (token) {
                // Send logout request with Authorization header
                await axios.post('/users/logout', {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.warn('Logout failed or session expired:', error.message);
        }

        // ✅ Always clear token and state (regardless of API success/failure)
        dispatch({ type: LOGOUT });
    };
};
