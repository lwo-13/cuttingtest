import React, { useEffect, useState } from 'react';

// material-ui
import { Typography } from '@mui/material';

// project imports
import NavGroup from './NavGroup';
import menuItem from './../../../../menu-items';
import { useBadgeCount } from '../../../../contexts/BadgeCountContext';

//-----------------------|| SIDEBAR MENU LIST ||-----------------------//

const MenuList = () => {
    const { mattressPendingCount } = useBadgeCount();

    const updatedItems = menuItem.items.map((group) => ({
        ...group,
        children: group.children.map((item) => {
            if (item.id === 'mattress_approval') {
                return { ...item, badgeContent: mattressPendingCount };
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
