// Backend URL is now handled in axiosInstance.js
let BACKEND_SERVER = "/";

// ENHANCED VPN PROXY ROUTING: More robust detection for different network environments
const getBasename = () => {

    // Enhanced VPN detection logic
    const isVPNEnvironment = typeof window !== 'undefined' && (
        // Primary: VPN hostname
        window.location.hostname === 'sslvpn1.calzedonia.com' ||
        // Secondary: VPN path pattern (more reliable for different networks)
        window.location.pathname.startsWith('/web_forward_CuttingApplicationAPI') ||
        // Tertiary: HTTPS with VPN-like URL structure
        (window.location.protocol === 'https:' &&
         window.location.href.includes('web_forward_CuttingApplicationAPI')) ||
        // Quaternary: Check for VPN proxy in referrer (for redirects)
        (document.referrer && document.referrer.includes('sslvpn1.calzedonia.com'))
    );

    if (isVPNEnvironment) {
        return '/web_forward_CuttingApplicationAPI';
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
            return '/subcontractor/view?type=open';
        case 'Logistic':
            return '/logistic/view';
        case 'Administrator':
        case 'Manager':
        case 'Planner':
        default:
            return '/dashboard/default';
    }
};

const config = {
    // basename: automatically detects environment
    // VPN proxy: '/web_forward_CuttingApplicationAPI'
    // Local/direct: ''
    basename: getBasename(),
    defaultPath: '/dashboard/default', // Default path for non-authenticated users
    fontFamily: `'Roboto', sans-serif`,
    borderRadius: 12,
    API_SERVER: BACKEND_SERVER
};

export default config;
