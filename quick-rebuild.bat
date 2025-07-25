@echo off
echo ========================================
echo SUPER FAST REBUILD - NO NODE.JS INSTALL
echo ========================================

echo.
echo Current directory: %CD%
echo Target: D:\cuttingtest\react-flask-authentication

echo.
echo Step 1: Checking for Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Node.js not found! Installing Node.js...
    echo.
    echo Option 1: Install Node.js manually from https://nodejs.org/
    echo Option 2: Use winget if available:
    echo    winget install OpenJS.NodeJS
    echo.
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

echo.
echo Step 2: Navigating to React directory...
cd /d D:\cuttingtest\react-flask-authentication\react-ui
if %ERRORLEVEL% neq 0 (
    echo ERROR: Could not navigate to React directory
    pause
    exit /b 1
)

echo.
echo Step 3: Installing/updating React dependencies (cached)...
if not exist "node_modules" (
    echo Installing Node modules for first time...
    npm install --production=false
) else (
    echo Node modules exist, checking for updates...
    npm ci --production=false
)

echo.
echo Step 4: Building React app with environment detection...
npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: React build failed!
    pause
    exit /b 1
)

echo.
echo Step 5: Copying fresh React build to Docker container...
docker cp build cutting_app_single_port:/app/react-ui/
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker copy failed!
    pause
    exit /b 1
)

echo.
echo Step 6: Restarting container...
cd ..
docker-compose -f docker-compose-single-port.yml restart

echo.
echo ========================================
echo ✅ SUPER FAST REBUILD COMPLETE!
echo ========================================
echo.
echo Test URLs:
echo VM:  http://172.27.57.210:5000
echo VPN: https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/
echo.
echo 🚀 Total time: ~2-3 minutes (Node.js cached)
echo 🚀 Future rebuilds: ~30 seconds (everything cached)
echo.
pause
