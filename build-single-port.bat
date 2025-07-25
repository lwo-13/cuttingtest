@echo off
echo ========================================
echo BUILDING SINGLE PORT SOLUTION (LOCAL)
echo ========================================

echo.
echo Step 1: Building React frontend...
cd react-flask-authentication\react-ui

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing React dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
)

echo Building React production build...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: React build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: React build completed successfully!
echo Build files created in: react-ui\build\

echo.
echo Step 3: Starting Flask server (serves both frontend and API)...
cd ..\api-server-flask

echo Installing Python dependencies if needed...
pip install -r requirements.txt

echo Starting Flask server on port 5000...
python run.py

echo.
echo ========================================
echo SINGLE PORT SOLUTION READY!
echo ========================================
echo.
echo Access the application at:
echo - Local: http://localhost:5000
echo - VM: http://gab-navint01p.csg1.sys.calzedonia.com:5000
echo - VPN: https://sslvpn1.calzedonia.com/web_forward_CuttingApplicationAPI/
echo.
echo ✅ Frontend served from Flask (no port 3000 needed)
echo ✅ API served from Flask (port 5000)
echo ✅ Single authentication context for VPN
echo ✅ No dual-port authentication issues
echo.
pause
