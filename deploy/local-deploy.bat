@echo off
echo ==========================================
echo Dlea Local Deployment
echo ==========================================

set WHEELS_DIR=%TEMP%\pip-wheels
set WHEEL_ENV=%TEMP%\dlea-wheel-env

rem Step 1: Build frontend
echo.
echo Step 1: Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)
echo Build OK!

rem Step 2: Build pip wheels for offline install
echo.
echo Step 2: Building pip wheels for offline install...
if exist "%WHEELS_DIR%" rmdir /s /q "%WHEELS_DIR%"
mkdir "%WHEELS_DIR%"
if exist "%WHEEL_ENV%" rmdir /s /q "%WHEEL_ENV%"
python -m venv "%WHEEL_ENV%" 2>nul || python3 -m venv "%WHEEL_ENV%" 2>nul
"%WHEEL_ENV%\Scripts\pip.exe" install --upgrade pip -q 2>nul
"%WHEEL_ENV%\Scripts\pip.exe" wheel -r backend\requirements.txt -w "%WHEELS_DIR%" -q
if %errorlevel% neq 0 (
    echo Warning: Could not build wheels, will fall back to PyPI on server
)
for %%f in ("%WHEELS_DIR%\*.whl") do set /a WHEEL_COUNT+=1
if defined WHEEL_COUNT echo Built %WHEEL_COUNT% wheels

rem Step 3: Create archive with wheels
echo.
echo Step 3: Creating deployment archive...
tar czf %TEMP%\dlea-deploy.tar.gz --exclude=node_modules --exclude=.tanstack --exclude=.git --exclude=.freebuff --exclude=*.log --exclude=backend/.venv -C "%TEMP%" pip-wheels .
echo Archive created!

rem Cleanup temp wheel build
del /q "%WHEELS_DIR%\*.whl" 2>nul
rmdir /s /q "%WHEELS_DIR%" 2>nul
rmdir /s /q "%WHEEL_ENV%" 2>nul

rem Step 4: Upload to server
echo.
echo Step 4: Uploading to server...
scp %TEMP%\dlea-deploy.tar.gz ghafari@37.255.212.55:/tmp/
scp deploy/deploy.sh ghafari@37.255.212.55:/tmp/
if %errorlevel% neq 0 (
    echo Upload failed!
    exit /b 1
)
echo Upload OK!

rem Step 5: Deploy on server
echo.
echo Step 5: Deploying on server...
ssh ghafari@37.255.212.55 "sed -i 's/\r$//' /tmp/deploy.sh && bash /tmp/deploy.sh"
if %errorlevel% neq 0 (
    echo Deploy failed!
    exit /b 1
)

del %TEMP%\dlea-deploy.tar.gz

echo.
echo ==========================================
echo Done! https://dlea.piqagram.ir
echo ==========================================
