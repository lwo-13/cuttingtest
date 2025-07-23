let BACKEND_SERVER = "/";

// Determine if we're running through VPN proxy
const isVPNProxy = process.env.REACT_APP_BACKEND_SERVER &&
                   process.env.REACT_APP_BACKEND_SERVER.includes('sslvpn1.calzedonia.com');

// Set basename for VPN proxy routing
const getBasename = () => {
    // Check if we're actually running through the VPN proxy URL
    if (typeof window !== 'undefined' && window.location.hostname === 'sslvpn1.calzedonia.com') {
        return '/web_forward_CuttingApplication';
    }
    // Check if we're testing the VPN path locally
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/web_forward_CuttingApplication')) {
        return '/web_forward_CuttingApplication';
    }
    // Check environment variable as fallback
    if (isVPNProxy) {
        return '/web_forward_CuttingApplication';
    }
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
