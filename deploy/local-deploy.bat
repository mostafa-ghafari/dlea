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

rem Step 2: Download pip packages for Linux server (Python 3.12)
echo.
echo Step 2: Downloading pip packages for Linux (Python 3.12)...
set WHEEL_ENV=%TEMP%\dlea-wheel-env
if exist "%WHEEL_ENV%" rmdir /s /q "%WHEEL_ENV%"
python -m venv "%WHEEL_ENV%" 2>nul || python3 -m venv "%WHEEL_ENV%" 2>nul
"%WHEEL_ENV%\Scripts\pip.exe" install --upgrade pip -q 2>nul

"%WHEEL_ENV%\Scripts\pip.exe" download -r backend\requirements.txt typing-extensions -d pip-wheels --platform manylinux2014_x86_64 --platform manylinux_2_17_x86_64 --platform any --python-version 312 --only-binary=:all:

if %errorlevel% neq 0 (
    echo.
    echo Retrying without --only-binary for source distributions...
    "%WHEEL_ENV%\Scripts\pip.exe" download -r backend\requirements.txt typing-extensions -d pip-wheels --python-version 312
)

if %errorlevel% neq 0 (
    echo.
    echo Retrying via Aliyun mirror...
    "%WHEEL_ENV%\Scripts\pip.exe" download -r backend\requirements.txt typing-extensions -d pip-wheels --platform manylinux2014_x86_64 --platform manylinux_2_17_x86_64 --platform any --python-version 312 --only-binary=:all: -i https://mirrors.aliyun.com/pypi/simple/
)

set WHEEL_COUNT=0
for %%f in (pip-wheels\*.whl) do set /a WHEEL_COUNT+=1
if %WHEEL_COUNT% gtr 0 echo Downloaded %WHEEL_COUNT% packages

rem Validate the bundle covers the server's Python 3.12 dependency closure
"%WHEEL_ENV%\Scripts\python.exe" deploy\check_wheels.py pip-wheels backend\requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo Wheel bundle incomplete - fix before deploying!
    exit /b 1
)
rmdir /s /q "%WHEEL_ENV%" 2>nul

rem Step 3: Create archive
echo.
echo Step 3: Creating deployment archive...
tar czf %TEMP%\dlea-deploy.tar.gz --exclude=node_modules --exclude=.tanstack --exclude=.git --exclude=.freebuff --exclude=*.log --exclude=backend/.venv --exclude=backend/__pycache__ --exclude=*.pyc --exclude=backend/db.sqlite3 --exclude=test-results --exclude=smoke-test .
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
