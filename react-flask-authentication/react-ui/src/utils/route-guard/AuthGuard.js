import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';

//-----------------------|| AUTH GUARD ||-----------------------//

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
const AuthGuard = ({ children }) => {
    const account = useSelector((state) => state.account);
    const { isLoggedIn, user } = account;
    const location = useLocation();

    if (!isLoggedIn) {
        return <Redirect to="/login" />;
    }

    // Role-based redirects
    if (user && user.role === 'Spreader') {
        // If Spreader is trying to access a non-spreader page, redirect to spreader view
        if (!location.pathname.startsWith('/spreader')) {
            return <Redirect to="/spreader/view" />;
        }
    }

    if (user && user.role === 'Cutter') {
        // If Cutter is trying to access a non-cutter page, redirect to cutter view
        if (!location.pathname.startsWith('/cutter')) {
            return <Redirect to="/cutter/view" />;
        }
    }

    return children;
};

AuthGuard.propTypes = {
    children: PropTypes.node
};

export default AuthGuard;
