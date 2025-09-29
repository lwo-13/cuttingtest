import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { makeStyles, useTheme } from '@mui/styles';
import { Box, Drawer, useMediaQuery } from '@mui/material';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';
import { BrowserView, MobileView } from 'react-device-detect';
import { useSelector } from 'react-redux';

// project imports
import MenuList from './MenuList';
import LogoSection from '../LogoSection';
import MenuCard from './MenuCard';
import { drawerWidth } from './../../../store/constant';

import { useTranslation } from 'react-i18next';

// style constant
const useStyles = makeStyles((theme) => ({
    drawer: {
        [theme.breakpoints.up('md')]: {
            width: drawerWidth,
            flexShrink: 0
        }
    },
    drawerPaper: {
        width: drawerWidth,
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderRight: 'none',
        [theme.breakpoints.up('md')]: {
            top: '88px'
        }
    },
    ScrollHeight: {
        height: 'calc(100vh - 88px)',
        paddingLeft: '16px',
        paddingRight: '16px',
        [theme.breakpoints.down('sm')]: {
            height: 'calc(100vh - 56px)'
        }
    },
    boxContainer: {
        display: 'flex',
        padding: '16px',
        marginLeft: 'auto',
        marginRight: 'auto'
    }
}));

//-----------------------|| SIDEBAR DRAWER ||-----------------------//

const Sidebar = ({ drawerOpen, drawerToggle, window }) => {
    const classes = useStyles();
    const theme = useTheme();
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));

    const { t } = useTranslation();

    // Get user role to conditionally show MenuCard
    const account = useSelector((state) => state.account);
    const userRole = account?.user?.role || '';

    const drawer = (
        <React.Fragment>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <div className={classes.boxContainer}>
                    <LogoSection />
                </div>
            </Box>
            <BrowserView>
                <PerfectScrollbar component="div" className={classes.ScrollHeight}>
                    <MenuList />
                    {!['Subcontractor', 'Logistic'].includes(userRole) && <MenuCard />}
                </PerfectScrollbar>
            </BrowserView>
            <MobileView>
                <Box sx={{ px: 2 }}>
                    <MenuList />
                    {!['Subcontractor', 'Logistic'].includes(userRole) && <MenuCard />}
                </Box>
            </MobileView>
        </React.Fragment>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <nav className={classes.drawer} aria-label="mailbox folders">
            <Drawer
                container={container}
                variant={matchUpMd ? 'persistent' : 'temporary'}
                anchor="left"
                open={drawerOpen}
                onClose={drawerToggle}
                classes={{
                    paper: classes.drawerPaper
                }}
                ModalProps={{ keepMounted: true }}
                color="inherit"
            >
                {drawer}
            </Drawer>
        </nav>
    );
};

Sidebar.propTypes = {
    drawerOpen: PropTypes.bool,
    drawerToggle: PropTypes.func,
    window: PropTypes.object
};

export default Sidebar;
