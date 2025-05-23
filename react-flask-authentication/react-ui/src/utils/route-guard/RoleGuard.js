import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Alert, Box } from '@mui/material';

/**
 * Role-based guard for routes
 * @param {PropTypes.node} children children element/node
 * @param {Array} allowedRoles array of roles allowed to access the route
 */
const RoleGuard = ({ children, allowedRoles }) => {
    const account = useSelector((state) => state.account);
    const { isLoggedIn, user } = account;

    // If not logged in, redirect to login
    if (!isLoggedIn) {
        return <Redirect to="/login" />;
    }

    // If no user or no role, show error
    if (!user || !user.role) {
        return (
            <Box m={2}>
                <Alert severity="error">
                    User role information is missing. Please contact an administrator.
                </Alert>
            </Box>
        );
    }

    // Check if user role is in allowed roles
    // Administrator, Manager, and Project Admin can access all pages
    if (allowedRoles.includes(user.role) || user.role === 'Administrator' || user.role === 'Manager' || user.role === 'Project Admin') {
        return children;
    }

    // Redirect users to their appropriate home page based on role
    if (user.role === 'Spreader') {
        return <Redirect to="/spreader/view" />;
    } else if (user.role === 'Cutter') {
        return <Redirect to="/cutter/view" />;
    } else {
        // Default redirect for other roles
        return <Redirect to="/dashboard/default" />;
    }
};

RoleGuard.propTypes = {
    children: PropTypes.node,
    allowedRoles: PropTypes.array.isRequired
};

export default RoleGuard;
