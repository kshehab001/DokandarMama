wo@echo off
set ADB="C:\Users\Surface\AppData\Local\Android\Sdk\platform-tools\adb.exe"
echo ==============================================
echo   Dokandar Mama - Android Phone Installer
echo ==============================================
echo.
echo Waiting for device authorization...
echo (Please check your phone screen and tap 'Allow' if prompted)
echo.
%ADB% wait-for-device
echo Device authorized! Installing DokandarMama-debug.apk...
%ADB% install -r "%~dp0DokandarMama-debug.apk"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================
    echo   Installation successful! Launching app...
    echo ==============================================
    %ADB% shell monkey -p com.dokandarmama.app -c android.intent.category.LAUNCHER 1
) else (
    echo.
    echo Installation failed. Please ensure your phone is unlocked and try again.
)
echo.
pause
