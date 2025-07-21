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
    const { mattressPendingCount, orderRatioPendingCount, widthValidationCount, widthChangeApprovalsCount, markerRequestsCount} = useBadgeCount();
    const account = useSelector((state) => state.account);
    const userRole = account?.user?.role || '';

    // Filter menu items based on user role
    const filteredItems = menuItem.items.filter((group) => {
        switch (group.id) {
            case 'spreader':
                return userRole === 'Spreader';

            case 'cutter':
                return userRole === 'Cutter';

            case 'subcontractor':
                return userRole === 'Subcontractor';

            case 'operators':
                return ['Manager', 'Project Admin'].includes(userRole);

            default:
                // Hide everything for Spreader, Cutter, and Subcontractor except their own group
                if (['Spreader', 'Cutter', 'Subcontractor'].includes(userRole)) return false;
                // Shift Manager can see most items except operators
                return true;
        }
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
            if (item.id === 'width_validation') {
                return { ...item, badgeContent: widthValidationCount };
            }
            if (item.id === 'width_change_approvals') {
                return { ...item, badgeContent: widthChangeApprovalsCount };
            }
            if (item.id === 'marker_requests') {
                return { ...item, badgeContent: markerRequestsCount };
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
