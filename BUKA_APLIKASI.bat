@echo off
title Smart Grocery Tracker (DT2)
color 0A

echo ========================================================
echo    SMART GROCERY TRACKER - DAILY TEST 2 (DT2)
echo ========================================================
echo.
echo [1/2] Menyiapkan server lokal...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [2/2] Node.js terdeteksi. Membuka http://localhost:3000/ di browser...
    start "" http://localhost:3000/
    node server.js
) else (
    echo [2/2] Node.js tidak ditemukan di PATH.
    echo Membuka aplikasi langsung via index.html di browser...
    start "" index.html
)

pause
