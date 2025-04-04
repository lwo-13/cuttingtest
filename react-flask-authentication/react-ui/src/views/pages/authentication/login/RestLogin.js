import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import configData from '../../../../config';

// material-ui
import { makeStyles } from '@mui/styles';
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    IconButton,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Stack,
    Typography
} from '@mui/material';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';
import axios from 'utils/axiosInstance';

// project imports
import useScriptRef from '../../../../hooks/useScriptRef';
import AnimateButton from '../../../../ui-component/extended/AnimateButton';
import { ACCOUNT_INITIALIZE } from './../../../../store/actions';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// style constant
const useStyles = makeStyles((theme) => ({
    redButton: {
        fontSize: '1rem',
        fontWeight: 500,
        backgroundColor: theme.palette.grey[50],
        border: '1px solid',
        borderColor: theme.palette.grey[100],
        color: theme.palette.grey[700],
        textTransform: 'none',
        '&:hover': {
            backgroundColor: theme.palette.primary.light
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: '0.875rem'
        }
    },
    signDivider: {
        flexGrow: 1
    },
    signText: {
        cursor: 'unset',
        margin: theme.spacing(2),
        padding: '5px 56px',
        borderColor: theme.palette.grey[100] + ' !important',
        color: theme.palette.grey[900] + '!important',
        fontWeight: 500
    },
    loginIcon: {
        marginRight: '16px',
        [theme.breakpoints.down('sm')]: {
            marginRight: '8px'
        }
    },
    loginInput: {
        ...theme.typography.customInput
    }
}));

//============================|| API JWT - LOGIN ||============================//

const RestLogin = (props, { ...others }) => {
    const classes = useStyles();
    const dispatcher = useDispatch();

    const scriptedRef = useScriptRef();
    const [checked, setChecked] = React.useState(true);

    const [showPassword, setShowPassword] = React.useState(false);
    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const { t } = useTranslation();
    
    return (
        <React.Fragment>
            <Formik
                initialValues={{
                    username: '',
                    password: '',
                    submit: null
                }}
                validationSchema={Yup.object().shape({
                    username: Yup.string().max(255).required(t('login.usernameRequired')),
                    password: Yup.string().max(255).required(t('login.passwordRequired'))
                })}
                onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
                    try {
                        axios
                            .post(configData.API_SERVER + 'users/login', {
                                password: values.password,
                                username: values.username
                            })
                            .then(function (response) {
                                console.log("Raw API response:", response);
                                console.log("Parsed data:", response.data);
                                if (response.data.success) {
                                    console.log(response.data);
                                    localStorage.setItem("token", response.data.token);
                                    dispatcher({
                                        type: ACCOUNT_INITIALIZE,
                                        payload: { isLoggedIn: true, user: response.data.user, token: response.data.token }
                                    });
                                    if (scriptedRef.current) {
                                        setStatus({ success: true });
                                        setSubmitting(false);
                                    }
                                } else {
                                    setStatus({ success: false });
                                    setErrors({ submit: response.data.msg });
                                    setSubmitting(false);
                                }
                            })
                            .catch(function (error) {
                                setStatus({ success: false });
                                const errorMsg =
                                    error?.response?.data?.msg ||
                                    error?.response?.statusText ||
                                    "Unexpected error occurred. Please try again.";
                                setErrors({ submit: errorMsg });
                                setSubmitting(false);
                            });
                    } catch (err) {
                        console.error(err);
                        if (scriptedRef.current) {
                            setStatus({ success: false });
                            setErrors({ submit: err.message });
                            setSubmitting(false);
                        }
                    }
                }}
            >
                {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                    <form noValidate onSubmit={handleSubmit} {...others}>
                        <FormControl fullWidth error={Boolean(touched.username && errors.username)} className={classes.loginInput}>
                            <InputLabel htmlFor="outlined-adornment-username-login">{t('login.username')}</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-username-login"
                                type="text"
                                value={values.username}
                                name="username"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                label={t('login.username')}
                                autoComplete="off"
                                inputProps={{
                                    classes: {
                                        notchedOutline: classes.notchedOutline
                                    }
                                }}
                            />
                            {touched.username && errors.username && (
                                <FormHelperText error id="standard-weight-helper-text-username-login">
                                    {' '}
                                    {errors.username}{' '}
                                </FormHelperText>
                            )}
                        </FormControl>

                        <FormControl fullWidth error={Boolean(touched.password && errors.password)} className={classes.loginInput}>
                            <InputLabel htmlFor="outlined-adornment-password-login">{t('login.password')}</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password-login"
                                type={showPassword ? 'text' : 'password'}
                                value={values.password}
                                name="password"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                label={t('login.password')}
                                inputProps={{
                                    classes: {
                                        notchedOutline: classes.notchedOutline
                                    }
                                }}
                            />
                            {touched.password && errors.password && (
                                <FormHelperText error id="standard-weight-helper-text-password-login">
                                    {' '}
                                    {errors.password}{' '}
                                </FormHelperText>
                            )}
                        </FormControl>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={checked}
                                        onChange={(event) => setChecked(event.target.checked)}
                                        name="checked"
                                        color="primary"
                                    />
                                }
                                label={t('login.rememberMe')}
                            />
                        </Stack>
                        {errors.submit && (
                            <Box
                                sx={{
                                    mt: 3
                                }}
                            >
                                <FormHelperText error>{errors.submit}</FormHelperText>
                            </Box>
                        )}

                        <Box
                            sx={{
                                mt: 2
                            }}
                        >
                            <AnimateButton>
                                <Button
                                    disableElevation
                                    disabled={isSubmitting}
                                    fullWidth
                                    size="large"
                                    type="submit"
                                    variant="contained"
                                    color="secondary"
                                >
                                    {t('login.signIn')}
                                </Button>
                            </AnimateButton>
                        </Box>
                    </form>
                )}
            </Formik>
        </React.Fragment>
    );
};

export default RestLogin;
