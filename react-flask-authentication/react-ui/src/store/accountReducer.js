// action - state management
import { ACCOUNT_INITIALIZE, LOGIN, LOGOUT } from './actions';

const storedToken = localStorage.getItem("token");

export const initialState = {
    token: localStorage.getItem("token") || "",
    isLoggedIn: !!localStorage.getItem("token"),
    isInitialized: false,
    user: null
};

//-----------------------|| ACCOUNT REDUCER ||-----------------------//

const accountReducer = (state = initialState, action) => {
    switch (action.type) {
        case ACCOUNT_INITIALIZE: {
            const { isLoggedIn, user, token } = action.payload;
            localStorage.setItem("token", token);
            return {
                ...state,
                isLoggedIn,
                isInitialized: true,
                token,
                user
            };
        }
        case LOGIN: {
            const { user } = action.payload;
            return {
                ...state,
                isLoggedIn: true,
                user
            };
        }
        case LOGOUT: {
            localStorage.removeItem("token"); 
            return {
                ...state,
                isLoggedIn: false,
                token: '',
                user: null
            };
        }
        default: {
            return { ...state };
        }
    }
};

export default accountReducer;
