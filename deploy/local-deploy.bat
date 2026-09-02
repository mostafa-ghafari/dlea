@echo off
echo ==========================================
echo Dlea Local Deployment
echo ==========================================

echo.
echo Step 1: Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)
echo Build OK!

echo.
echo Step 2: Creating archive...
tar czf %TEMP%\dlea-deploy.tar.gz --exclude=node_modules --exclude=.output --exclude=.tanstack --exclude=.git --exclude=.freebuff --exclude=*.log .
echo Archive created!

echo.
echo Step 3: Uploading to server...
scp %TEMP%\dlea-deploy.tar.gz ghafari@37.255.212.55:/tmp/
scp deploy/deploy.sh ghafari@37.255.212.55:/tmp/
if %errorlevel% neq 0 (
    echo Upload failed!
    exit /b 1
)
echo Upload OK!

echo.
echo Step 4: Deploying on server...
ssh ghafari@37.255.212.55 "bash /tmp/deploy.sh"
if %errorlevel% neq 0 (
    echo Deploy failed!
    exit /b 1
)

del %TEMP%\dlea-deploy.tar.gz

echo.
echo ==========================================
echo Done! https://dlea.piqagram.ir
echo ==========================================
