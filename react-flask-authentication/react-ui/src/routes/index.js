import React from 'react';
import { Redirect, Switch } from 'react-router-dom';
import { useSelector } from 'react-redux';

// routes
import MainRoutes from './MainRoutes';
import LoginRoutes from './LoginRoutes';
import AuthenticationRoutes from './AuthenticationRoutes';

// project imports
import config, { getDefaultPathByRole } from './../config';

//-----------------------|| ROUTING RENDER ||-----------------------//

const Routes = () => {
    const account = useSelector((state) => state.account);
    const { isLoggedIn, user } = account;

    // Determine the default path based on user role if logged in
    const defaultPath = isLoggedIn && user ? getDefaultPathByRole(user.role) : config.defaultPath;

    return (
        <Switch>
            <Redirect exact from="/" to={defaultPath} />
            <React.Fragment>
                {/* Routes for authentication pages */}
                <AuthenticationRoutes />

                {/* Route for login */}
                <LoginRoutes />

                {/* Routes for main layouts */}
                <MainRoutes />
            </React.Fragment>
        </Switch>
    );
};

export default Routes;
