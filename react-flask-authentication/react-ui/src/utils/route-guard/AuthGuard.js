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

    if (user && user.role === 'Subcontractor') {
        // Allow subcontractors to access their specific pages
        const allowedSubcontractorPaths = [
            '/subcontractor',
            '/to-do-lists/marker-requests',
            '/to-do-lists/subcontractor-width-change-approvals'
        ];

        const isAllowedPath = allowedSubcontractorPaths.some(path =>
            location.pathname.startsWith(path)
        );

        // If Subcontractor is trying to access a non-allowed page, redirect to subcontractor KPI dashboard
        if (!isAllowedPath) {
            return <Redirect to="/subcontractor/kpi-dashboard" />;
        }
    }

    if (user && user.role === 'Logistic') {
        // Allow logistic users to access their specific pages
        const allowedLogisticPaths = [
            '/logistic',
            '/collaretto-ops'
        ];

        const isAllowedPath = allowedLogisticPaths.some(path =>
            location.pathname.startsWith(path)
        );

        // If Logistic is trying to access a non-allowed page, redirect to logistic view
        if (!isAllowedPath) {
            return <Redirect to="/logistic/view" />;
        }
    }

    return children;
};

AuthGuard.propTypes = {
    children: PropTypes.node
};

export default AuthGuard;
