// Backend URL is now handled in axiosInstance.js
let BACKEND_SERVER = "/";

// Set basename for VPN proxy routing
const getBasename = () => {
    // Use VPN basename if we're on the actual VPN domain
    if (typeof window !== 'undefined' && window.location.hostname === 'sslvpn1.calzedonia.com') {
        return '/web_forward_CuttingApplication';
    }
    // Or if we're testing the VPN path on ANY hostname (including VM)
    if (typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/web_forward_CuttingApplication')) {
        return '/web_forward_CuttingApplication';
    }
    // For all other cases, use no basename
    return '';
};

// Function to get default path based on user role
export const getDefaultPathByRole = (role) => {
    switch (role) {
        case 'Spreader':
            return '/spreader/view';
        case 'Cutter':
            return '/cutter/view';
        case 'Subcontractor':
            return '/subcontractor/view';
        case 'Administrator':
        case 'Manager':
        case 'Planner':
        default:
            return '/dashboard/default';
    }
};

const config = {
    // basename: automatically detects environment
    // VPN proxy: '/web_forward_CuttingApplication'
    // Local/direct: ''
    basename: getBasename(),
    defaultPath: '/dashboard/default', // Default path for non-authenticated users
    fontFamily: `'Roboto', sans-serif`,
    borderRadius: 12,
    API_SERVER: BACKEND_SERVER
};

export default config;
