@echo off
echo ==========================================
echo Dlea Local Deployment (Windows)
echo ==========================================

echo.
echo Step 1: Building frontend...
call npm ci 2>/dev/null || call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)
echo Frontend built successfully!

echo.
echo Step 2: Creating deployment archive...
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

tar czf %TEMP%\dlea-deploy-%TIMESTAMP%.tar.gz --exclude=node_modules --exclude=.output --exclude=.tanstack --exclude=backend/.venv --exclude=backend/__pycache__ --exclude=*.pyc --exclude=backend/db.sqlite3 --exclude=.git --exclude=.freebuff .
echo Archive created!

echo.
echo Step 3: Uploading to server...
scp %TEMP%\dlea-deploy-%TIMESTAMP%.tar.gz ghafari@37.255.212.55:/tmp/
if %errorlevel% neq 0 (
    echo Upload failed! Make sure you are connected to MCI network.
    exit /b 1
)
echo Upload complete!

echo.
echo Step 4: Deploying on server...
ssh ghafari@37.255.212.55 "bash deploy/deploy.sh"
if %errorlevel% neq 0 (
    echo Deployment failed on server!
    exit /b 1
)

del %TEMP%\dlea-deploy-%TIMESTAMP%.tar.gz

echo.
echo ==========================================
echo Deployment complete!
echo https://dlea.piqagram.ir
echo ==========================================
