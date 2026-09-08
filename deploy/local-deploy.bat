@echo off
echo ==========================================
echo Dlea Local Deployment  
echo ==========================================

rem Step 1: Build frontend
echo.
echo Step 1: Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)
echo Build OK!

rem Step 2: Download pip packages for Linux server
echo.
echo Step 2: Downloading pip packages for Linux...
set WHEEL_ENV=%TEMP%\dlea-wheel-env
if exist "%WHEEL_ENV%" rmdir /s /q "%WHEEL_ENV%"
python -m venv "%WHEEL_ENV%" 2>nul || python3 -m venv "%WHEEL_ENV%" 2>nul
"%WHEEL_ENV%\Scripts\pip.exe" install --upgrade pip -q 2>nul

rem Single download: Linux binary wheels + pure Python wheels (no version filter)
"%WHEEL_ENV%\Scripts\pip.exe" download -r backend\requirements.txt -d pip-wheels --platform manylinux2014_x86_64 --platform manylinux_2_17_x86_64 --platform any --python-version 36 --python-version 37 --python-version 38 --python-version 39 --python-version 310 --python-version 311 --python-version 312 --python-version 313 --only-binary=:all:

if %errorlevel% neq 0 (
    echo.
    echo Warning: Some packages failed with --only-binary, retrying without...
    "%WHEEL_ENV%\Scripts\pip.exe" download -r backend\requirements.txt -d pip-wheels --platform manylinux2014_x86_64 --platform manylinux_2_17_x86_64 --platform any --python-version 36 --python-version 37 --python-version 38 --python-version 39 --python-version 310 --python-version 311 --python-version 312 --python-version 313
)

set WHEEL_COUNT=0
for %%f in (pip-wheels\*.whl) do set /a WHEEL_COUNT+=1
if %WHEEL_COUNT% gtr 0 echo Downloaded %WHEEL_COUNT% packages

rem Cleanup temp venv
rmdir /s /q "%WHEEL_ENV%" 2>nul

rem Step 3: Create archive
echo.
echo Step 3: Creating deployment archive...
tar czf %TEMP%\dlea-deploy.tar.gz --exclude=node_modules --exclude=.output --exclude=.tanstack --exclude=.git --exclude=.freebuff --exclude=*.log --exclude=backend/.venv --exclude=backend/__pycache__ --exclude=*.pyc --exclude=backend/db.sqlite3 --exclude=test-results --exclude=smoke-test .
echo Archive created!
del /q pip-wheels\*.* 2>nul
rmdir /s /q pip-wheels 2>nul

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
