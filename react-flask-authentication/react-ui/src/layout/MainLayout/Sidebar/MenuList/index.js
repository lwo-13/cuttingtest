import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// material-ui
import { Typography } from '@mui/material';

// project imports
import NavGroup from './NavGroup';
import menuItem from './../../../../menu-items';
import { useBadgeCount } from '../../../../contexts/BadgeCountContext';

//-----------------------|| SIDEBAR MENU LIST ||-----------------------//

const MenuList = () => {
    const { mattressPendingCount, orderRatioPendingCount} = useBadgeCount();
    const account = useSelector((state) => state.account);
    const userRole = account?.user?.role || '';

    // Filter menu items based on user role
    const filteredItems = menuItem.items.filter((group) => {
        // For Spreader role, only show the spreader menu
        if (userRole === 'Spreader') {
            return group.id === 'spreader';
        }

        // For Administrator and Manager roles, show all menus
        if (userRole === 'Administrator' || userRole === 'Manager') {
            return true;
        }

        // For other roles (like Planner), show all except spreader menu
        return group.id !== 'spreader';
    });

    const updatedItems = filteredItems.map((group) => ({
        ...group,
        children: group.children.map((item) => {
            if (item.id === 'mattress_approval') {
                return { ...item, badgeContent: mattressPendingCount };
            }
            if (item.id === 'italian_ratio') {
                return { ...item, badgeContent: orderRatioPendingCount };
            }
            return item;
        })
    }));

    const navItems = updatedItems.map((item) => {
        switch (item.type) {
            case 'group':
                return <NavGroup key={item.id} item={item} />;
            default:
                return (
                    <Typography key={item.id} variant="h6" color="error" align="center">
                        Menu Items Error
                    </Typography>
                );
        }
    });

    return navItems;
};

export default MenuList;
