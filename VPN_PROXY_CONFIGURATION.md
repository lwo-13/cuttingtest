# VPN Proxy Configuration Guide

## Overview

This document describes the configuration changes made to enable the Cutting Application to work through the corporate VPN with reverse proxy setup.

## Network Configuration

### VPN Proxy URLs
- **Frontend URL**: `https://sslvpn1.calzedonia.com/web_forward_CuttingApplication/`
  - Forwards to: `172.27.57.210:3000`
- **API URL**: `https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/`
  - Forwards to: `172.27.57.210:5000`

### Path Structure
- Frontend proxy path: `/web_forward_CuttingApplication/`
- API proxy path: `/web_forward_CuttingApplicationAPI/`

## Configuration Changes Made

### 1. Frontend Environment Configuration

#### Updated `.env` file:
```bash
# for local development
#REACT_APP_BACKEND_SERVER=http://127.0.0.1:5000/api

# for VM (direct access)
#REACT_APP_BACKEND_SERVER=http://172.27.57.210:5000/api

# for VPN proxy access
REACT_APP_BACKEND_SERVER=https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/api
```

#### Created environment-specific files:
- `.env.local` - Local development
- `.env.vm` - Direct VM access
- `.env.vpn` - VPN proxy access

### 2. React Router Configuration

Updated `src/config.js` to automatically detect VPN proxy environment and set appropriate basename:

```javascript
// Determine if we're running through VPN proxy
const isVPNProxy = process.env.REACT_APP_BACKEND_SERVER && 
                   process.env.REACT_APP_BACKEND_SERVER.includes('sslvpn1.calzedonia.com');

// Set basename for VPN proxy routing
const getBasename = () => {
    if (isVPNProxy) {
        return '/web_forward_CuttingApplication';
    }
    return '';
};

const config = {
    basename: getBasename(),
    // ... other config
};
```

### 3. CORS Configuration

Updated Flask API CORS settings in `api-server-flask/api/__init__.py`:

```python
# Enable CORS - Updated to support VPN proxy access
allowed_origins = [
    "http://localhost:3000",           # Local development
    "http://172.27.57.210:3000",       # Direct VM access
    "http://127.0.0.1:3000",           # Local development alternative
    "https://sslvpn1.calzedonia.com"   # VPN proxy access
]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
```

### 4. API Call Fixes

Fixed API calls to use axios instance consistently:
- Updated login endpoint in `RestLogin.js`
- Fixed logout endpoint in `accountActions.js`
- Ensured all API calls use relative paths with axios instance

### 5. Package.json Scripts

Added environment-specific build and start scripts:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "start:local": "env-cmd -f .env.local react-scripts start",
    "start:vm": "env-cmd -f .env.vm react-scripts start",
    "start:vpn": "env-cmd -f .env.vpn react-scripts start",
    "build": "react-scripts build",
    "build:local": "env-cmd -f .env.local react-scripts build",
    "build:vm": "env-cmd -f .env.vm react-scripts build",
    "build:vpn": "env-cmd -f .env.vpn react-scripts build"
  }
}
```

## Deployment Instructions

### For VPN Proxy Deployment

1. **Install dependencies** (if env-cmd is not already installed):
   ```bash
   cd react-flask-authentication/react-ui
   npm install
   ```

2. **Build for VPN proxy**:
   ```bash
   npm run build:vpn
   ```

3. **Deploy the built files** to the web server serving on port 3000

4. **Ensure Flask API** is running on port 5000 with updated CORS settings

### For Local Development

1. **Use local environment**:
   ```bash
   npm run start:local
   ```

### For Direct VM Access

1. **Use VM environment**:
   ```bash
   npm run start:vm
   ```

## Testing and Validation

### Frontend Testing
1. Access the application via: `https://sslvpn1.calzedonia.com/web_forward_CuttingApplication/`
2. Verify all routes work correctly with the proxy path prefix
3. Check browser developer tools for any 404 errors or CORS issues

### API Testing
1. Verify API calls are made to: `https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/api/`
2. Test login functionality
3. Test all major API endpoints (mattress, orders, etc.)
4. Check network tab for successful API responses

### Common Issues and Solutions

1. **CORS Errors**: Ensure Flask API includes VPN domain in allowed origins
2. **404 on Routes**: Verify basename is correctly set in React Router
3. **API 404 Errors**: Check that API calls use relative paths with axios instance
4. **Static Assets**: Ensure build process correctly handles proxy paths

## Security Considerations

- All communication through VPN proxy uses HTTPS
- CORS is properly configured to only allow specific origins
- No sensitive information is exposed in client-side configuration
- Environment variables are used for configuration management

## Maintenance

When updating the application:
1. Always test with all three environments (local, VM, VPN)
2. Ensure new API calls use the axios instance
3. Verify CORS settings remain appropriate
4. Test routing with proxy paths

## Rollback Plan

If issues occur with VPN proxy setup:
1. Switch back to direct VM access by updating `.env`:
   ```bash
   REACT_APP_BACKEND_SERVER=http://172.27.57.210:5000/api
   ```
2. Update config.js to use empty basename:
   ```javascript
   basename: '',
   ```
3. Rebuild and redeploy
