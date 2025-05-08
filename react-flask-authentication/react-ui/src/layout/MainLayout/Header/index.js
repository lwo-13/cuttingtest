import PropTypes from 'prop-types';
import React from 'react';
import { useState } from 'react';
import { Tooltip, IconButton } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, Box, ButtonBase } from '@mui/material';

// project imports
import LogoSection from '../LogoSection';
// import SearchSection from './SearchSection';
import ProfileSection from './ProfileSection';
import NotificationSection from './NotificationSection';
import Customization from '../../Customization';

// assets
import { IconMenu2 } from '@tabler/icons';

// style constant
const useStyles = makeStyles((theme) => ({
    grow: {
        flexGrow: 1
    },
    headerAvatar: {
        ...theme.typography.commonAvatar,
        ...theme.typography.mediumAvatar,
        transition: 'all .2s ease-in-out',
        background: theme.palette.secondary.light,
        color: theme.palette.secondary.dark,
        '&:hover': {
            background: theme.palette.secondary.dark,
            color: theme.palette.secondary.light
        }
    },
    boxContainer: {
        width: '228px',
        display: 'flex',
        [theme.breakpoints.down('md')]: {
            width: 'auto'
        }
    }
}));

//-----------------------|| MAIN NAVBAR / HEADER ||-----------------------//

const Header = ({ handleLeftDrawerToggle }) => {
    const classes = useStyles();

    const [openCustomize, setOpenCustomize] = useState(false);
    const handleCustomizeToggle = () => {
        setOpenCustomize((prev) => !prev);
    };

    return (
        <React.Fragment>
            
            {/* logo & toggler button */}
            <div className={classes.boxContainer}>
                <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1, ml: 1 }}>
                    <LogoSection/>
                </Box>
                <ButtonBase sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <Avatar variant="rounded" className={classes.headerAvatar} onClick={handleLeftDrawerToggle} color="inherit">
                        <IconMenu2 stroke={1.5} size="1.3rem" />
                    </Avatar>
                </ButtonBase>
            </div>

            {/* header search
            <SearchSection theme="light" />
            <div className={classes.grow} /> */}

            <div className={classes.grow} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip>
                    <IconButton
                        onClick={handleCustomizeToggle}
                        sx={{
                            bgcolor: (theme) => theme.palette.secondary.light,
                            color: (theme) => theme.palette.secondary.dark,
                            p: 1.25
                        }}
                    >
                        <ConstructionIcon size="1.5rem" />
                    </IconButton>
                </Tooltip>

                <ProfileSection />
            </Box>

            <Customization open={openCustomize} handleToggle={handleCustomizeToggle} />

        </React.Fragment>
    );
};

Header.propTypes = {
    handleLeftDrawerToggle: PropTypes.func
};

export default Header;
