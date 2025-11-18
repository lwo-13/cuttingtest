import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import { makeStyles } from '@mui/styles';
import { Avatar, Chip, ListItemIcon, ListItemText, Typography, useMediaQuery, Badge } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';

// project imports
import { MENU_OPEN, SET_MENU } from '../../../../../store/actions';

// assets
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { useLocation } from 'react-router-dom';

// style constant
const useStyles = makeStyles((theme) => ({
    listIcon: {
        minWidth: '18px',
        marginTop: 'auto',
        marginBottom: 'auto'
    },
    listCustomIconSub: {
        width: '6px',
        height: '6px'
    },
    listCustomIconSubActive: {
        width: '8px',
        height: '8px'
    },
    listItem: {
        marginBottom: '5px',
        alignItems: 'center'
    },
    listItemNoBack: {
        marginBottom: '5px',
        backgroundColor: 'transparent !important',
        paddingTop: '8px',
        paddingBottom: '8px',
        alignItems: 'flex-start'
    },
    subMenuCaption: {
        ...theme.typography.subMenuCaption
    }
}));

//-----------------------|| SIDEBAR MENU LIST ITEMS ||-----------------------//

const NavItem = ({ item, level }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const customization = useSelector((state) => state.customization);
    const matchesSM = useMediaQuery((theme) => theme.breakpoints.down('md'));
    const location = useLocation();

    const Icon = item.icon;
    const itemIcon = item.icon ? (
        <Icon stroke={1.5} size="1.3rem" className={classes.listCustomIcon} />
    ) : (
        <FiberManualRecordIcon
            className={
                customization.isOpen.findIndex((id) => id === item.id) > -1 ? classes.listCustomIconSubActive : classes.listCustomIconSub
            }
            fontSize={level > 0 ? 'inherit' : 'default'}
        />
    );

    let itemIconClass = !item.icon ? classes.listIcon : classes.menuIcon;
    itemIconClass = customization.navType === 'nav-dark' ? [itemIconClass, classes.listCustomIcon].join(' ') : itemIconClass;

    let itemTarget = '';
    if (item.target) {
        itemTarget = '_blank';
    }

    let listItemProps = { component: React.forwardRef((props, ref) => <Link {...props} to={item.url} />) };
    if (item.external) {
        listItemProps = { component: 'a', href: item.url };
    }

    const itemHandler = (id) => {
        dispatch({ type: MENU_OPEN, id: id });
        matchesSM && dispatch({ type: SET_MENU, opened: false });
    };

    // active menu item on page load and navigation
    React.useEffect(() => {
        // Check if current URL matches this item's URL (including query parameters)
        if (item.url) {
            try {
                const itemUrl = new URL(item.url, window.location.origin);
                const currentUrl = new URL(location.pathname + location.search, window.location.origin);

                if (currentUrl.pathname === itemUrl.pathname && currentUrl.search === itemUrl.search) {
                    dispatch({ type: MENU_OPEN, id: item.id });
                }
            } catch (e) {
                // Fallback to old logic if URL parsing fails
                const currentIndex = document.location.pathname
                    .toString()
                    .split('/')
                    .findIndex((id) => id === item.id);
                if (currentIndex > -1) {
                    dispatch({ type: MENU_OPEN, id: item.id });
                }
            }
        }
        // eslint-disable-next-line
    }, [location.pathname, location.search]);

    return (
        <ListItemButton
            {...listItemProps}
            disabled={item.disabled}
            className={level > 1 ? classes.listItemNoBack : classes.listItem}
            sx={{ borderRadius: customization.borderRadius + 'px' }}
            selected={
                item.children
                  ? item.children.some((child) => {
                      // Handle URLs with query parameters
                      const childUrl = new URL(child.url, window.location.origin);
                      const currentUrl = new URL(location.pathname + location.search, window.location.origin);
                      return currentUrl.pathname === childUrl.pathname &&
                             currentUrl.search === childUrl.search;
                    })
                  : (() => {
                      // Handle URLs with query parameters for single items
                      const itemUrl = new URL(item.url, window.location.origin);
                      const currentUrl = new URL(location.pathname + location.search, window.location.origin);
                      // Check if current path starts with item path (for parent routes like /configuration)
                      // or exact match for other routes
                      const isExactMatch = currentUrl.pathname === itemUrl.pathname &&
                                          currentUrl.search === itemUrl.search;
                      const isChildPath = currentUrl.pathname.startsWith(itemUrl.pathname + '/');
                      return isExactMatch || isChildPath;
                    })()
              }
            onClick={() => itemHandler(item.id)}
            target={itemTarget}
            style={{ paddingLeft: level * 23 + 'px' }}
        >
            <ListItemIcon className={itemIconClass}>{itemIcon}</ListItemIcon>
            <ListItemText
                primary={
                    <Typography
                        variant="body1"
                        color="inherit"
                        sx={{
                            fontWeight: customization.isOpen.includes(item.id) ? 600 : 400,
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        {item.title}
                    </Typography>
                }
                secondary={
                    item.caption && (
                        <Typography variant="caption" className={classes.subMenuCaption} display="block" gutterBottom>
                            {item.caption}
                        </Typography>
                    )
                }
            />
            {item.chip && (
                <Chip
                    color={item.chip.color}
                    variant={item.chip.variant}
                    size={item.chip.size}
                    label={item.chip.label}
                    avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
                />
            )}
            {item.badgeContent > 0 && (
                <Badge badgeContent={item.badgeContent} color="secondary" max={99} sx={{ ml: 'auto', mr: 1 }} />
            )}
        </ListItemButton>
    );
};

NavItem.propTypes = {
    item: PropTypes.object,
    level: PropTypes.number
};

export default NavItem;
