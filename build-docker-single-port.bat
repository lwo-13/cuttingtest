@echo off
echo ========================================
echo BUILDING DOCKER SINGLE PORT SOLUTION
echo Windows Server 2025 - Docker Desktop
echo ========================================

echo.
echo Current directory: %CD%
echo Target directory: D:\cuttingtest\react-flask-authentication

echo.
echo Step 1: Navigating to project directory...
cd /d D:\cuttingtest\react-flask-authentication
if %ERRORLEVEL% neq 0 (
    echo ERROR: Could not navigate to D:\cuttingtest\react-flask-authentication
    echo Please check if the directory exists.
    pause
    exit /b 1
)

echo.
echo Step 2: Stopping any existing containers...
docker-compose -f docker-compose-single-port.yml down

echo.
echo Step 3: Cleaning up old Docker images...
docker image prune -f

echo.
echo Step 4: Building single port container...
echo This will:
echo - Install Node.js in the container
echo - Build React app inside container
echo - Install Python dependencies
echo - Configure Flask to serve both frontend and API

docker-compose -f docker-compose-single-port.yml build --no-cache

if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker build failed!
    echo Check the build logs above for details.
    pause
    exit /b 1
)

echo.
echo Step 5: Starting single port container...
docker-compose -f docker-compose-single-port.yml up -d

if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker start failed!
    pause
    exit /b 1
)

echo.
echo Step 6: Waiting for container to be ready...
timeout /t 15

echo.
echo Step 7: Checking container health...
docker-compose -f docker-compose-single-port.yml ps

echo.
echo ========================================
echo DOCKER SINGLE PORT SOLUTION READY!
echo ========================================
echo.
echo Container Status:
docker ps --filter "name=cutting_app_single_port" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Access URLs:
echo - Local: http://localhost:5000
echo - VM: http://gab-navint01p.csg1.sys.calzedonia.com:5000
echo - VPN: https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/
echo.
echo ✅ Single container serves both frontend and API
echo ✅ No dual-port authentication issues
echo ✅ Simplified deployment and maintenance
echo.
echo Useful commands:
echo - View logs: docker-compose -f docker-compose-single-port.yml logs -f
echo - Stop: docker-compose -f docker-compose-single-port.yml down
echo - Restart: docker-compose -f docker-compose-single-port.yml restart
echo.
pause
