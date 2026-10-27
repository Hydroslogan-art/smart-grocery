@echo off
title Smart Grocery App Launcher
echo ==============================================
echo Menjalankan Smart Grocery Tracker...
echo Aplikasi akan terbuka otomatis di browser!
echo URL: http://localhost:3000/
echo ==============================================
cd /d "%~dp0"
start "" http://localhost:3000/
node server.js
pause
