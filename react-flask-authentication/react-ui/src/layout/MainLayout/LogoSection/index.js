import React from 'react';
import { useHistory } from 'react-router-dom';

// material-ui
import { ButtonBase } from '@mui/material';

// project imports
import config from './../../../config';
import Logo from './../../../ui-component/Logo';

//-----------------------|| MAIN LOGO ||-----------------------//

const LogoSection = () => {

    const history = useHistory();

    return (
        <ButtonBase disableRipple onClick={() => history.push(config.defaultPath)}>
            <Logo />
        </ButtonBase>
    );
};

export default LogoSection;
